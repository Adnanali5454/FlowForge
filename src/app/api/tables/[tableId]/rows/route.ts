import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { tableId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

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

    const body = await request.json();
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
