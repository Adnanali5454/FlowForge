import { db, schema } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Atomically increment the workspace task counter.
 * Uses a single SQL UPDATE to avoid read-modify-write race conditions.
 */
export async function incrementWorkspaceTaskCount(workspaceId: string): Promise<void> {
  await db.update(schema.workspaces)
    .set({
      usedTasksThisMonth: sql`used_tasks_this_month + 1`,
      updatedAt: new Date(),
    })
    .where(eq(schema.workspaces.id, workspaceId));
}
