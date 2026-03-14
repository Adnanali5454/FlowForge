import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { agentId: string } }) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session?.workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [agent] = await db.select().from(schema.flowforgeAgents)
    .where(and(eq(schema.flowforgeAgents.id, params.agentId), eq(schema.flowforgeAgents.workspaceId, session.workspaceId)));
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const runs = await db.select().from(schema.flowforgeAgentRuns).where(eq(schema.flowforgeAgentRuns.agentId, params.agentId));
  return NextResponse.json({ agent, runs });
}

export async function PATCH(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const allowed = ['name', 'description', 'type', 'model', 'systemPrompt', 'tools', 'constraints', 'triggerConfig', 'isActive'];
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const [agent] = await db
      .update(schema.flowforgeAgents)
      .set(updates as Parameters<typeof db.update>[0] extends unknown ? never : never)
      .where(and(eq(schema.flowforgeAgents.id, params.agentId), eq(schema.flowforgeAgents.workspaceId, session.workspaceId)))
      .returning();

    if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ agent });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { agentId: string } }) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session?.workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.delete(schema.flowforgeAgents)
    .where(and(eq(schema.flowforgeAgents.id, params.agentId), eq(schema.flowforgeAgents.workspaceId, session.workspaceId)));
  return NextResponse.json({ success: true });
}
