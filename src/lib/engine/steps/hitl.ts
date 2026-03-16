// ─── Human-in-the-Loop Step Executor ────────────────────────────────────────
// Creates an approval request and pauses execution waiting for human decision.
// Stores request metadata using the workflowStorage table.

import type { HitlConfig } from '@/types';
import { db, schema } from '@/lib/db';
import { generateId } from '@/lib/utils';

export interface HitlResult {
  status: 'waiting';
  approvalId: string;
  assigneeEmail: string;
  instructions: string;
  deadline: number;
  deadlineAction: string;
  escalateTo: string | null;
  fields: Array<{ key: string; label: string; type: string; options: string[]; required: boolean }>;
}

/**
 * Execute a Human-in-the-Loop step.
 * Creates an approval request and returns a waiting status.
 * The executor will set execution status to 'waiting'.
 */
export async function executeHitl(
  config: HitlConfig,
  workspaceId: string,
  executionId: string,
  stepId: string
): Promise<HitlResult> {
  const approvalId = generateId('approval');

  // Store approval request metadata in workflow storage
  const approvalData = {
    approvalId,
    executionId,
    stepId,
    assigneeEmail: config.assigneeEmail,
    instructions: config.instructions,
    deadline: config.deadline,
    deadlineAction: config.deadlineAction,
    escalateTo: config.escalateTo,
    fields: config.fields,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  await db
    .insert(schema.workflowStorage)
    .values({
      workspaceId: workspaceId as string,
      namespace: 'hitl_requests',
      key: approvalId,
      value: JSON.stringify(approvalData),
      updatedAt: new Date(),
    });

  return {
    status: 'waiting',
    approvalId,
    assigneeEmail: config.assigneeEmail,
    instructions: config.instructions,
    deadline: config.deadline,
    deadlineAction: config.deadlineAction,
    escalateTo: config.escalateTo,
    fields: config.fields,
  };
}
