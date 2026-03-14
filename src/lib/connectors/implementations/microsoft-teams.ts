import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://graph.microsoft.com/v1.0';

const microsoftTeamsConnector: ConnectorPlugin = {
  manifest: {
    id: 'microsoft-teams',
    slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Send messages, create channels, and manage your Microsoft Teams workspace',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg',
    category: 'communication',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'oauth2',
    authConfig: {
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: ['https://graph.microsoft.com/Channel.ReadBasic.All', 'https://graph.microsoft.com/ChannelMessage.Send', 'https://graph.microsoft.com/Team.ReadBasic.All'],
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    },
    triggers: [
      {
        key: 'new_message',
        name: 'New Channel Message',
        description: 'Triggers when a new message is posted in a Teams channel',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            body: { type: 'object' },
            from: { type: 'object' },
            createdDateTime: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'send_message',
        name: 'Send Message',
        description: 'Send a message to a Teams channel',
        configFields: [
          { key: 'team_id', label: 'Team ID', type: 'string', required: true },
          { key: 'channel_id', label: 'Channel ID', type: 'string', required: true },
          { key: 'content', label: 'Message Content', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'create_channel',
        name: 'Create Channel',
        description: 'Create a new channel in a Teams team',
        configFields: [
          { key: 'team_id', label: 'Team ID', type: 'string', required: true },
          { key: 'displayName', label: 'Channel Name', type: 'string', required: true },
          { key: 'description', label: 'Description', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'add_member',
        name: 'Add Member',
        description: 'Add a member to a Teams team',
        configFields: [
          { key: 'team_id', label: 'Team ID', type: 'string', required: true },
          { key: 'userId', label: 'User ID or Email', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch(`${BASE}/me`, {
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    if (triggerKey !== 'new_message') return { newItems: [], nextPollState: lastPollState };

    const teamId = (lastPollState.team_id as string) || credentials.team_id;
    const channelId = (lastPollState.channel_id as string) || credentials.channel_id;

    const res = await fetch(
      `${BASE}/teams/${teamId}/channels/${channelId}/messages?$top=10`,
      { headers: { Authorization: `Bearer ${credentials.access_token}` } }
    );

    if (!res.ok) return { newItems: [], nextPollState: lastPollState };
    const data = await res.json() as { value: Record<string, unknown>[] };
    return {
      newItems: data.value || [],
      nextPollState: { team_id: teamId, channel_id: channelId, since: new Date().toISOString() },
    };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    };

    if (actionKey === 'send_message') {
      const { team_id, channel_id, content } = params as Record<string, string>;
      const res = await fetch(`${BASE}/teams/${team_id}/channels/${channel_id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body: { content } }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'create_channel') {
      const { team_id, displayName, description } = params as Record<string, string>;
      const res = await fetch(`${BASE}/teams/${team_id}/channels`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ displayName, description, membershipType: 'standard' }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'add_member') {
      const { team_id, userId } = params as Record<string, string>;
      const res = await fetch(`${BASE}/teams/${team_id}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          roles: [],
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users/${userId}`,
        }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default microsoftTeamsConnector;
