import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, asc } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { tableId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // verify table belongs to workspace
    const [table] = await db.select().from(schema.flowforgeTables)
      .where(and(eq(schema.flowforgeTables.id, params.tableId), eq(schema.flowforgeTables.workspaceId, session.workspaceId)));
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    const columns = await db
      .select()
      .from(schema.flowforgeTableColumns)
      .where(eq(schema.flowforgeTableColumns.tableId, params.tableId))
      .orderBy(asc(schema.flowforgeTableColumns.position));
    return NextResponse.json({ columns });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { tableId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    // verify table belongs to workspace
    const [table] = await db.select().from(schema.flowforgeTables)
      .where(and(eq(schema.flowforgeTables.id, params.tableId), eq(schema.flowforgeTables.workspaceId, session.workspaceId)));
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    const body = await request.json();
    const [column] = await db
      .insert(schema.flowforgeTableColumns)
      .values({
        tableId: params.tableId,
        name: body.name || 'New Column',
        type: body.type || 'text',
        config: body.config ?? {},
        position: body.position ?? 0,
        isRequired: body.isRequired ?? false,
        defaultValue: body.defaultValue ?? null,
      })
      .returning();
    return NextResponse.json({ column }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create column' }, { status: 500 });
  }
}
