// ─── Workflow Storage API (Key-Value Store) ─────────────────────────────────
// GET    /api/storage              — List storage keys for workspace
// GET    /api/storage?key=xyz      — Get a specific value
// PUT    /api/storage              — Set a key-value pair
// DELETE /api/storage              — Delete a key

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/storage — List storage keys or get a specific value
 * Query params:
 *   - namespace: string (optional, default 'default')
 *   - key: string (optional - if provided, get single value; if omitted, list all)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const namespace = searchParams.get('namespace') || 'default';
    const key = searchParams.get('key');

    if (key) {
      // Get single value
      const entry = await db
        .select()
        .from(schema.workflowStorage)
        .where(
          and(
            eq(schema.workflowStorage.workspaceId, session.workspaceId),
            eq(schema.workflowStorage.namespace, namespace),
            eq(schema.workflowStorage.key, key)
          )
        )
        .limit(1);

      if (!entry.length) {
        return NextResponse.json(
          { error: 'Key not found' },
          { status: 404 }
        );
      }

      const item = entry[0];

      // Check expiration
      if (item.expiresAt && item.expiresAt < new Date()) {
        // Delete expired entry
        await db
          .delete(schema.workflowStorage)
          .where(eq(schema.workflowStorage.id, item.id));
        return NextResponse.json(
          { error: 'Key expired' },
          { status: 404 }
        );
      }

      return NextResponse.json({ value: item.value });
    }

    // List all keys in namespace
    const entries = await db
      .select()
      .from(schema.workflowStorage)
      .where(
        and(
          eq(schema.workflowStorage.workspaceId, session.workspaceId),
          eq(schema.workflowStorage.namespace, namespace)
        )
      );

    // Filter out expired entries
    const now = new Date();
    const active = entries.filter(e => !e.expiresAt || e.expiresAt > now);

    return NextResponse.json({
      namespace,
      keys: active.map(e => ({
        key: e.key,
        updatedAt: e.updatedAt,
        expiresAt: e.expiresAt,
      })),
      count: active.length,
    });
  } catch (error) {
    console.error('GET /api/storage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/storage — Set a key-value pair
 * Body: { namespace?: string, key: string, value: string, expiresAt?: string (ISO) }
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const body = await request.json();
    const namespace = body.namespace || 'default';
    const key = body.key as string;
    const value = body.value as string;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt as string) : null;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'key and value required' },
        { status: 400 }
      );
    }

    // Upsert: try to update first, then insert if not exists
    const existing = await db
      .select()
      .from(schema.workflowStorage)
      .where(
        and(
          eq(schema.workflowStorage.workspaceId, session.workspaceId),
          eq(schema.workflowStorage.namespace, namespace),
          eq(schema.workflowStorage.key, key)
        )
      )
      .limit(1);

    if (existing.length) {
      // Update existing
      await db
        .update(schema.workflowStorage)
        .set({
          value,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.workflowStorage.id, existing[0].id));
    } else {
      // Insert new
      await db
        .insert(schema.workflowStorage)
        .values({
          workspaceId: session.workspaceId,
          namespace,
          key,
          value,
          expiresAt,
        });
    }

    return NextResponse.json({ success: true, key, namespace });
  } catch (error) {
    console.error('PUT /api/storage error:', error);
    return NextResponse.json(
      { error: 'Failed to update storage' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/storage — Delete a key
 * Query params: namespace (optional, default 'default'), key (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const namespace = searchParams.get('namespace') || 'default';
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'key query parameter required' },
        { status: 400 }
      );
    }

    const result = await db
      .delete(schema.workflowStorage)
      .where(
        and(
          eq(schema.workflowStorage.workspaceId, session.workspaceId),
          eq(schema.workflowStorage.namespace, namespace),
          eq(schema.workflowStorage.key, key)
        )
      )
      .returning();

    if (!result.length) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/storage error:', error);
    return NextResponse.json(
      { error: 'Failed to delete storage' },
      { status: 500 }
    );
  }
}
