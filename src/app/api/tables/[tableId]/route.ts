// ─── Single Table API ─────────────────────────────────────────────────────────
// GET    /api/tables/[tableId]  — Get table with columns
// PATCH  /api/tables/[tableId]  — Update table name/description/icon
// DELETE /api/tables/[tableId]  — Delete table

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

type Params = { params: Promise<{ tableId: string }> };

/**
 * GET /api/tables/[tableId] — Get table with columns and views
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const { tableId } = await params;

    const [table] = await db
      .select()
      .from(schema.flowforgeTables)
      .where(eq(schema.flowforgeTables.id, tableId));

    if (!table || table.workspaceId !== session.workspaceId) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const columns = await db
      .select()
      .from(schema.flowforgeTableColumns)
      .where(eq(schema.flowforgeTableColumns.tableId, tableId))
      .orderBy(asc(schema.flowforgeTableColumns.position));

    const views = await db
      .select()
      .from(schema.flowforgeTableViews)
      .where(eq(schema.flowforgeTableViews.tableId, tableId));

    return NextResponse.json({ table, columns, views });
  } catch (error) {
    console.error('GET /api/tables/[tableId] error:', error);
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 });
  }
}

/**
 * PATCH /api/tables/[tableId] — Update table
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const { tableId } = await params;

    const [existing] = await db
      .select()
      .from(schema.flowforgeTables)
      .where(eq(schema.flowforgeTables.id, tableId));

    if (!existing || existing.workspaceId !== session.workspaceId) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Partial<{
      name: string;
      description: string;
      icon: string;
      updatedAt: Date;
    }> = { updatedAt: new Date() };

    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.description === 'string') updates.description = body.description;
    if (typeof body.icon === 'string') updates.icon = body.icon;

    const [updated] = await db
      .update(schema.flowforgeTables)
      .set(updates)
      .where(eq(schema.flowforgeTables.id, tableId))
      .returning();

    return NextResponse.json({ table: updated });
  } catch (error) {
    console.error('PATCH /api/tables/[tableId] error:', error);
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}

/**
 * DELETE /api/tables/[tableId] — Delete table (cascades to columns, rows, views)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const { tableId } = await params;

    const [existing] = await db
      .select()
      .from(schema.flowforgeTables)
      .where(eq(schema.flowforgeTables.id, tableId));

    if (!existing || existing.workspaceId !== session.workspaceId) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    await db
      .delete(schema.flowforgeTables)
      .where(eq(schema.flowforgeTables.id, tableId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tables/[tableId] error:', error);
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}
