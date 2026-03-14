// ─── Executions API ─────────────────────────────────────────────────────────
// GET  /api/executions      — List executions for a workflow
// POST /api/executions      — Trigger a manual workflow execution

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { WorkflowExecutor } from '@/lib/engine';
import { logAudit, getClientIpAddress } from '@/lib/audit';
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
        // Log step execution to DB with final status
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

    // Update workspace task count and check/reset task reset date
    const workspace = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, session.workspaceId));

    if (workspace.length > 0) {
      const ws = workspace[0];
      const taskResetDate = ws.taskResetDate ? new Date(ws.taskResetDate) : null;
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
      const resetMonth = taskResetDate ? taskResetDate.toISOString().slice(0, 7) : null;

      let newUsedTasks = (ws.usedTasksThisMonth || 0) + 1; // Increment by 1 (each execution = 1 task)
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
        .where(eq(schema.workspaces.id, session.workspaceId));
    }

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
