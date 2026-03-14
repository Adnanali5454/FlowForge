// ─── Storage Step Executor ──────────────────────────────────────────────────
// Key-value storage using the workflowStorage table.
// Actions: set, get, increment, decrement, delete, list

import type { StorageConfig } from '@/types';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export interface StorageResult {
  action: string;
  key: string;
  namespace: string;
  value: string | number | string[] | null;
  previousValue?: string | number | null;
}

/**
 * Execute a storage step.
 */
export async function executeStorage(
  config: StorageConfig,
  workspaceId: string
): Promise<StorageResult> {
  const { action, key, value, namespace } = config;

  switch (action) {
    case 'set':
      return storageSet(workspaceId, namespace, key, value ?? '');

    case 'get':
      return storageGet(workspaceId, namespace, key);

    case 'increment':
      return storageIncrement(workspaceId, namespace, key);

    case 'decrement':
      return storageDecrement(workspaceId, namespace, key);

    case 'delete':
      return storageDelete(workspaceId, namespace, key);

    case 'list':
      return storageList(workspaceId, namespace);

    default:
      throw new Error(`Unknown storage action: ${action}`);
  }
}

/**
 * Set a key-value pair (upsert)
 */
async function storageSet(
  workspaceId: string,
  namespace: string,
  key: string,
  value: string
): Promise<StorageResult> {
  // Check if key exists
  const existing = await db
    .select()
    .from(schema.workflowStorage)
    .where(
      and(
        eq(schema.workflowStorage.workspaceId, workspaceId as never),
        eq(schema.workflowStorage.namespace, namespace),
        eq(schema.workflowStorage.key, key)
      )
    )
    .limit(1);

  const previousValue = existing[0]?.value ?? null;

  if (existing.length > 0) {
    // Update existing
    await db
      .update(schema.workflowStorage)
      .set({
        value,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.workflowStorage.workspaceId, workspaceId as never),
          eq(schema.workflowStorage.namespace, namespace),
          eq(schema.workflowStorage.key, key)
        )
      );
  } else {
    // Insert new
    await db.insert(schema.workflowStorage).values({
      workspaceId: workspaceId as never,
      namespace,
      key,
      value,
      updatedAt: new Date(),
    });
  }

  return {
    action: 'set',
    key,
    namespace,
    value,
    previousValue,
  };
}

/**
 * Get a value by key
 */
async function storageGet(
  workspaceId: string,
  namespace: string,
  key: string
): Promise<StorageResult> {
  const result = await db
    .select()
    .from(schema.workflowStorage)
    .where(
      and(
        eq(schema.workflowStorage.workspaceId, workspaceId as never),
        eq(schema.workflowStorage.namespace, namespace),
        eq(schema.workflowStorage.key, key)
      )
    )
    .limit(1);

  const value = result[0]?.value ?? null;

  return {
    action: 'get',
    key,
    namespace,
    value,
  };
}

/**
 * Increment a numeric value
 */
async function storageIncrement(
  workspaceId: string,
  namespace: string,
  key: string
): Promise<StorageResult> {
  // Get current value
  const result = await db
    .select()
    .from(schema.workflowStorage)
    .where(
      and(
        eq(schema.workflowStorage.workspaceId, workspaceId as never),
        eq(schema.workflowStorage.namespace, namespace),
        eq(schema.workflowStorage.key, key)
      )
    )
    .limit(1);

  const previousValue = result[0]?.value ?? '0';
  const currentNum = parseInt(previousValue, 10) || 0;
  const newValue = String(currentNum + 1);

  if (result.length > 0) {
    // Update
    await db
      .update(schema.workflowStorage)
      .set({
        value: newValue,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.workflowStorage.workspaceId, workspaceId as never),
          eq(schema.workflowStorage.namespace, namespace),
          eq(schema.workflowStorage.key, key)
        )
      );
  } else {
    // Insert
    await db.insert(schema.workflowStorage).values({
      workspaceId: workspaceId as never,
      namespace,
      key,
      value: newValue,
      updatedAt: new Date(),
    });
  }

  return {
    action: 'increment',
    key,
    namespace,
    value: currentNum + 1,
    previousValue: currentNum,
  };
}

/**
 * Decrement a numeric value
 */
async function storageDecrement(
  workspaceId: string,
  namespace: string,
  key: string
): Promise<StorageResult> {
  // Get current value
  const result = await db
    .select()
    .from(schema.workflowStorage)
    .where(
      and(
        eq(schema.workflowStorage.workspaceId, workspaceId as never),
        eq(schema.workflowStorage.namespace, namespace),
        eq(schema.workflowStorage.key, key)
      )
    )
    .limit(1);

  const previousValue = result[0]?.value ?? '0';
  const currentNum = parseInt(previousValue, 10) || 0;
  const newValue = String(currentNum - 1);

  if (result.length > 0) {
    // Update
    await db
      .update(schema.workflowStorage)
      .set({
        value: newValue,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.workflowStorage.workspaceId, workspaceId as never),
          eq(schema.workflowStorage.namespace, namespace),
          eq(schema.workflowStorage.key, key)
        )
      );
  } else {
    // Insert
    await db.insert(schema.workflowStorage).values({
      workspaceId: workspaceId as never,
      namespace,
      key,
      value: newValue,
      updatedAt: new Date(),
    });
  }

  return {
    action: 'decrement',
    key,
    namespace,
    value: currentNum - 1,
    previousValue: currentNum,
  };
}

/**
 * Delete a key
 */
async function storageDelete(
  workspaceId: string,
  namespace: string,
  key: string
): Promise<StorageResult> {
  // Get value before deletion
  const result = await db
    .select()
    .from(schema.workflowStorage)
    .where(
      and(
        eq(schema.workflowStorage.workspaceId, workspaceId as never),
        eq(schema.workflowStorage.namespace, namespace),
        eq(schema.workflowStorage.key, key)
      )
    )
    .limit(1);

  const previousValue = result[0]?.value ?? null;

  // Delete
  await db
    .delete(schema.workflowStorage)
    .where(
      and(
        eq(schema.workflowStorage.workspaceId, workspaceId as never),
        eq(schema.workflowStorage.namespace, namespace),
        eq(schema.workflowStorage.key, key)
      )
    );

  return {
    action: 'delete',
    key,
    namespace,
    value: null,
    previousValue,
  };
}

/**
 * List all keys in a namespace
 */
async function storageList(
  workspaceId: string,
  namespace: string
): Promise<StorageResult> {
  const results = await db
    .select()
    .from(schema.workflowStorage)
    .where(
      and(
        eq(schema.workflowStorage.workspaceId, workspaceId as never),
        eq(schema.workflowStorage.namespace, namespace)
      )
    );

  const keys = results.map((r) => r.key);

  return {
    action: 'list',
    key: '',
    namespace,
    value: keys,
  };
}
