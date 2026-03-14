import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.zoom.us/v2';

const zoomConnector: ConnectorPlugin = {
  manifest: {
    id: 'zoom',
    slug: 'zoom',
    name: 'Zoom',
    description: 'Create and manage Zoom meetings, webinars, and recordings',
    icon: 'https://st1.zoom.us/zoom.ico',
    category: 'communication',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'oauth2',
    authConfig: {
      authorizationUrl: 'https://zoom.us/oauth/authorize',
      tokenUrl: 'https://zoom.us/oauth/token',
      scopes: ['meeting:read', 'meeting:write', 'recording:read', 'user:read'],
      clientId: process.env.ZOOM_CLIENT_ID || '',
      clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
    },
    triggers: [
      {
        key: 'new_meeting_recording',
        name: 'New Meeting Recording',
        description: 'Triggers when a new meeting recording is available',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            uuid: { type: 'string' },
            topic: { type: 'string' },
            start_time: { type: 'string' },
            recording_files: { type: 'array' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_meeting',
        name: 'Create Meeting',
        description: 'Create a new Zoom meeting',
        configFields: [
          { key: 'user_id', label: 'User ID (or "me")', type: 'string', required: true },
          { key: 'topic', label: 'Meeting Topic', type: 'string', required: true },
          { key: 'start_time', label: 'Start Time (ISO 8601)', type: 'string', required: true },
          { key: 'duration', label: 'Duration (minutes)', type: 'number', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, join_url: { type: 'string' } } },
      },
      {
        key: 'update_meeting',
        name: 'Update Meeting',
        description: 'Update an existing Zoom meeting',
        configFields: [
          { key: 'meetingId', label: 'Meeting ID', type: 'string', required: true },
          { key: 'topic', label: 'Meeting Topic', type: 'string', required: false },
          { key: 'start_time', label: 'Start Time (ISO 8601)', type: 'string', required: false },
          { key: 'duration', label: 'Duration (minutes)', type: 'number', required: false },
        ],
        outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      },
      {
        key: 'delete_meeting',
        name: 'Delete Meeting',
        description: 'Delete a Zoom meeting',
        configFields: [
          { key: 'meetingId', label: 'Meeting ID', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      },
      {
        key: 'list_participants',
        name: 'List Participants',
        description: 'List participants of a Zoom meeting',
        configFields: [
          { key: 'meetingId', label: 'Meeting ID', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { participants: { type: 'array' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch(`${BASE}/users/me`, {
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    if (triggerKey !== 'new_meeting_recording') return { newItems: [], nextPollState: lastPollState };

    const userId = (lastPollState.user_id as string) || credentials.user_id || 'me';
    const since = (lastPollState.since as string) || new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const res = await fetch(`${BASE}/users/${userId}/recordings?from=${since}&page_size=10`, {
      headers: { Authorization: `Bearer ${credentials.access_token}` },
    });

    if (!res.ok) return { newItems: [], nextPollState: lastPollState };
    const data = await res.json() as { meetings: Record<string, unknown>[] };
    return {
      newItems: data.meetings || [],
      nextPollState: { user_id: userId, since: new Date().toISOString().split('T')[0] },
    };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    };

    if (actionKey === 'create_meeting') {
      const { user_id, topic, start_time, duration } = params as Record<string, string>;
      const res = await fetch(`${BASE}/users/${user_id}/meetings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic,
          type: 2,
          start_time,
          duration: parseInt(duration),
          settings: { join_before_host: true },
        }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'update_meeting') {
      const { meetingId, topic, start_time, duration } = params as Record<string, string>;
      const body: Record<string, unknown> = {};
      if (topic) body.topic = topic;
      if (start_time) body.start_time = start_time;
      if (duration) body.duration = parseInt(duration);
      const res = await fetch(`${BASE}/meetings/${meetingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      return { success: res.ok || res.status === 204, data: { success: res.ok } };
    }

    if (actionKey === 'delete_meeting') {
      const { meetingId } = params as Record<string, string>;
      const res = await fetch(`${BASE}/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      });
      return { success: res.ok || res.status === 204, data: { success: res.ok } };
    }

    if (actionKey === 'list_participants') {
      const { meetingId } = params as Record<string, string>;
      const res = await fetch(`${BASE}/meetings/${meetingId}/participants`, {
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default zoomConnector;
