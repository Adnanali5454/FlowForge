// ─── Dynamic Webhook Handler ────────────────────────────────────────────────
// POST /api/webhooks/[token] — Receive incoming webhook and trigger workflow

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { WorkflowExecutor } from '@/lib/engine';
import { logAudit, getClientIpAddress } from '@/lib/audit';
import type { WorkflowDefinition, TriggerConfig, StepConfig, WorkflowSettings, WorkflowVariable } from '@/types';

interface RouteContext {
  params: {
    token: string;
  };
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

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Parse request body
    let webhookPayload: Record<string, unknown> = {};
    try {
      const text = await request.text();
      // Check size limit (10MB)
      if (text.length > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Request body too large (max 10MB)' },
          { status: 413 }
        );
      }
      webhookPayload = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
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

    // Fire-and-forget: Execute workflow asynchronously without awaiting
    // Use Promise.catch to prevent unhandled rejection warnings
    (async () => {
      try {
        const executor = new WorkflowExecutor(workflow, webhookPayload, {
          onStepComplete: async (step) => {
            // Log step execution to DB
            await db.insert(schema.stepExecutions).values({
              executionId: executionRow.id,
              stepId: step.stepId,
              stepIndex: step.stepIndex,
              stepType: step.stepType,
              stepName: step.stepName,
              status: step.status,
              inputData: step.inputData,
              outputData: step.outputData,
              error: step.error,
              retryCount: step.retryCount,
              startedAt: step.startedAt,
              completedAt: step.completedAt,
              durationMs: step.durationMs,
            });
          },
          onStepError: async (step, _error) => {
            // Log step error to DB
            await db.insert(schema.stepExecutions).values({
              executionId: executionRow.id,
              stepId: step.stepId,
              stepIndex: step.stepIndex,
              stepType: step.stepType,
              stepName: step.stepName,
              status: step.status,
              inputData: step.inputData,
              outputData: step.outputData,
              error: step.error,
              retryCount: step.retryCount,
              startedAt: step.startedAt,
              completedAt: step.completedAt,
              durationMs: step.durationMs,
            });
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
          .where(eq(schema.workflowExecutions.id, executionRow.id));

        // Update workspace task count (increment by 1 for webhook execution)
        const workspace = await db
          .select()
          .from(schema.workspaces)
          .where(eq(schema.workspaces.id, workspaceId));

        if (workspace.length > 0) {
          const ws = workspace[0];
          const taskResetDate = ws.taskResetDate ? new Date(ws.taskResetDate) : null;
          const now = new Date();
          const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
          const resetMonth = taskResetDate ? taskResetDate.toISOString().slice(0, 7) : null;

          let newUsedTasks = (ws.usedTasksThisMonth || 0) + 1;
          let newResetDate = taskResetDate;

          // Reset if month has changed
          if (!resetMonth || resetMonth !== currentMonth) {
            newUsedTasks = 1;
            newResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          }

          await db
            .update(schema.workspaces)
            .set({
              usedTasksThisMonth: newUsedTasks,
              taskResetDate: newResetDate,
            })
            .where(eq(schema.workspaces.id, workspaceId));
        }
      } catch (error) {
        console.error(`Error executing webhook workflow ${workflowId}:`, error);
        // Update execution with error
        await db
          .update(schema.workflowExecutions)
          .set({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          })
          .where(eq(schema.workflowExecutions.id, executionRow.id))
          .catch(() => {
            // Silently fail on DB error
          });
      }
    })().catch(() => {
      // Prevent unhandled rejection
    });

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
