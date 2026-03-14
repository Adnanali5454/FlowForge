import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

function zendeskBase(subdomain: string): string {
  return `https://${subdomain}.zendesk.com/api/v2`;
}

function zendeskHeaders(email: string, apiToken: string): Record<string, string> {
  const credentials = Buffer.from(`${email}/token:${apiToken}`).toString('base64');
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

const zendeskConnector: ConnectorPlugin = {
  manifest: {
    id: 'zendesk',
    slug: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support and helpdesk with Zendesk',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Zendesk_logo.svg/1280px-Zendesk_logo.svg.png',
    category: 'communication',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'basic',
    authConfig: {
      type: 'basic',
      usernameField: 'email',
      passwordField: 'api_token',
    },
    triggers: [
      {
        key: 'new_ticket',
        name: 'New Ticket',
        description: 'Triggers when a new support ticket is created',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            subject: { type: 'string' },
            status: { type: 'string' },
            priority: { type: 'string' },
            requester_id: { type: 'number' },
            created_at: { type: 'string' },
          },
        },
      },
      {
        key: 'ticket_updated',
        name: 'Ticket Updated',
        description: 'Triggers when a support ticket is updated',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            subject: { type: 'string' },
            status: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_ticket',
        name: 'Create Ticket',
        description: 'Create a new support ticket in Zendesk',
        configFields: [
          { key: 'subject', label: 'Subject', type: 'string', required: true },
          { key: 'body', label: 'Body', type: 'textarea', required: true },
          { key: 'priority', label: 'Priority', type: 'string', required: false, placeholder: 'normal' },
          { key: 'requester_email', label: 'Requester Email', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, subject: { type: 'string' } } },
      },
      {
        key: 'update_ticket',
        name: 'Update Ticket',
        description: 'Update an existing ticket in Zendesk',
        configFields: [
          { key: 'ticket_id', label: 'Ticket ID', type: 'number', required: true },
          { key: 'status', label: 'Status', type: 'string', required: false },
          { key: 'priority', label: 'Priority', type: 'string', required: false },
          { key: 'subject', label: 'Subject', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, status: { type: 'string' } } },
      },
      {
        key: 'add_comment',
        name: 'Add Comment',
        description: 'Add a comment to an existing ticket',
        configFields: [
          { key: 'ticket_id', label: 'Ticket ID', type: 'number', required: true },
          { key: 'body', label: 'Comment Body', type: 'textarea', required: true },
          { key: 'public', label: 'Public Comment', type: 'boolean', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, body: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const base = zendeskBase(credentials.subdomain);
    const headers = zendeskHeaders(credentials.email, credentials.api_token);
    const res = await fetch(`${base}/users/me.json`, { headers });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const base = zendeskBase(credentials.subdomain);
    const headers = zendeskHeaders(credentials.email, credentials.api_token);
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (triggerKey === 'new_ticket') {
      const res = await fetch(`${base}/tickets.json?created_after=${encodeURIComponent(since)}&sort_by=created_at&sort_order=asc`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { tickets?: Record<string, unknown>[] };
      return {
        newItems: data.tickets || [],
        nextPollState: { since: new Date().toISOString() },
      };
    }

    if (triggerKey === 'ticket_updated') {
      const res = await fetch(`${base}/tickets.json?updated_after=${encodeURIComponent(since)}&sort_by=updated_at&sort_order=asc`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { tickets?: Record<string, unknown>[] };
      return {
        newItems: data.tickets || [],
        nextPollState: { since: new Date().toISOString() },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const base = zendeskBase(credentials.subdomain);
    const headers = zendeskHeaders(credentials.email, credentials.api_token);

    if (actionKey === 'create_ticket') {
      const { subject, body, priority, requester_email } = params as {
        subject: string;
        body: string;
        priority?: string;
        requester_email?: string;
      };
      const ticketData: Record<string, unknown> = {
        subject,
        comment: { body },
        priority: priority || 'normal',
      };
      if (requester_email) ticketData.requester = { email: requester_email };

      const res = await fetch(`${base}/tickets.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticket: ticketData }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Zendesk create_ticket failed: ${err}` };
      }
      const data = await res.json() as { ticket: { id: number; subject: string } };
      return { success: true, data: { id: data.ticket.id, subject: data.ticket.subject } };
    }

    if (actionKey === 'update_ticket') {
      const { ticket_id, status, priority, subject } = params as {
        ticket_id: number;
        status?: string;
        priority?: string;
        subject?: string;
      };
      const ticketData: Record<string, unknown> = {};
      if (status) ticketData.status = status;
      if (priority) ticketData.priority = priority;
      if (subject) ticketData.subject = subject;

      const res = await fetch(`${base}/tickets/${ticket_id}.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ticket: ticketData }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Zendesk update_ticket failed: ${err}` };
      }
      const data = await res.json() as { ticket: { id: number; status: string } };
      return { success: true, data: { id: data.ticket.id, status: data.ticket.status } };
    }

    if (actionKey === 'add_comment') {
      const { ticket_id, body, public: isPublic } = params as {
        ticket_id: number;
        body: string;
        public?: boolean;
      };
      const res = await fetch(`${base}/tickets/${ticket_id}.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ticket: {
            comment: { body, public: isPublic !== false },
          },
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Zendesk add_comment failed: ${err}` };
      }
      const data = await res.json() as { ticket: { id: number } };
      return { success: true, data: { id: data.ticket.id, body } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default zendeskConnector;
