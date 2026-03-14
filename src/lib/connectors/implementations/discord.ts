import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://discord.com/api/v10';

const discordConnector: ConnectorPlugin = {
  manifest: {
    id: 'discord',
    slug: 'discord',
    name: 'Discord',
    description: 'Send messages, create threads, and manage your Discord server',
    icon: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    category: 'communication',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'api_key',
    authConfig: {
      fields: [
        { key: 'bot_token', label: 'Bot Token', type: 'password', required: true },
        { key: 'channel_id', label: 'Default Channel ID', type: 'string', required: true },
      ],
    },
    triggers: [
      {
        key: 'new_message',
        name: 'New Message',
        description: 'Triggers when a new message is posted to a channel',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            author: { type: 'object' },
            channel_id: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'send_message',
        name: 'Send Message',
        description: 'Send a message to a Discord channel',
        configFields: [
          { key: 'channel_id', label: 'Channel ID', type: 'string', required: true },
          { key: 'content', label: 'Message Content', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'create_thread',
        name: 'Create Thread',
        description: 'Create a new thread in a channel',
        configFields: [
          { key: 'channel_id', label: 'Channel ID', type: 'string', required: true },
          { key: 'name', label: 'Thread Name', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'add_reaction',
        name: 'Add Reaction',
        description: 'Add an emoji reaction to a message',
        configFields: [
          { key: 'channel_id', label: 'Channel ID', type: 'string', required: true },
          { key: 'messageId', label: 'Message ID', type: 'string', required: true },
          { key: 'emoji', label: 'Emoji (e.g. 👍 or name:id)', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch(`${BASE}/users/@me`, {
        headers: { Authorization: `Bot ${credentials.bot_token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    if (triggerKey !== 'new_message') return { newItems: [], nextPollState: lastPollState };

    const channelId = (lastPollState.channel_id as string) || credentials.channel_id;
    const lastMessageId = lastPollState.lastMessageId as string | undefined;

    const url = lastMessageId
      ? `${BASE}/channels/${channelId}/messages?limit=10&after=${lastMessageId}`
      : `${BASE}/channels/${channelId}/messages?limit=10`;

    const res = await fetch(url, {
      headers: { Authorization: `Bot ${credentials.bot_token}` },
    });

    if (!res.ok) return { newItems: [], nextPollState: lastPollState };

    const messages = await res.json() as Array<{ id: string; content: string; author: Record<string, unknown>; channel_id: string; timestamp: string }>;
    const newLastId = messages[0]?.id || lastMessageId;

    return {
      newItems: messages,
      nextPollState: { channel_id: channelId, lastMessageId: newLastId },
    };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const botToken = credentials.bot_token;

    if (actionKey === 'send_message') {
      const { channel_id, content } = params as { channel_id: string; content: string };
      const res = await fetch(`${BASE}/channels/${channel_id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'create_thread') {
      const { channel_id, name } = params as { channel_id: string; name: string };
      const res = await fetch(`${BASE}/channels/${channel_id}/threads`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, auto_archive_duration: 1440 }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'add_reaction') {
      const { channel_id, messageId, emoji } = params as { channel_id: string; messageId: string; emoji: string };
      const encodedEmoji = encodeURIComponent(emoji);
      const res = await fetch(`${BASE}/channels/${channel_id}/messages/${messageId}/reactions/${encodedEmoji}/@me`, {
        method: 'PUT',
        headers: { Authorization: `Bot ${botToken}` },
      });
      return { success: res.ok || res.status === 204, data: { success: res.ok || res.status === 204 } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default discordConnector;
