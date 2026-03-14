// ─── Scheduler Connector ────────────────────────────────────────────────────
// Built-in connector for schedule-based triggers (cron).
// Handles: every N minutes, hourly, daily, weekly, monthly, custom cron.

import type { ConnectorPlugin, ActionResult, PollResult } from '../base';
import { createManifest } from '../base';

export const schedulerConnector: ConnectorPlugin = {
  manifest: createManifest({
    slug: 'scheduler',
    name: 'Schedule by FlowForge',
    description: 'Run workflows on a schedule — every N minutes, hourly, daily, weekly, or custom cron.',
    icon: '/icons/connectors/schedule.svg',
    category: 'utility',
    authType: 'custom',
    authConfig: { type: 'custom' as const, usernameField: '', passwordField: '' },
    triggers: [
      {
        key: 'cron_trigger',
        name: 'Schedule',
        description: 'Run this workflow on a recurring schedule',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            scheduledAt: { type: 'string', description: 'ISO timestamp of scheduled execution time' },
            runNumber: { type: 'number', description: 'Sequential run counter' },
          },
        },
        configFields: [
          {
            key: 'frequency',
            label: 'Run Every',
            type: 'select',
            required: true,
            options: [
              { label: 'Every 5 minutes', value: '*/5 * * * *' },
              { label: 'Every 15 minutes', value: '*/15 * * * *' },
              { label: 'Every 30 minutes', value: '*/30 * * * *' },
              { label: 'Every hour', value: '0 * * * *' },
              { label: 'Every 2 hours', value: '0 */2 * * *' },
              { label: 'Every 6 hours', value: '0 */6 * * *' },
              { label: 'Every 12 hours', value: '0 */12 * * *' },
              { label: 'Daily at midnight', value: '0 0 * * *' },
              { label: 'Daily at 9 AM', value: '0 9 * * *' },
              { label: 'Weekly on Monday', value: '0 9 * * 1' },
              { label: 'Monthly on the 1st', value: '0 0 1 * *' },
              { label: 'Custom cron', value: 'custom' },
            ],
          },
          {
            key: 'customCron',
            label: 'Custom Cron Expression',
            type: 'string',
            required: false,
            placeholder: '*/10 * * * *',
            helpText: 'Standard 5-field cron: minute hour day month weekday',
            dependsOn: 'frequency',
          },
          {
            key: 'timezone',
            label: 'Timezone',
            type: 'select',
            required: true,
            options: [
              { label: 'UTC', value: 'UTC' },
              { label: 'US Eastern', value: 'America/New_York' },
              { label: 'US Central', value: 'America/Chicago' },
              { label: 'US Mountain', value: 'America/Denver' },
              { label: 'US Pacific', value: 'America/Los_Angeles' },
              { label: 'UK', value: 'Europe/London' },
              { label: 'Central Europe', value: 'Europe/Berlin' },
              { label: 'India', value: 'Asia/Kolkata' },
              { label: 'Japan', value: 'Asia/Tokyo' },
              { label: 'Australia', value: 'Australia/Sydney' },
            ],
          },
        ],
      },
    ],
    actions: [],
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
  }),

  async testConnection(): Promise<boolean> {
    return true;
  },

  async poll(
    _triggerKey: string,
    _credentials: Record<string, string>,
    lastPollState: Record<string, unknown>
  ): Promise<PollResult> {
    const runNumber = (Number(lastPollState.runNumber) || 0) + 1;
    return {
      items: [{
        scheduledAt: new Date().toISOString(),
        runNumber,
      }],
      newState: { runNumber, lastRun: new Date().toISOString() },
      hasMore: false,
    };
  },

  async executeAction(): Promise<ActionResult> {
    return {
      success: true,
      data: { message: 'Scheduler has no actions — it is a trigger-only connector' },
    };
  },
};
