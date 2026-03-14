// ─── Tables API ──────────────────────────────────────────────────────────────
// GET  /api/tables  — List all tables in workspace
// POST /api/tables  — Create a new table

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/tables — List tables for the active workspace
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

    const tables = await db
      .select({
        id: schema.flowforgeTables.id,
        workspaceId: schema.flowforgeTables.workspaceId,
        name: schema.flowforgeTables.name,
        description: schema.flowforgeTables.description,
        icon: schema.flowforgeTables.icon,
        createdBy: schema.flowforgeTables.createdBy,
        createdAt: schema.flowforgeTables.createdAt,
        updatedAt: schema.flowforgeTables.updatedAt,
        rowCount: sql<number>`(
          SELECT COUNT(*)::int FROM flowforge_table_rows
          WHERE table_id = ${schema.flowforgeTables.id}
        )`,
      })
      .from(schema.flowforgeTables)
      .where(eq(schema.flowforgeTables.workspaceId, session.workspaceId))
      .orderBy(desc(schema.flowforgeTables.updatedAt));

    return NextResponse.json({ tables });
  } catch (error) {
    console.error('GET /api/tables error:', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

/**
 * POST /api/tables — Create a new table
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const body = await request.json();
    const name = (body.name as string | undefined)?.trim() || 'Untitled Table';
    const description = (body.description as string | undefined) || '';
    const icon = (body.icon as string | undefined) || '📊';

    const [table] = await db
      .insert(schema.flowforgeTables)
      .values({
        workspaceId: session.workspaceId,
        name,
        description,
        icon,
        createdBy: session.userId,
      })
      .returning();

    // Seed with a default "Name" column
    await db.insert(schema.flowforgeTableColumns).values({
      tableId: table.id,
      name: 'Name',
      type: 'text',
      config: {},
      position: 0,
      isRequired: false,
    });

    // Seed with a default Grid view
    await db.insert(schema.flowforgeTableViews).values({
      tableId: table.id,
      name: 'Grid View',
      type: 'grid',
      config: {},
      createdBy: session.userId,
    });

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tables error:', error);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
