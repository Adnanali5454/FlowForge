// ─── Digest Step Executor ───────────────────────────────────────────────────
// Implements digest buffering using the digestEntries table.
// Actions: append (buffer data), release (flush batch)

import type { DigestConfig } from '@/types';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { resolveTemplate } from '@/lib/utils';

export interface DigestResult {
  action: string;
  digestKey: string;
  entryCount: number;
  entries: Array<Record<string, unknown>>;
}

/**
 * Execute a digest step.
 */
export async function executeDigest(
  config: DigestConfig,
  workspaceId: string,
  inputData: Record<string, unknown>
): Promise<DigestResult> {
  const { action, digestKey, template } = config;

  switch (action) {
    case 'append':
      return digestAppend(workspaceId, digestKey, template, inputData);

    case 'release':
      return digestRelease(workspaceId, digestKey);

    default:
      throw new Error(`Unknown digest action: ${action}`);
  }
}

/**
 * Append data to the digest buffer
 */
async function digestAppend(
  workspaceId: string,
  digestKey: string,
  template: string,
  inputData: Record<string, unknown>
): Promise<DigestResult> {
  // Resolve template to get the data to append
  const resolvedData = resolveTemplate(template, inputData);

  // Parse JSON if it's a JSON string, otherwise treat as plain text
  let dataToStore: Record<string, unknown>;
  try {
    dataToStore = JSON.parse(resolvedData) as Record<string, unknown>;
  } catch {
    dataToStore = { content: resolvedData };
  }

  // Insert into digest entries
  await db.insert(schema.digestEntries).values({
    workspaceId: workspaceId as string,
    digestKey,
    data: dataToStore,
    createdAt: new Date(),
  });

  // Return the appended entry
  return {
    action: 'append',
    digestKey,
    entryCount: 1,
    entries: [dataToStore],
  };
}

/**
 * Release (flush) all buffered entries for a digest key
 */
async function digestRelease(
  workspaceId: string,
  digestKey: string
): Promise<DigestResult> {
  // Fetch all entries for this digest key
  const entries = await db
    .select()
    .from(schema.digestEntries)
    .where(
      and(
        eq(schema.digestEntries.workspaceId, workspaceId as string),
        eq(schema.digestEntries.digestKey, digestKey)
      )
    );

  // Delete all entries
  await db
    .delete(schema.digestEntries)
    .where(
      and(
        eq(schema.digestEntries.workspaceId, workspaceId as string),
        eq(schema.digestEntries.digestKey, digestKey)
      )
    );

  return {
    action: 'release',
    digestKey,
    entryCount: entries.length,
    entries: entries.map((e) => e.data as Record<string, unknown>),
  };
}
