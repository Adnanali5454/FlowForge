import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const canvases = await db
      .select()
      .from(schema.flowforgeCanvases)
      .where(eq(schema.flowforgeCanvases.workspaceId, session.workspaceId))
      .orderBy(desc(schema.flowforgeCanvases.updatedAt));

    return NextResponse.json({ canvases });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch canvases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const body = await request.json();
    const [canvas] = await db
      .insert(schema.flowforgeCanvases)
      .values({
        workspaceId: session.workspaceId,
        name: body.name || 'Untitled Canvas',
        description: body.description || '',
        data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        createdBy: session.userId,
      })
      .returning();

    return NextResponse.json({ canvas }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create canvas' }, { status: 500 });
  }
}
