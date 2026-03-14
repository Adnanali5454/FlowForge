import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.pipedrive.com/v1';

function pipedriveUrl(path: string, apiToken: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ api_token: apiToken, ...(extra || {}) });
  return `${BASE}${path}?${params.toString()}`;
}

const pipedriveConnector: ConnectorPlugin = {
  manifest: {
    id: 'pipedrive',
    slug: 'pipedrive',
    name: 'Pipedrive',
    description: 'CRM and sales pipeline management with Pipedrive',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Pipedrive_logo.svg/1280px-Pipedrive_logo.svg.png',
    category: 'crm',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'api_key',
    authConfig: {
      type: 'api_key',
      location: 'query',
      apiKeyField: 'api_token',
      apiKeyLabel: 'API Token',
    },
    triggers: [
      {
        key: 'new_deal',
        name: 'New Deal',
        description: 'Triggers when a new deal is created in Pipedrive',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            value: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string' },
            add_time: { type: 'string' },
          },
        },
      },
      {
        key: 'new_person',
        name: 'New Person',
        description: 'Triggers when a new person (contact) is created in Pipedrive',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'array' },
            phone: { type: 'array' },
            add_time: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_deal',
        name: 'Create Deal',
        description: 'Create a new deal in Pipedrive',
        configFields: [
          { key: 'title', label: 'Title', type: 'string', required: true },
          { key: 'value', label: 'Value', type: 'number', required: false },
          { key: 'currency', label: 'Currency', type: 'string', required: false, placeholder: 'USD' },
          { key: 'person_id', label: 'Person ID', type: 'number', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, title: { type: 'string' } } },
      },
      {
        key: 'create_person',
        name: 'Create Person',
        description: 'Create a new person (contact) in Pipedrive',
        configFields: [
          { key: 'name', label: 'Name', type: 'string', required: true },
          { key: 'email', label: 'Email', type: 'string', required: false },
          { key: 'phone', label: 'Phone', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, name: { type: 'string' } } },
      },
      {
        key: 'update_deal',
        name: 'Update Deal',
        description: 'Update an existing deal in Pipedrive',
        configFields: [
          { key: 'deal_id', label: 'Deal ID', type: 'number', required: true },
          { key: 'title', label: 'Title', type: 'string', required: false },
          { key: 'value', label: 'Value', type: 'number', required: false },
          { key: 'status', label: 'Status', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, title: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const res = await fetch(pipedriveUrl('/users/me', credentials.api_token));
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ').replace(/\..+/, '');

    if (triggerKey === 'new_deal') {
      const url = pipedriveUrl('/deals', credentials.api_token, {
        since_timestamp: since,
        limit: '10',
        sort: 'add_time ASC',
      });
      const res = await fetch(url);
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { data?: Record<string, unknown>[] };
      return {
        newItems: data.data || [],
        nextPollState: { since: new Date().toISOString().replace('T', ' ').replace(/\..+/, '') },
      };
    }

    if (triggerKey === 'new_person') {
      const url = pipedriveUrl('/persons', credentials.api_token, {
        since_timestamp: since,
        limit: '10',
        sort: 'add_time ASC',
      });
      const res = await fetch(url);
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { data?: Record<string, unknown>[] };
      return {
        newItems: data.data || [],
        nextPollState: { since: new Date().toISOString().replace('T', ' ').replace(/\..+/, '') },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    if (actionKey === 'create_deal') {
      const { title, value, currency, person_id } = params as {
        title: string;
        value?: number;
        currency?: string;
        person_id?: number;
      };
      const body: Record<string, unknown> = { title };
      if (value !== undefined) body.value = value;
      if (currency) body.currency = currency;
      if (person_id !== undefined) body.person_id = person_id;

      const res = await fetch(pipedriveUrl('/deals', credentials.api_token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Pipedrive create_deal failed: ${err}` };
      }
      const data = await res.json() as { data: { id: number; title: string } };
      return { success: true, data: { id: data.data.id, title: data.data.title } };
    }

    if (actionKey === 'create_person') {
      const { name, email, phone } = params as { name: string; email?: string; phone?: string };
      const body: Record<string, unknown> = { name };
      if (email) body.email = [{ value: email, primary: true }];
      if (phone) body.phone = [{ value: phone, primary: true }];

      const res = await fetch(pipedriveUrl('/persons', credentials.api_token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Pipedrive create_person failed: ${err}` };
      }
      const data = await res.json() as { data: { id: number; name: string } };
      return { success: true, data: { id: data.data.id, name: data.data.name } };
    }

    if (actionKey === 'update_deal') {
      const { deal_id, title, value, status } = params as {
        deal_id: number;
        title?: string;
        value?: number;
        status?: string;
      };
      const body: Record<string, unknown> = {};
      if (title) body.title = title;
      if (value !== undefined) body.value = value;
      if (status) body.status = status;

      const res = await fetch(pipedriveUrl(`/deals/${deal_id}`, credentials.api_token), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Pipedrive update_deal failed: ${err}` };
      }
      const data = await res.json() as { data: { id: number; title: string } };
      return { success: true, data: { id: data.data.id, title: data.data.title } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default pipedriveConnector;
