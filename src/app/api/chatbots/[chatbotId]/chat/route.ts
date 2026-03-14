import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest, { params }: { params: { chatbotId: string } }) {
  try {
    const body = await request.json();
    const { messages, sessionId } = body as { messages: ChatMessage[]; sessionId: string };

    const [chatbot] = await db
      .select()
      .from(schema.flowforgeChatbots)
      .where(eq(schema.flowforgeChatbots.id, params.chatbotId));

    if (!chatbot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });

    const model = chatbot.model === 'gpt-4o'
      ? 'gpt-4o'
      : 'claude-sonnet-4-5-20250514';

    const isOpenAI = chatbot.model.startsWith('gpt');

    let aiResponse: Response;

    if (isOpenAI) {
      aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: chatbot.systemPrompt || 'You are a helpful assistant.' },
            ...messages,
          ],
          stream: true,
          max_tokens: 1024,
        }),
      });
    } else {
      aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 1024,
          system: chatbot.systemPrompt || 'You are a helpful assistant.',
          messages,
          stream: true,
        }),
      });
    }

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      return NextResponse.json({ error: `AI API error: ${err}` }, { status: 500 });
    }

    // Save conversation (fire and forget)
    if (sessionId) {
      db.select()
        .from(schema.flowforgeChatbotConversations)
        .where(eq(schema.flowforgeChatbotConversations.sessionId, sessionId))
        .then(async ([existing]) => {
          if (existing) {
            await db
              .update(schema.flowforgeChatbotConversations)
              .set({ messages: [...(existing.messages as ChatMessage[]), ...messages], updatedAt: new Date() })
              .where(eq(schema.flowforgeChatbotConversations.id, existing.id));
          } else {
            await db.insert(schema.flowforgeChatbotConversations).values({
              chatbotId: params.chatbotId,
              sessionId,
              messages,
            });
          }
        })
        .catch(console.error);
    }

    return new NextResponse(aiResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
