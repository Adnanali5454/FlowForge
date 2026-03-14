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

    const agents = await db
      .select()
      .from(schema.flowforgeAgents)
      .where(eq(schema.flowforgeAgents.workspaceId, session.workspaceId))
      .orderBy(desc(schema.flowforgeAgents.updatedAt));

    return NextResponse.json({ agents });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const body = await request.json();
    const [agent] = await db
      .insert(schema.flowforgeAgents)
      .values({
        workspaceId: session.workspaceId,
        name: body.name || 'My Agent',
        description: body.description || '',
        type: body.type || 'task',
        model: body.model || 'claude-sonnet-4-6',
        systemPrompt: body.systemPrompt || '',
        createdBy: session.userId,
      })
      .returning();

    return NextResponse.json({ agent }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
