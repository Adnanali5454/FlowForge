import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function notionHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

const notionConnector: ConnectorPlugin = {
  manifest: {
    id: 'notion',
    slug: 'notion',
    name: 'Notion',
    description: 'Notes, wikis, and databases with Notion',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    category: 'productivity',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'bearer',
    authConfig: {
      type: 'api_key',
      apiKeyField: 'token',
      apiKeyLabel: 'Integration Token',
    },
    triggers: [
      {
        key: 'new_page',
        name: 'New Page',
        description: 'Triggers when a new page is created in a Notion database',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            created_time: { type: 'string' },
            last_edited_time: { type: 'string' },
            properties: { type: 'object' },
            url: { type: 'string' },
          },
        },
      },
      {
        key: 'page_updated',
        name: 'Page Updated',
        description: 'Triggers when a page is updated in a Notion database',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            last_edited_time: { type: 'string' },
            properties: { type: 'object' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_page',
        name: 'Create Page',
        description: 'Create a new page in a Notion database',
        configFields: [
          { key: 'database_id', label: 'Database ID', type: 'string', required: true },
          { key: 'title', label: 'Page Title', type: 'string', required: true },
          { key: 'properties', label: 'Additional Properties (JSON)', type: 'textarea', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, url: { type: 'string' } } },
      },
      {
        key: 'update_page',
        name: 'Update Page',
        description: 'Update properties of an existing Notion page',
        configFields: [
          { key: 'page_id', label: 'Page ID', type: 'string', required: true },
          { key: 'properties', label: 'Properties (JSON)', type: 'textarea', required: true },
          { key: 'archived', label: 'Archive Page', type: 'boolean', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'append_block',
        name: 'Append Block Content',
        description: 'Append content blocks to a Notion page or block',
        configFields: [
          { key: 'block_id', label: 'Block/Page ID', type: 'string', required: true },
          { key: 'content', label: 'Content Text', type: 'textarea', required: true },
          { key: 'block_type', label: 'Block Type', type: 'string', required: false, placeholder: 'paragraph' },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const res = await fetch(`${BASE}/users/me`, {
      headers: notionHeaders(credentials.token),
    });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const headers = notionHeaders(credentials.token);
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const databaseId = (lastPollState.database_id as string) || credentials.database_id;

    if (!databaseId) {
      return { newItems: [], nextPollState: lastPollState };
    }

    if (triggerKey === 'new_page') {
      const body = {
        filter: {
          timestamp: 'created_time',
          created_time: { after: since },
        },
        sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
        page_size: 20,
      };
      const res = await fetch(`${BASE}/databases/${databaseId}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { results?: Record<string, unknown>[] };
      return {
        newItems: data.results || [],
        nextPollState: { ...lastPollState, since: new Date().toISOString() },
      };
    }

    if (triggerKey === 'page_updated') {
      const body = {
        filter: {
          timestamp: 'last_edited_time',
          last_edited_time: { after: since },
        },
        sorts: [{ timestamp: 'last_edited_time', direction: 'ascending' }],
        page_size: 20,
      };
      const res = await fetch(`${BASE}/databases/${databaseId}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { results?: Record<string, unknown>[] };
      return {
        newItems: data.results || [],
        nextPollState: { ...lastPollState, since: new Date().toISOString() },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = notionHeaders(credentials.token);

    if (actionKey === 'create_page') {
      const { database_id, title, properties } = params as {
        database_id: string;
        title: string;
        properties?: string | Record<string, unknown>;
      };
      const parsedProps = properties
        ? typeof properties === 'string' ? JSON.parse(properties) : properties
        : {};

      const body = {
        parent: { database_id },
        properties: {
          title: {
            title: [{ type: 'text', text: { content: title } }],
          },
          ...parsedProps,
        },
      };

      const res = await fetch(`${BASE}/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Notion create_page failed: ${err}` };
      }
      const data = await res.json() as { id: string; url: string };
      return { success: true, data: { id: data.id, url: data.url } };
    }

    if (actionKey === 'update_page') {
      const { page_id, properties, archived } = params as {
        page_id: string;
        properties: string | Record<string, unknown>;
        archived?: boolean;
      };
      const parsedProps = typeof properties === 'string' ? JSON.parse(properties) : properties;
      const body: Record<string, unknown> = { properties: parsedProps };
      if (archived !== undefined) body.archived = archived;

      const res = await fetch(`${BASE}/pages/${page_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Notion update_page failed: ${err}` };
      }
      const data = await res.json() as { id: string };
      return { success: true, data: { id: data.id } };
    }

    if (actionKey === 'append_block') {
      const { block_id, content, block_type } = params as {
        block_id: string;
        content: string;
        block_type?: string;
      };
      const type = block_type || 'paragraph';
      const block: Record<string, unknown> = {
        object: 'block',
        type,
        [type]: {
          rich_text: [{ type: 'text', text: { content } }],
        },
      };

      const res = await fetch(`${BASE}/blocks/${block_id}/children`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ children: [block] }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Notion append_block failed: ${err}` };
      }
      const data = await res.json() as { results?: Array<{ id: string }> };
      return { success: true, data: { id: data.results?.[0]?.id || block_id } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default notionConnector;
