import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { WorkflowExecutor } from '@/lib/engine';
import type { WorkflowDefinition, TriggerConfig, StepConfig, WorkflowSettings, WorkflowVariable } from '@/types';
import '@/lib/startup';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const allActive = await db.select().from(schema.workflowDefinitions)
    .where(eq(schema.workflowDefinitions.status, 'active'));

  const scheduled = allActive.filter(w => {
    const t = w.trigger as TriggerConfig;
    return t.type === 'schedule' && (t.config as Record<string, unknown>)?.cron;
  });

  let triggered = 0;
  for (const wf of scheduled) {
    try {
      const { CronExpressionParser } = await import('cron-parser');
      const t = wf.trigger as TriggerConfig & { config: { cron: string } };
      const interval = CronExpressionParser.parse(t.config.cron, { currentDate: now });
      const prev = interval.prev().toDate();
      if (now.getTime() - prev.getTime() <= 65000) {
        const workflow = {
          ...wf,
          trigger: wf.trigger as TriggerConfig,
          steps: (wf.steps ?? []) as StepConfig[],
          variables: (wf.variables ?? {}) as Record<string, WorkflowVariable>,
          settings: wf.settings as WorkflowSettings,
          tags: (wf.tags ?? []) as string[],
          createdAt: wf.createdAt.toISOString(),
          updatedAt: wf.updatedAt.toISOString(),
        } as unknown as WorkflowDefinition;
        const executor = new WorkflowExecutor(workflow, { scheduledAt: now.toISOString() });
        await executor.execute();
        triggered++;
      }
    } catch (e) {
      console.error(`Cron eval failed for ${wf.id}:`, e);
    }
  }

  return NextResponse.json({ triggered, evaluated: scheduled.length, timestamp: now.toISOString() });
}
