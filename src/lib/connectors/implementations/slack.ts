import type { ConnectorPlugin, PollResult, ActionResult, DynamicFieldResult } from '@/lib/connectors/base';

const BASE = 'https://slack.com/api';

const slackConnector: ConnectorPlugin = {
  manifest: {
    id: 'slack',
    slug: 'slack',
    name: 'Slack',
    description: 'Send messages and manage channels in Slack',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Slack_Technologies_Logo.svg',
    category: 'communication',
    version: '1.0.0',
    isBuiltIn: false,
    isPremium: false,
    authType: 'oauth2',
    authConfig: {
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['chat:write', 'channels:read', 'channels:history', 'users:read'],
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    },
    triggers: [
      { key: 'new_message', name: 'New Message', description: 'Triggers when a new message is posted to a channel', type: 'polling', outputSchema: { type: 'object', properties: { text: { type: 'string' }, user: { type: 'string' }, channel: { type: 'string' }, ts: { type: 'string' } } } },
    ],
    actions: [
      { key: 'send_message', name: 'Send Message', description: 'Send a message to a channel', configFields: [{ key: 'channel', label: 'Channel', type: 'string', required: true, isDynamic: true, dynamicKey: 'channel' }, { key: 'text', label: 'Message', type: 'string', required: true }], outputSchema: { type: 'object', properties: { ts: { type: 'string' } } } },
      { key: 'create_channel', name: 'Create Channel', description: 'Create a new Slack channel', configFields: [{ key: 'name', label: 'Channel Name', type: 'string', required: true }], outputSchema: { type: 'object', properties: { channelId: { type: 'string' } } } },
    ],
  },

  async testConnection(credentials) {
    const res = await fetch(`${BASE}/auth.test`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });
    const data = await res.json() as { ok: boolean };
    return data.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    if (triggerKey !== 'new_message') return { newItems: [], nextPollState: lastPollState };

    const channel = (lastPollState.channel as string) || 'general';
    const oldest = (lastPollState.lastTs as string) || String(Date.now() / 1000 - 300);

    const res = await fetch(`${BASE}/conversations.history?channel=${channel}&oldest=${oldest}&limit=10`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });

    const data = await res.json() as { ok: boolean; messages?: Array<{ text: string; user: string; ts: string }> };
    if (!data.ok) return { newItems: [], nextPollState: lastPollState };

    const messages = data.messages || [];
    const items = messages.map(m => ({ text: m.text, user: m.user, channel, ts: m.ts }));
    const latestTs = messages[0]?.ts || oldest;

    return { newItems: items, nextPollState: { channel, lastTs: latestTs } };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    if (actionKey === 'send_message') {
      const { channel, text } = params as { channel: string; text: string };
      const res = await fetch(`${BASE}/chat.postMessage`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${credentials.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, text }),
      });
      const data = await res.json() as { ok: boolean; ts?: string; error?: string };
      if (!data.ok) return { success: false, error: data.error };
      return { success: true, data: { ts: data.ts } };
    }

    if (actionKey === 'create_channel') {
      const { name } = params as { name: string };
      const res = await fetch(`${BASE}/conversations.create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${credentials.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json() as { ok: boolean; channel?: { id: string }; error?: string };
      if (!data.ok) return { success: false, error: data.error };
      return { success: true, data: { channelId: data.channel?.id } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },

  async getDynamicFields(fieldKey, credentials): Promise<DynamicFieldResult> {
    if (fieldKey === 'channel') {
      const res = await fetch(`${BASE}/conversations.list?limit=200`, {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      });
      const data = await res.json() as { ok: boolean; channels?: Array<{ id: string; name: string }> };
      if (!data.ok) return { options: [] };
      return {
        options: (data.channels || []).map(c => ({ label: `#${c.name}`, value: c.id })),
      };
    }
    return { options: [] };
  },
};

export default slackConnector;
