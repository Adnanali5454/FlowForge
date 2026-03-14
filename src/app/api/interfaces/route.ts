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

    const interfaces = await db
      .select()
      .from(schema.flowforgeInterfaces)
      .where(eq(schema.flowforgeInterfaces.workspaceId, session.workspaceId))
      .orderBy(desc(schema.flowforgeInterfaces.updatedAt));

    return NextResponse.json({ interfaces });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch interfaces' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const body = await request.json();
    const [iface] = await db
      .insert(schema.flowforgeInterfaces)
      .values({
        workspaceId: session.workspaceId,
        name: body.name || 'Untitled Form',
        description: body.description || '',
        type: body.type || 'form',
        config: body.config ?? { title: body.name || 'Untitled Form', submitButtonText: 'Submit' },
        createdBy: session.userId,
      })
      .returning();

    return NextResponse.json({ interface: iface }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create interface' }, { status: 500 });
  }
}
