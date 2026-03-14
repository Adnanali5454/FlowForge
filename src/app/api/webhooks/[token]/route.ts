// ─── Dynamic Webhook Handler ────────────────────────────────────────────────
// POST /api/webhooks/[token] — Receive incoming webhook and trigger workflow

import '@/lib/startup';
import { waitUntil } from '@vercel/functions';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { WorkflowExecutor } from '@/lib/engine';
import { logAudit, getClientIpAddress } from '@/lib/audit';
import { incrementWorkspaceTaskCount } from '@/lib/billing';
import type { WorkflowDefinition, TriggerConfig, StepConfig, WorkflowSettings, WorkflowVariable } from '@/types';

interface RouteContext {
  params: {
    token: string;
  };
}

/**
 * Fire-and-forget function that runs the workflow after the webhook response
 * has been returned to the caller.
 */
async function executeWebhookWorkflow(
  workflow: WorkflowDefinition,
  webhookPayload: Record<string, unknown>,
  executionId: string,
  workspaceId: string
): Promise<void> {
  try {
    const executor = new WorkflowExecutor(workflow, webhookPayload, {
      onStepStart: async (step) => {
        await db.insert(schema.stepExecutions).values({
          executionId,
          stepId: step.stepId,
          stepIndex: step.stepIndex,
          stepType: step.stepType,
          stepName: step.stepName,
          status: 'running',
          inputData: step.inputData,
          outputData: null,
          error: null,
          retryCount: step.retryCount,
          startedAt: step.startedAt,
          completedAt: null,
          durationMs: null,
        });
      },
      onStepComplete: async (step) => {
        // UPDATE the existing row with final status
        await db.update(schema.stepExecutions)
          .set({
            status: step.status,
            outputData: step.outputData ?? null,
            error: step.error ?? null,
            completedAt: step.completedAt ?? new Date(),
            durationMs: step.durationMs ?? 0,
            retryCount: step.retryCount ?? 0,
          })
          .where(
            and(
              eq(schema.stepExecutions.executionId, executionId),
              eq(schema.stepExecutions.stepId, step.stepId)
            )
          );
      },
      onStepError: async (step, _error) => {
        // UPDATE the existing row with error status
        await db.update(schema.stepExecutions)
          .set({
            status: step.status,
            outputData: step.outputData ?? null,
            error: step.error ?? null,
            completedAt: step.completedAt ?? new Date(),
            durationMs: step.durationMs ?? 0,
            retryCount: step.retryCount ?? 0,
          })
          .where(
            and(
              eq(schema.stepExecutions.executionId, executionId),
              eq(schema.stepExecutions.stepId, step.stepId)
            )
          );
      },
    });

    const result = await executor.execute();

    // Update execution record with final status
    await db
      .update(schema.workflowExecutions)
      .set({
        status: result.status,
        stepsExecuted: result.stepsExecuted,
        error: result.error,
        outputData: executor.toJSON().steps,
        completedAt: result.completedAt,
        durationMs: result.completedAt
          ? result.completedAt.getTime() - result.startedAt.getTime()
          : null,
      })
      .where(eq(schema.workflowExecutions.id, executionId));

    // Atomically increment workspace task count
    await incrementWorkspaceTaskCount(workspaceId);
  } catch (error) {
    console.error(`Error executing webhook workflow ${workflow.id}:`, error);
    // Update execution with error
    await db
      .update(schema.workflowExecutions)
      .set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      })
      .where(eq(schema.workflowExecutions.id, executionId))
      .catch(() => {
        // Silently fail on DB error
      });
  }
}

/**
 * POST /api/webhooks/[token] — Receive webhook payload and trigger workflow
 * Token is looked up in workflowStorage to find the associated workflow
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { token } = context.params;

    // Validate token format
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Parse request body — accept JSON, form-urlencoded, or raw text
    let webhookPayload: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text.length > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Payload too large (max 10MB)' }, { status: 413 });
      }
      try {
        webhookPayload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        try {
          webhookPayload = Object.fromEntries(new URLSearchParams(text).entries());
        } catch {
          webhookPayload = { rawBody: text };
        }
      }
    } catch {
      return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
    }

    // Look up webhook token in workflowStorage
    const [webhookRecord] = await db
      .select()
      .from(schema.workflowStorage)
      .where(
        and(
          eq(schema.workflowStorage.namespace, 'webhooks'),
          eq(schema.workflowStorage.key, token)
        )
      );

    if (!webhookRecord) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const workflowId = webhookRecord.value;
    const workspaceId = webhookRecord.workspaceId;

    // Fetch workflow definition
    const [workflowRow] = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(eq(schema.workflowDefinitions.id, workflowId));

    if (!workflowRow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // [29] Status guard — reject paused/archived workflows
    if (workflowRow.status === 'paused' || workflowRow.status === 'archived') {
      return NextResponse.json(
        { error: `Workflow is ${workflowRow.status} and cannot be executed` },
        { status: 409 }
      );
    }

    // Build WorkflowDefinition
    const workflow: WorkflowDefinition = {
      id: workflowRow.id,
      workspaceId: workflowRow.workspaceId,
      name: workflowRow.name,
      description: workflowRow.description,
      status: workflowRow.status,
      version: workflowRow.version,
      trigger: workflowRow.trigger as TriggerConfig,
      steps: workflowRow.steps as StepConfig[],
      variables: workflowRow.variables as Record<string, WorkflowVariable>,
      settings: workflowRow.settings as WorkflowSettings,
      createdAt: workflowRow.createdAt.toISOString(),
      updatedAt: workflowRow.updatedAt.toISOString(),
      createdBy: workflowRow.createdBy,
      folderId: workflowRow.folderId,
      tags: workflowRow.tags as string[],
    };

    // Create execution record
    const [executionRow] = await db
      .insert(schema.workflowExecutions)
      .values({
        workflowId,
        workspaceId,
        status: 'running',
        triggerData: webhookPayload,
        stepsTotal: workflow.steps.length,
      })
      .returning();

    // Log audit event for webhook receipt
    const ipAddress = getClientIpAddress(request.headers);
    await logAudit(
      workspaceId,
      null,
      'webhook_received',
      'workflow_execution',
      workflowId,
      { token, executionId: executionRow.id },
      ipAddress
    );

    // [27] Use waitUntil to run workflow execution after response is sent
    waitUntil(executeWebhookWorkflow(workflow, webhookPayload, executionRow.id, workspaceId));

    // Return 200 immediately
    return NextResponse.json(
      {
        received: true,
        executionId: executionRow.id,
        timestamp: new Date().toISOString(),
        message: 'Webhook received. Workflow execution queued.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/webhooks/[token] error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
