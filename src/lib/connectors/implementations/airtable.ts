import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.airtable.com/v0';

function airtableHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

const airtableConnector: ConnectorPlugin = {
  manifest: {
    id: 'airtable',
    slug: 'airtable',
    name: 'Airtable',
    description: 'Flexible database and spreadsheet hybrid with Airtable',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Airtable_Logo.svg',
    category: 'productivity',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'bearer',
    authConfig: {
      type: 'api_key',
      apiKeyField: 'api_key',
      apiKeyLabel: 'Personal Access Token',
    },
    triggers: [
      {
        key: 'new_record',
        name: 'New Record',
        description: 'Triggers when a new record is added to a table',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fields: { type: 'object' },
            createdTime: { type: 'string' },
          },
        },
      },
      {
        key: 'record_updated',
        name: 'Record Updated',
        description: 'Triggers when a record is updated in a table',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fields: { type: 'object' },
            createdTime: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_record',
        name: 'Create Record',
        description: 'Create a new record in an Airtable table',
        configFields: [
          { key: 'base_id', label: 'Base ID', type: 'string', required: true },
          { key: 'table_id', label: 'Table ID or Name', type: 'string', required: true },
          { key: 'fields', label: 'Fields (JSON)', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, createdTime: { type: 'string' } } },
      },
      {
        key: 'update_record',
        name: 'Update Record',
        description: 'Update an existing record in Airtable',
        configFields: [
          { key: 'base_id', label: 'Base ID', type: 'string', required: true },
          { key: 'table_id', label: 'Table ID or Name', type: 'string', required: true },
          { key: 'record_id', label: 'Record ID', type: 'string', required: true },
          { key: 'fields', label: 'Fields (JSON)', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'delete_record',
        name: 'Delete Record',
        description: 'Delete a record from an Airtable table',
        configFields: [
          { key: 'base_id', label: 'Base ID', type: 'string', required: true },
          { key: 'table_id', label: 'Table ID or Name', type: 'string', required: true },
          { key: 'record_id', label: 'Record ID', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { deleted: { type: 'boolean' }, id: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const res = await fetch('https://api.airtable.com/v0/meta/bases', {
      headers: airtableHeaders(credentials.api_key),
    });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const baseId = lastPollState.base_id as string || credentials.base_id;
    const tableId = lastPollState.table_id as string || credentials.table_id;
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (!baseId || !tableId) {
      return { newItems: [], nextPollState: lastPollState };
    }

    const headers = airtableHeaders(credentials.api_key);

    if (triggerKey === 'new_record') {
      const filterFormula = encodeURIComponent(`IS_AFTER(CREATED_TIME(), '${since}')`);
      const url = `${BASE}/${baseId}/${encodeURIComponent(tableId)}?filterByFormula=${filterFormula}&sort[0][field]=createdTime&sort[0][direction]=asc`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { records?: Record<string, unknown>[] };
      return {
        newItems: data.records || [],
        nextPollState: { ...lastPollState, since: new Date().toISOString() },
      };
    }

    if (triggerKey === 'record_updated') {
      const filterFormula = encodeURIComponent(`IS_AFTER(LAST_MODIFIED_TIME(), '${since}')`);
      const url = `${BASE}/${baseId}/${encodeURIComponent(tableId)}?filterByFormula=${filterFormula}&sort[0][field]=createdTime&sort[0][direction]=asc`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { records?: Record<string, unknown>[] };
      return {
        newItems: data.records || [],
        nextPollState: { ...lastPollState, since: new Date().toISOString() },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = airtableHeaders(credentials.api_key);

    if (actionKey === 'create_record') {
      const { base_id, table_id, fields } = params as {
        base_id: string;
        table_id: string;
        fields: string | Record<string, unknown>;
      };
      const parsedFields = typeof fields === 'string' ? JSON.parse(fields) : fields;
      const res = await fetch(`${BASE}/${base_id}/${encodeURIComponent(table_id)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fields: parsedFields }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Airtable create_record failed: ${err}` };
      }
      const data = await res.json() as { id: string; createdTime: string };
      return { success: true, data: { id: data.id, createdTime: data.createdTime } };
    }

    if (actionKey === 'update_record') {
      const { base_id, table_id, record_id, fields } = params as {
        base_id: string;
        table_id: string;
        record_id: string;
        fields: string | Record<string, unknown>;
      };
      const parsedFields = typeof fields === 'string' ? JSON.parse(fields) : fields;
      const res = await fetch(`${BASE}/${base_id}/${encodeURIComponent(table_id)}/${record_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields: parsedFields }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Airtable update_record failed: ${err}` };
      }
      const data = await res.json() as { id: string };
      return { success: true, data: { id: data.id } };
    }

    if (actionKey === 'delete_record') {
      const { base_id, table_id, record_id } = params as {
        base_id: string;
        table_id: string;
        record_id: string;
      };
      const res = await fetch(`${BASE}/${base_id}/${encodeURIComponent(table_id)}/${record_id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Airtable delete_record failed: ${err}` };
      }
      const data = await res.json() as { deleted: boolean; id: string };
      return { success: true, data: { deleted: data.deleted, id: data.id } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default airtableConnector;
