import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.intercom.io';

const intercomConnector: ConnectorPlugin = {
  manifest: {
    id: 'intercom',
    slug: 'intercom',
    name: 'Intercom',
    description: 'Manage conversations, messages, and contacts in Intercom',
    icon: 'https://www.intercom.com/favicon.ico',
    category: 'communication',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'bearer',
    authConfig: {
      fields: [
        { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      ],
    },
    triggers: [
      {
        key: 'new_conversation',
        name: 'New Conversation',
        description: 'Triggers when a new conversation is started in Intercom',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            state: { type: 'string' },
            created_at: { type: 'number' },
            source: { type: 'object' },
            contacts: { type: 'object' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_message',
        name: 'Send Message',
        description: 'Send a message to a user in Intercom',
        configFields: [
          { key: 'subject', label: 'Subject', type: 'string', required: false },
          { key: 'body', label: 'Message Body', type: 'textarea', required: true },
          { key: 'admin_id', label: 'Admin ID (sender)', type: 'string', required: true },
          { key: 'user_id', label: 'User ID (recipient)', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'reply_to_conversation',
        name: 'Reply to Conversation',
        description: 'Reply to an existing conversation',
        configFields: [
          { key: 'conversationId', label: 'Conversation ID', type: 'string', required: true },
          { key: 'body', label: 'Reply Body', type: 'textarea', required: true },
          { key: 'admin_id', label: 'Admin ID', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'close_conversation',
        name: 'Close Conversation',
        description: 'Close an existing Intercom conversation',
        configFields: [
          { key: 'conversationId', label: 'Conversation ID', type: 'string', required: true },
          { key: 'admin_id', label: 'Admin ID', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'create_contact',
        name: 'Create Contact',
        description: 'Create a new contact in Intercom',
        configFields: [
          { key: 'email', label: 'Email', type: 'string', required: true },
          { key: 'name', label: 'Name', type: 'string', required: false },
          { key: 'phone', label: 'Phone', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch(`${BASE}/me`, {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          Accept: 'application/json',
          'Intercom-Version': '2.10',
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    if (triggerKey !== 'new_conversation') return { newItems: [], nextPollState: lastPollState };

    const since = (lastPollState.since as number) || Math.floor(Date.now() / 1000) - 3600;
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      Accept: 'application/json',
      'Intercom-Version': '2.10',
    };

    const res = await fetch(
      `${BASE}/conversations?display_as=plaintext&per_page=10&sort=created_at&order=desc`,
      { headers }
    );

    if (!res.ok) return { newItems: [], nextPollState: lastPollState };
    const data = await res.json() as { conversations: Array<{ id: string; created_at: number }> };
    const newConversations = (data.conversations || []).filter(c => c.created_at > since);

    return {
      newItems: newConversations,
      nextPollState: { since: Math.floor(Date.now() / 1000) },
    };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      Accept: 'application/json',
      'Intercom-Version': '2.10',
      'Content-Type': 'application/json',
    };

    if (actionKey === 'create_message') {
      const { subject, body, admin_id, user_id } = params as Record<string, string>;
      const res = await fetch(`${BASE}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message_type: 'inapp',
          subject,
          body,
          from: { type: 'admin', id: admin_id },
          to: { type: 'user', id: user_id },
        }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'reply_to_conversation') {
      const { conversationId, body, admin_id } = params as Record<string, string>;
      const res = await fetch(`${BASE}/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message_type: 'comment', type: 'admin', admin_id, body }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'close_conversation') {
      const { conversationId, admin_id } = params as Record<string, string>;
      const res = await fetch(`${BASE}/conversations/${conversationId}/parts`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ message_type: 'close', type: 'admin', admin_id }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'create_contact') {
      const { email, name, phone } = params as Record<string, string>;
      const res = await fetch(`${BASE}/contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: 'user', email, name, phone }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default intercomConnector;
