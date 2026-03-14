import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://www.googleapis.com/calendar/v3';

const googleCalendarConnector: ConnectorPlugin = {
  manifest: {
    id: 'google-calendar',
    slug: 'google-calendar',
    name: 'Google Calendar',
    description: 'Create events, manage calendars, and automate scheduling with Google Calendar',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
    category: 'productivity',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'oauth2',
    authConfig: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/calendar'],
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    triggers: [
      {
        key: 'new_event',
        name: 'New Event',
        description: 'Triggers when a new event is created or updated in a calendar',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            summary: { type: 'string' },
            description: { type: 'string' },
            start: { type: 'object' },
            end: { type: 'object' },
            attendees: { type: 'array' },
            htmlLink: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_event',
        name: 'Create Event',
        description: 'Create a new event in Google Calendar',
        configFields: [
          { key: 'calendar_id', label: 'Calendar ID', type: 'string', required: true },
          { key: 'summary', label: 'Event Title', type: 'string', required: true },
          { key: 'description', label: 'Description', type: 'textarea', required: false },
          { key: 'start_datetime', label: 'Start DateTime (ISO 8601)', type: 'string', required: true },
          { key: 'end_datetime', label: 'End DateTime (ISO 8601)', type: 'string', required: true },
          { key: 'attendee_emails', label: 'Attendee Emails (comma-separated)', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, htmlLink: { type: 'string' } } },
      },
      {
        key: 'update_event',
        name: 'Update Event',
        description: 'Update an existing event in Google Calendar',
        configFields: [
          { key: 'calendar_id', label: 'Calendar ID', type: 'string', required: true },
          { key: 'eventId', label: 'Event ID', type: 'string', required: true },
          { key: 'summary', label: 'Event Title', type: 'string', required: false },
          { key: 'start_datetime', label: 'Start DateTime (ISO 8601)', type: 'string', required: false },
          { key: 'end_datetime', label: 'End DateTime (ISO 8601)', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'delete_event',
        name: 'Delete Event',
        description: 'Delete an event from Google Calendar',
        configFields: [
          { key: 'calendar_id', label: 'Calendar ID', type: 'string', required: true },
          { key: 'eventId', label: 'Event ID', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch(`${BASE}/users/me/calendarList`, {
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    if (triggerKey !== 'new_event') return { newItems: [], nextPollState: lastPollState };

    const calendarId = (lastPollState.calendar_id as string) || credentials.calendar_id || 'primary';
    const since = (lastPollState.since as string) || new Date(Date.now() - 3600000).toISOString();

    const res = await fetch(
      `${BASE}/calendars/${encodeURIComponent(calendarId)}/events?orderBy=updated&singleEvents=true&timeMin=${encodeURIComponent(since)}&maxResults=10`,
      { headers: { Authorization: `Bearer ${credentials.access_token}` } }
    );

    if (!res.ok) return { newItems: [], nextPollState: lastPollState };
    const data = await res.json() as { items: Record<string, unknown>[] };
    return {
      newItems: data.items || [],
      nextPollState: { calendar_id: calendarId, since: new Date().toISOString() },
    };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    };

    if (actionKey === 'create_event') {
      const { calendar_id, summary, description, start_datetime, end_datetime, attendee_emails } = params as Record<string, string>;
      const attendees = attendee_emails
        ? attendee_emails.split(',').map(e => ({ email: e.trim() })).filter(a => a.email)
        : [];
      const res = await fetch(`${BASE}/calendars/${encodeURIComponent(calendar_id)}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          summary,
          description,
          start: { dateTime: start_datetime, timeZone: 'UTC' },
          end: { dateTime: end_datetime, timeZone: 'UTC' },
          attendees,
        }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'update_event') {
      const { calendar_id, eventId, summary, start_datetime, end_datetime } = params as Record<string, string>;
      const body: Record<string, unknown> = {};
      if (summary) body.summary = summary;
      if (start_datetime) body.start = { dateTime: start_datetime, timeZone: 'UTC' };
      if (end_datetime) body.end = { dateTime: end_datetime, timeZone: 'UTC' };
      const res = await fetch(`${BASE}/calendars/${encodeURIComponent(calendar_id)}/events/${eventId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'delete_event') {
      const { calendar_id, eventId } = params as Record<string, string>;
      const res = await fetch(`${BASE}/calendars/${encodeURIComponent(calendar_id)}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      });
      return { success: res.ok || res.status === 204, data: { success: res.ok } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default googleCalendarConnector;
