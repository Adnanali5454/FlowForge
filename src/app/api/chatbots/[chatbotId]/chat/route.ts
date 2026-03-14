import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest, { params }: { params: { chatbotId: string } }) {
  try {
    const body = await request.json();
    const { messages, sessionId } = body as { messages: ChatMessage[]; sessionId: string };

    // Extract the last user message for saving
    const userMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content ?? '';

    const [chatbot] = await db
      .select()
      .from(schema.flowforgeChatbots)
      .where(eq(schema.flowforgeChatbots.id, params.chatbotId));

    if (!chatbot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });

    // Auth check for non-published chatbots
    if (!chatbot.isPublished) {
      const authToken = request.cookies.get('ff_session')?.value;
      if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const sess = await verifyToken(authToken);
      if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
          model: chatbot.model === 'gpt-4o' ? 'gpt-4o' : chatbot.model,
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
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: chatbot.systemPrompt || 'You are a helpful assistant.',
          messages,
          stream: true,
        }),
      });
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return NextResponse.json({ error: 'AI provider error', details: errText }, { status: 502 });
    }

    let assistantText = '';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const normalizedStream = new TransformStream({
      transform(chunk: Uint8Array, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split('\n').filter((l: string) => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data) as Record<string, unknown>;
            const choices = json.choices as Array<{ delta?: { content?: string } }> | undefined;
            const openaiText = choices?.[0]?.delta?.content;
            const anthropicText = json.type === 'content_block_delta'
              ? (json.delta as Record<string, string>)?.text
              : null;
            const chunkText = openaiText ?? anthropicText ?? '';
            if (chunkText) {
              assistantText += chunkText;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText, done: false })}\n\n`));
            }
          } catch { /* skip malformed chunks */ }
        }
      },
      flush(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '', done: true })}\n\n`));
        // Save complete conversation to DB
        if (sessionId && assistantText) {
          const userMsg = { role: 'user' as const, content: userMessage };
          const assistantMsg = { role: 'assistant' as const, content: assistantText };
          db.select().from(schema.flowforgeChatbotConversations)
            .where(eq(schema.flowforgeChatbotConversations.sessionId, sessionId))
            .then(async (existing) => {
              if (existing.length > 0) {
                const prev = existing[0];
                const prevMessages = (prev.messages ?? []) as Array<{ role: string; content: string }>;
                await db.update(schema.flowforgeChatbotConversations)
                  .set({ messages: [...prevMessages, userMsg, assistantMsg], updatedAt: new Date() })
                  .where(eq(schema.flowforgeChatbotConversations.id, prev.id));
              } else {
                await db.insert(schema.flowforgeChatbotConversations)
                  .values({ chatbotId: params.chatbotId, sessionId, messages: [userMsg, assistantMsg] });
              }
            }).catch(console.error);
        }
      },
    });

    void aiResponse.body?.pipeTo(normalizedStream.writable);

    return new NextResponse(normalizedStream.readable, {
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
