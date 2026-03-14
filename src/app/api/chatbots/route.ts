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

    const chatbots = await db
      .select()
      .from(schema.flowforgeChatbots)
      .where(eq(schema.flowforgeChatbots.workspaceId, session.workspaceId))
      .orderBy(desc(schema.flowforgeChatbots.updatedAt));

    return NextResponse.json({ chatbots });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch chatbots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const body = await request.json();
    const [chatbot] = await db
      .insert(schema.flowforgeChatbots)
      .values({
        workspaceId: session.workspaceId,
        name: body.name || 'My Chatbot',
        description: body.description || '',
        model: body.model || 'claude-sonnet-4-6',
        systemPrompt: body.systemPrompt || 'You are a helpful assistant.',
        welcomeMessage: body.welcomeMessage || 'Hello! How can I help you today?',
        createdBy: session.userId,
      })
      .returning();

    return NextResponse.json({ chatbot }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create chatbot' }, { status: 500 });
  }
}
