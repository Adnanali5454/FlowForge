import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

function mailchimpBase(apiKey: string): string {
  const dc = apiKey.split('-').pop() || 'us1';
  return `https://${dc}.api.mailchimp.com/3.0`;
}

function mailchimpHeaders(apiKey: string): Record<string, string> {
  const credentials = Buffer.from(`anystring:${apiKey}`).toString('base64');
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

const mailchimpConnector: ConnectorPlugin = {
  manifest: {
    id: 'mailchimp',
    slug: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and automation with Mailchimp',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Mailchimp_Logo-Horizontal_Black.svg/1280px-Mailchimp_Logo-Horizontal_Black.svg.png',
    category: 'marketing',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'api_key',
    authConfig: {
      type: 'api_key',
      apiKeyField: 'api_key',
      apiKeyLabel: 'API Key',
    },
    triggers: [
      {
        key: 'new_subscriber',
        name: 'New Subscriber',
        description: 'Triggers when a new subscriber is added to a list',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email_address: { type: 'string' },
            status: { type: 'string' },
            timestamp_opt: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'add_subscriber',
        name: 'Add Subscriber',
        description: 'Add a new subscriber to a Mailchimp list',
        configFields: [
          { key: 'list_id', label: 'List ID', type: 'string', required: true },
          { key: 'email', label: 'Email Address', type: 'string', required: true },
          { key: 'first_name', label: 'First Name', type: 'string', required: false },
          { key: 'last_name', label: 'Last Name', type: 'string', required: false },
          { key: 'status', label: 'Status', type: 'string', required: false, placeholder: 'subscribed' },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, email_address: { type: 'string' } } },
      },
      {
        key: 'update_subscriber',
        name: 'Update Subscriber',
        description: 'Update an existing subscriber in a Mailchimp list',
        configFields: [
          { key: 'list_id', label: 'List ID', type: 'string', required: true },
          { key: 'email', label: 'Email Address', type: 'string', required: true },
          { key: 'status', label: 'Status', type: 'string', required: false },
          { key: 'first_name', label: 'First Name', type: 'string', required: false },
          { key: 'last_name', label: 'Last Name', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' } } },
      },
      {
        key: 'send_campaign',
        name: 'Send Campaign',
        description: 'Send a Mailchimp campaign',
        configFields: [
          { key: 'campaign_id', label: 'Campaign ID', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const base = mailchimpBase(credentials.api_key);
    const headers = mailchimpHeaders(credentials.api_key);
    const res = await fetch(`${base}/ping`, { headers });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const base = mailchimpBase(credentials.api_key);
    const headers = mailchimpHeaders(credentials.api_key);
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const listId = (lastPollState.list_id as string) || credentials.list_id;

    if (!listId) {
      return { newItems: [], nextPollState: lastPollState };
    }

    if (triggerKey === 'new_subscriber') {
      const url = `${base}/lists/${listId}/members?since_timestamp_opt=${encodeURIComponent(since)}&count=20&sort_field=timestamp_opt&sort_dir=ASC`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { members?: Record<string, unknown>[] };
      return {
        newItems: data.members || [],
        nextPollState: { ...lastPollState, since: new Date().toISOString() },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const base = mailchimpBase(credentials.api_key);
    const headers = mailchimpHeaders(credentials.api_key);

    if (actionKey === 'add_subscriber') {
      const { list_id, email, first_name, last_name, status } = params as {
        list_id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        status?: string;
      };
      const body: Record<string, unknown> = {
        email_address: email,
        status: status || 'subscribed',
      };
      if (first_name || last_name) {
        body.merge_fields = {
          FNAME: first_name || '',
          LNAME: last_name || '',
        };
      }

      const res = await fetch(`${base}/lists/${list_id}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Mailchimp add_subscriber failed: ${err}` };
      }
      const data = await res.json() as { id: string; email_address: string };
      return { success: true, data: { id: data.id, email_address: data.email_address } };
    }

    if (actionKey === 'update_subscriber') {
      const { list_id, email, status, first_name, last_name } = params as {
        list_id: string;
        email: string;
        status?: string;
        first_name?: string;
        last_name?: string;
      };
      // Mailchimp uses MD5 hash of lowercased email as subscriber hash
      const subscriberHash = email.toLowerCase().trim();
      const hash = await crypto.subtle.digest('MD5', new TextEncoder().encode(subscriberHash)).catch(() => null);
      const md5 = hash
        ? Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
        : Buffer.from(subscriberHash).toString('hex');

      const body: Record<string, unknown> = {};
      if (status) body.status = status;
      if (first_name || last_name) {
        body.merge_fields = {
          FNAME: first_name || '',
          LNAME: last_name || '',
        };
      }

      const res = await fetch(`${base}/lists/${list_id}/members/${md5}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Mailchimp update_subscriber failed: ${err}` };
      }
      const data = await res.json() as { id: string; status: string };
      return { success: true, data: { id: data.id, status: data.status } };
    }

    if (actionKey === 'send_campaign') {
      const { campaign_id } = params as { campaign_id: string };
      const res = await fetch(`${base}/campaigns/${campaign_id}/actions/send`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Mailchimp send_campaign failed: ${err}` };
      }
      return { success: true, data: { success: true, campaign_id } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default mailchimpConnector;
