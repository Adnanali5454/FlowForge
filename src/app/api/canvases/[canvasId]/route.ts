import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { canvasId: string } }) {
  const [canvas] = await db.select().from(schema.flowforgeCanvases).where(eq(schema.flowforgeCanvases.id, params.canvasId));
  if (!canvas) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ canvas });
}

export async function PATCH(request: NextRequest, { params }: { params: { canvasId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await verifyToken(token);

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.data !== undefined) updates.data = body.data;

    const [canvas] = await db
      .update(schema.flowforgeCanvases)
      .set(updates as Parameters<typeof db.update>[0] extends unknown ? never : never)
      .where(eq(schema.flowforgeCanvases.id, params.canvasId))
      .returning();

    return NextResponse.json({ canvas });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update canvas' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { canvasId: string } }) {
  await db.delete(schema.flowforgeCanvases).where(eq(schema.flowforgeCanvases.id, params.canvasId));
  return NextResponse.json({ success: true });
}
