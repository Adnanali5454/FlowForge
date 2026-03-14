// ─── Sub-Workflow Step Executor ─────────────────────────────────────────────
// Executes another workflow by ID with input mapping and wait-for-completion.
// Includes circular reference detection.

import type { SubWorkflowConfig, WorkflowDefinition } from '@/types';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { WorkflowExecutor, type ExecutionState } from '../executor/workflow-executor';
import { resolveInputMappings } from '../data-mapper';
import type { ExecutionContext } from '../data-mapper';

export interface SubWorkflowResult {
  targetWorkflowId: string;
  executionId: string;
  status: string;
  stepsExecuted: number;
  error: string | null;
  output: Record<string, unknown> | null;
  durationMs: number;
}

/**
 * Execute a sub-workflow step.
 */
export async function executeSubWorkflow(
  config: SubWorkflowConfig,
  context: ExecutionContext,
  currentWorkflowId: string,
  visitedWorkflows: Set<string> = new Set()
): Promise<SubWorkflowResult> {
  const startTime = Date.now();
  const { targetWorkflowId, inputMapping, waitForCompletion } = config;

  // Check for circular reference
  if (visitedWorkflows.has(targetWorkflowId)) {
    throw new Error(
      `Circular workflow reference detected: ${currentWorkflowId} -> ${targetWorkflowId}`
    );
  }

  // Fetch the target workflow definition
  const workflowRow = await db
    .select()
    .from(schema.workflowDefinitions)
    .where(eq(schema.workflowDefinitions.id, targetWorkflowId as never))
    .limit(1);

  if (workflowRow.length === 0) {
    throw new Error(`Target workflow not found: ${targetWorkflowId}`);
  }

  const workflowData = workflowRow[0];
  const workflow: WorkflowDefinition = {
    id: workflowData.id,
    workspaceId: workflowData.workspaceId,
    name: workflowData.name,
    description: workflowData.description,
    status: workflowData.status as never,
    version: workflowData.version,
    trigger: workflowData.trigger as never,
    steps: workflowData.steps as never,
    variables: workflowData.variables as never,
    settings: workflowData.settings as never,
    createdAt: workflowData.createdAt.toISOString(),
    updatedAt: workflowData.updatedAt.toISOString(),
    createdBy: workflowData.createdBy,
    folderId: workflowData.folderId,
    tags: workflowData.tags as never,
  };

  // Resolve input mappings to get trigger data for the sub-workflow
  const triggerData = resolveInputMappings(inputMapping, context);

  // Mark workflow as visited to detect circular refs
  visitedWorkflows.add(targetWorkflowId);

  try {
    // Create and execute the sub-workflow
    const executor = new WorkflowExecutor(workflow, triggerData);
    let executionState: ExecutionState;

    if (waitForCompletion) {
      // Wait for completion
      executionState = await executor.execute();
    } else {
      // Start async execution but don't wait
      // For now, we'll still wait since we need results
      // A true async implementation would queue the execution
      executionState = await executor.execute();
    }

    return {
      targetWorkflowId,
      executionId: executionState.id,
      status: executionState.status,
      stepsExecuted: executionState.stepsExecuted,
      error: executionState.error,
      output: {
        triggerData: executionState.triggerData,
        stepsExecuted: executionState.stepsExecuted,
      },
      durationMs: Date.now() - startTime,
    };
  } finally {
    // Always remove from visited workflows
    visitedWorkflows.delete(targetWorkflowId);
  }
}
