// ─── Executions API ─────────────────────────────────────────────────────────
// GET  /api/executions      — List executions for a workflow
// POST /api/executions      — Trigger a manual workflow execution

import '@/lib/startup';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { WorkflowExecutor } from '@/lib/engine';
import { logAudit, getClientIpAddress } from '@/lib/audit';
import { incrementWorkspaceTaskCount } from '@/lib/billing';
import type { WorkflowDefinition, TriggerConfig, StepConfig, WorkflowSettings, WorkflowVariable } from '@/types';

/**
 * GET /api/executions — List executions
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const workflowId = request.nextUrl.searchParams.get('workflowId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10);

    const conditions = [
      eq(schema.workflowExecutions.workspaceId, session.workspaceId),
    ];
    if (workflowId) {
      conditions.push(eq(schema.workflowExecutions.workflowId, workflowId));
    }

    const executions = await db
      .select()
      .from(schema.workflowExecutions)
      .where(and(...conditions))
      .orderBy(desc(schema.workflowExecutions.startedAt))
      .limit(limit);

    return NextResponse.json({ executions });
  } catch (error) {
    console.error('GET /api/executions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/executions — Trigger a manual workflow execution
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const body = await request.json();
    const { workflowId, triggerData = {} } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'workflowId is required' }, { status: 400 });
    }

    // Fetch the workflow
    const [workflowRow] = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(
        and(
          eq(schema.workflowDefinitions.id, workflowId),
          eq(schema.workflowDefinitions.workspaceId, session.workspaceId)
        )
      );

    if (!workflowRow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflowRow.status === 'paused' || workflowRow.status === 'archived') {
      return NextResponse.json(
        { error: `Workflow is ${workflowRow.status} and cannot be executed` },
        { status: 409 }
      );
    }

    // Build the WorkflowDefinition from DB row
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

    // Log audit event for manual trigger
    const ipAddress = getClientIpAddress(request.headers);
    await logAudit(
      session.workspaceId,
      session.userId,
      'trigger',
      'workflow_execution',
      workflowId,
      { trigger: 'manual' },
      ipAddress
    );

    // Create execution record
    const [executionRow] = await db
      .insert(schema.workflowExecutions)
      .values({
        workflowId,
        workspaceId: session.workspaceId,
        status: 'running',
        triggerData,
        stepsTotal: workflow.steps.length,
      })
      .returning();

    // Execute the workflow with full logging callbacks
    const executor = new WorkflowExecutor(workflow, triggerData, {
      onStepStart: async (step) => {
        // Log step start to DB with 'running' status
        await db.insert(schema.stepExecutions).values({
          executionId: executionRow.id,
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
        // UPDATE the existing row (inserted by onStepStart) with final status
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
              eq(schema.stepExecutions.executionId, executionRow.id),
              eq(schema.stepExecutions.stepId, step.stepId)
            )
          );
      },
      onStepError: async (step, _error) => {
        // UPDATE the existing row (inserted by onStepStart) with error status
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
              eq(schema.stepExecutions.executionId, executionRow.id),
              eq(schema.stepExecutions.stepId, step.stepId)
            )
          );
      },
    });

    const result = await executor.execute();

    // Update execution record with final status and outputData
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

    // Atomically increment workspace task count
    await incrementWorkspaceTaskCount(session.workspaceId);

    return NextResponse.json({
      execution: {
        id: executionRow.id,
        ...executor.toJSON(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/executions error:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
