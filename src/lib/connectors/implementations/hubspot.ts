import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.hubapi.com';

const hubspotConnector: ConnectorPlugin = {
  manifest: {
    id: 'hubspot',
    slug: 'hubspot',
    name: 'HubSpot',
    description: 'Manage contacts, deals, and pipelines in HubSpot CRM',
    icon: 'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png',
    category: 'crm',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'bearer',
    authConfig: {
      fields: [
        { key: 'access_token', label: 'Private App Access Token', type: 'password', required: true },
      ],
    },
    triggers: [
      {
        key: 'new_contact',
        name: 'New Contact',
        description: 'Triggers when a new contact is created in HubSpot',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstname: { type: 'string' },
            lastname: { type: 'string' },
            createdate: { type: 'string' },
          },
        },
      },
      {
        key: 'new_deal',
        name: 'New Deal',
        description: 'Triggers when a new deal is created in HubSpot',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            dealname: { type: 'string' },
            amount: { type: 'string' },
            dealstage: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_contact',
        name: 'Create Contact',
        description: 'Create a new contact in HubSpot',
        configFields: [
          { key: 'email', label: 'Email', type: 'string', required: true },
          { key: 'firstname', label: 'First Name', type: 'string', required: false },
          { key: 'lastname', label: 'Last Name', type: 'string', required: false },
          { key: 'phone', label: 'Phone', type: 'string', required: false },
          { key: 'company', label: 'Company', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'create_deal',
        name: 'Create Deal',
        description: 'Create a new deal in HubSpot',
        configFields: [
          { key: 'dealname', label: 'Deal Name', type: 'string', required: true },
          { key: 'amount', label: 'Amount', type: 'number', required: false },
          { key: 'dealstage', label: 'Deal Stage', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'update_contact',
        name: 'Update Contact',
        description: 'Update an existing contact in HubSpot',
        configFields: [
          { key: 'contactId', label: 'Contact ID', type: 'string', required: true },
          { key: 'email', label: 'Email', type: 'string', required: false },
          { key: 'firstname', label: 'First Name', type: 'string', required: false },
          { key: 'lastname', label: 'Last Name', type: 'string', required: false },
          { key: 'phone', label: 'Phone', type: 'string', required: false },
          { key: 'company', label: 'Company', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch(`${BASE}/crm/v3/objects/contacts?limit=1`, {
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    };
    const since = (lastPollState.since as string) || new Date(Date.now() - 3600000).toISOString();

    if (triggerKey === 'new_contact') {
      const filter = JSON.stringify([{ filters: [{ propertyName: 'createdate', operator: 'GTE', value: since }] }]);
      const url = `${BASE}/crm/v3/objects/contacts?limit=10&properties=email,firstname,lastname,createdate&sort=-createdate&filterGroups=${encodeURIComponent(filter)}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { results: Record<string, unknown>[] };
      return { newItems: data.results || [], nextPollState: { since: new Date().toISOString() } };
    }

    if (triggerKey === 'new_deal') {
      const res = await fetch(
        `${BASE}/crm/v3/objects/deals?limit=10&properties=dealname,amount,dealstage,createdate&sort=-createdate`,
        { headers }
      );
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { results: Record<string, unknown>[] };
      return { newItems: data.results || [], nextPollState: { since: new Date().toISOString() } };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    };

    if (actionKey === 'create_contact') {
      const { email, firstname, lastname, phone, company } = params as Record<string, string>;
      const res = await fetch(`${BASE}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ properties: { email, firstname, lastname, phone, company } }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'create_deal') {
      const { dealname, amount, dealstage } = params as Record<string, string>;
      const res = await fetch(`${BASE}/crm/v3/objects/deals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          properties: {
            dealname,
            amount,
            dealstage: dealstage || 'appointmentscheduled',
            pipeline: 'default',
          },
        }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'update_contact') {
      const { contactId, ...rest } = params as Record<string, string>;
      const { contactId: _id, ...properties } = { contactId, ...rest };
      const res = await fetch(`${BASE}/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ properties }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default hubspotConnector;
