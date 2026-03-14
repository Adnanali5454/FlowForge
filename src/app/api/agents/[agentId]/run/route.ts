import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { goal, context } = body as { goal: string; context?: Record<string, unknown> };

    const [agent] = await db.select().from(schema.flowforgeAgents).where(eq(schema.flowforgeAgents.id, params.agentId));
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    // Create run record
    const [run] = await db
      .insert(schema.flowforgeAgentRuns)
      .values({ agentId: params.agentId, trigger: 'manual', status: 'running' })
      .returning();

    // Call Claude to reason about the goal
    const agentResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 2048,
        system: agent.systemPrompt || `You are an autonomous AI agent. Your goal is to reason about and solve tasks step by step.`,
        messages: [
          {
            role: 'user',
            content: `Goal: ${goal}\n\nContext: ${JSON.stringify(context || {})}\n\nPlease reason through this goal step by step and provide a detailed plan and result.`,
          },
        ],
      }),
    });

    let output = 'Agent completed task.';
    const steps: Array<{ action: string; reasoning: string; timestamp: string }> = [];

    if (agentResponse.ok) {
      const data = await agentResponse.json() as { content?: Array<{ text?: string }> };
      output = data.content?.[0]?.text ?? output;
      steps.push({
        action: 'reason',
        reasoning: output,
        timestamp: new Date().toISOString(),
      });
    }

    // Update run as completed
    await db
      .update(schema.flowforgeAgentRuns)
      .set({ status: 'completed', steps, completedAt: new Date() })
      .where(eq(schema.flowforgeAgentRuns.id, run.id));

    return NextResponse.json({ runId: run.id, status: 'completed', steps, output });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Agent run failed' }, { status: 500 });
  }
}
