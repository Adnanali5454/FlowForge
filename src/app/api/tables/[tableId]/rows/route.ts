import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, desc } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { tableId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const [table] = await db.select().from(schema.flowforgeTables)
      .where(and(eq(schema.flowforgeTables.id, params.tableId), eq(schema.flowforgeTables.workspaceId, session.workspaceId)));
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    const rows = await db
      .select()
      .from(schema.flowforgeTableRows)
      .where(eq(schema.flowforgeTableRows.tableId, params.tableId))
      .orderBy(desc(schema.flowforgeTableRows.createdAt));

    return NextResponse.json({ rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch rows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { tableId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const [table] = await db.select().from(schema.flowforgeTables)
      .where(and(eq(schema.flowforgeTables.id, params.tableId), eq(schema.flowforgeTables.workspaceId, session.workspaceId)));
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    const body = await request.json();

    // Column validation (item 38)
    const columns = await db.select().from(schema.flowforgeTableColumns)
      .where(eq(schema.flowforgeTableColumns.tableId, params.tableId));
    const required = columns.filter(c => c.isRequired);
    const bodyData = (body.data ?? {}) as Record<string, unknown>;
    const missing = required.filter(c => bodyData[c.name] === undefined || bodyData[c.name] === null || bodyData[c.name] === '');
    if (missing.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missing.map(c => c.name).join(', ')}`
      }, { status: 400 });
    }

    const [row] = await db
      .insert(schema.flowforgeTableRows)
      .values({ tableId: params.tableId, data: body.data ?? {}, createdBy: session.userId })
      .returning();

    return NextResponse.json({ row }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create row' }, { status: 500 });
  }
}
