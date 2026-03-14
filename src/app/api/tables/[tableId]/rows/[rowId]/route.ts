import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { tableId: string; rowId: string } }) {
  const [row] = await db.select().from(schema.flowforgeTableRows).where(eq(schema.flowforgeTableRows.id, params.rowId));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ row });
}

export async function PATCH(request: NextRequest, { params }: { params: { tableId: string; rowId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const body = await request.json();
    const [row] = await db
      .update(schema.flowforgeTableRows)
      .set({ data: body.data, updatedAt: new Date() })
      .where(eq(schema.flowforgeTableRows.id, params.rowId))
      .returning();
    return NextResponse.json({ row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update row' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { tableId: string; rowId: string } }) {
  try {
    await db.delete(schema.flowforgeTableRows).where(eq(schema.flowforgeTableRows.id, params.rowId));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete row' }, { status: 500 });
  }
}
