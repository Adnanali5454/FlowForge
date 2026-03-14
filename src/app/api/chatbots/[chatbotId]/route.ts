import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { chatbotId: string } }) {
  const [chatbot] = await db.select().from(schema.flowforgeChatbots).where(eq(schema.flowforgeChatbots.id, params.chatbotId));
  if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ chatbot });
}

export async function PATCH(request: NextRequest, { params }: { params: { chatbotId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await verifyToken(token);

    const body = await request.json();
    const allowed = ['name', 'description', 'model', 'systemPrompt', 'welcomeMessage', 'suggestedQuestions', 'brandingConfig', 'isPublished'];
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const [chatbot] = await db
      .update(schema.flowforgeChatbots)
      .set(updates as Parameters<typeof db.update>[0] extends unknown ? never : never)
      .where(eq(schema.flowforgeChatbots.id, params.chatbotId))
      .returning();

    return NextResponse.json({ chatbot });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update chatbot' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { chatbotId: string } }) {
  await db.delete(schema.flowforgeChatbots).where(eq(schema.flowforgeChatbots.id, params.chatbotId));
  return NextResponse.json({ success: true });
}
