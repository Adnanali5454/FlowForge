import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://gmail.googleapis.com/gmail/v1';

const gmailConnector: ConnectorPlugin = {
  manifest: {
    id: 'gmail',
    slug: 'gmail',
    name: 'Gmail',
    description: 'Send and receive emails with Gmail',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
    category: 'email',
    version: '1.0.0',
    isBuiltIn: false,
    isPremium: false,
    authType: 'oauth2',
    authConfig: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.modify'],
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    triggers: [
      { key: 'new_email', name: 'New Email', description: 'Triggers when a new email arrives', type: 'polling', outputSchema: { type: 'object', properties: { id: { type: 'string' }, subject: { type: 'string' }, from: { type: 'string' }, body: { type: 'string' } } } },
    ],
    actions: [
      { key: 'send_email', name: 'Send Email', description: 'Send an email', configFields: [{ key: 'to', label: 'To', type: 'string', required: true }, { key: 'subject', label: 'Subject', type: 'string', required: true }, { key: 'body', label: 'Body (HTML)', type: 'string', required: true }], outputSchema: { type: 'object', properties: { messageId: { type: 'string' } } } },
      { key: 'create_draft', name: 'Create Draft', description: 'Create a draft email', configFields: [{ key: 'to', label: 'To', type: 'string', required: true }, { key: 'subject', label: 'Subject', type: 'string', required: true }, { key: 'body', label: 'Body', type: 'string', required: true }], outputSchema: { type: 'object', properties: { draftId: { type: 'string' } } } },
    ],
  },

  async testConnection(credentials) {
    const res = await fetch(`${BASE}/users/me/profile`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    if (triggerKey !== 'new_email') return { newItems: [], nextPollState: lastPollState };

    const after = lastPollState.lastTimestamp as number || Math.floor(Date.now() / 1000) - 300;
    const res = await fetch(`${BASE}/users/me/messages?maxResults=10&q=after:${after}`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });

    if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
    const data = await res.json() as { messages?: { id: string }[] };
    const messages = data.messages || [];

    const items: Record<string, unknown>[] = [];
    for (const msg of messages.slice(0, 5)) {
      const msgRes = await fetch(`${BASE}/users/me/messages/${msg.id}?format=full`, {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      });
      if (!msgRes.ok) continue;
      const msgData = await msgRes.json() as {
        payload?: { headers?: { name: string; value: string }[]; body?: { data?: string } };
        snippet?: string;
      };
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      const from = headers.find((h) => h.name === 'From')?.value || '';
      const body = msgData.snippet || '';
      items.push({ id: msg.id, subject, from, body });
    }

    return {
      newItems: items,
      nextPollState: { lastTimestamp: Math.floor(Date.now() / 1000) },
    };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    if (actionKey === 'send_email') {
      const { to, subject, body } = params as { to: string; subject: string; body: string };
      const email = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/html; charset=utf-8', '', body].join('\n');
      const encoded = Buffer.from(email).toString('base64url');

      const res = await fetch(`${BASE}/users/me/messages/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${credentials.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: encoded }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Gmail send failed: ${err}` };
      }

      const data = await res.json() as { id: string };
      return { success: true, data: { messageId: data.id } };
    }

    if (actionKey === 'create_draft') {
      const { to, subject, body } = params as { to: string; subject: string; body: string };
      const email = [`To: ${to}`, `Subject: ${subject}`, '', body].join('\n');
      const encoded = Buffer.from(email).toString('base64url');

      const res = await fetch(`${BASE}/users/me/drafts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${credentials.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { raw: encoded } }),
      });

      if (!res.ok) return { success: false, error: 'Failed to create draft' };
      const data = await res.json() as { id: string };
      return { success: true, data: { draftId: data.id } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default gmailConnector;
