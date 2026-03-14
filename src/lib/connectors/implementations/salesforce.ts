import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const salesforceConnector: ConnectorPlugin = {
  manifest: {
    id: 'salesforce',
    slug: 'salesforce',
    name: 'Salesforce',
    description: 'Automate leads, opportunities, and contacts in Salesforce CRM',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
    category: 'crm',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'oauth2',
    authConfig: {
      authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      scopes: ['api', 'refresh_token'],
      clientId: process.env.SALESFORCE_CLIENT_ID || '',
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    },
    triggers: [
      {
        key: 'new_lead',
        name: 'New Lead',
        description: 'Triggers when a new lead is created in Salesforce',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            Id: { type: 'string' },
            Name: { type: 'string' },
            Email: { type: 'string' },
            Company: { type: 'string' },
            CreatedDate: { type: 'string' },
          },
        },
      },
      {
        key: 'new_opportunity',
        name: 'New Opportunity',
        description: 'Triggers when a new opportunity is created in Salesforce',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            Id: { type: 'string' },
            Name: { type: 'string' },
            Amount: { type: 'number' },
            StageName: { type: 'string' },
            CreatedDate: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_lead',
        name: 'Create Lead',
        description: 'Create a new lead in Salesforce',
        configFields: [
          { key: 'LastName', label: 'Last Name', type: 'string', required: true },
          { key: 'FirstName', label: 'First Name', type: 'string', required: false },
          { key: 'Email', label: 'Email', type: 'string', required: false },
          { key: 'Company', label: 'Company', type: 'string', required: true },
          { key: 'Phone', label: 'Phone', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'create_contact',
        name: 'Create Contact',
        description: 'Create a new contact in Salesforce',
        configFields: [
          { key: 'LastName', label: 'Last Name', type: 'string', required: true },
          { key: 'FirstName', label: 'First Name', type: 'string', required: false },
          { key: 'Email', label: 'Email', type: 'string', required: false },
          { key: 'AccountId', label: 'Account ID', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'update_opportunity',
        name: 'Update Opportunity',
        description: 'Update an existing opportunity in Salesforce',
        configFields: [
          { key: 'oppId', label: 'Opportunity ID', type: 'string', required: true },
          { key: 'StageName', label: 'Stage Name', type: 'string', required: false },
          { key: 'Amount', label: 'Amount', type: 'number', required: false },
        ],
        outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const instanceUrl = credentials.instance_url || 'https://login.salesforce.com';
      const res = await fetch(`${instanceUrl}/services/data/v57.0/limits`, {
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const instanceUrl = credentials.instance_url;
    const headers = { Authorization: `Bearer ${credentials.access_token}` };
    const since = (lastPollState.since as string) || new Date(Date.now() - 3600000).toISOString();

    const soqlSince = since.replace(/\.\d{3}Z$/, '+0000');

    if (triggerKey === 'new_lead') {
      const q = encodeURIComponent(
        `SELECT Id,Name,Email,Company,CreatedDate FROM Lead WHERE CreatedDate >= ${soqlSince} ORDER BY CreatedDate DESC LIMIT 10`
      );
      const res = await fetch(`${instanceUrl}/services/data/v57.0/query?q=${q}`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { records: Record<string, unknown>[] };
      return { newItems: data.records || [], nextPollState: { since: new Date().toISOString() } };
    }

    if (triggerKey === 'new_opportunity') {
      const q = encodeURIComponent(
        `SELECT Id,Name,Amount,StageName,CreatedDate FROM Opportunity WHERE CreatedDate >= ${soqlSince} LIMIT 10`
      );
      const res = await fetch(`${instanceUrl}/services/data/v57.0/query?q=${q}`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { records: Record<string, unknown>[] };
      return { newItems: data.records || [], nextPollState: { since: new Date().toISOString() } };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const instanceUrl = credentials.instance_url;
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    };

    if (actionKey === 'create_lead') {
      const { LastName, FirstName, Email, Company, Phone } = params as Record<string, string>;
      const res = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Lead`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ LastName, FirstName, Email, Company, Phone }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'create_contact') {
      const { LastName, FirstName, Email, AccountId } = params as Record<string, string>;
      const res = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Contact`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ LastName, FirstName, Email, AccountId }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'update_opportunity') {
      const { oppId, StageName, Amount } = params as Record<string, string>;
      const body: Record<string, unknown> = {};
      if (StageName) body.StageName = StageName;
      if (Amount) body.Amount = parseFloat(Amount);
      const res = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Opportunity/${oppId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      return { success: res.ok || res.status === 204, data: { success: res.ok } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default salesforceConnector;
