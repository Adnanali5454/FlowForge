import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const dropboxConnector: ConnectorPlugin = {
  manifest: {
    id: 'dropbox',
    slug: 'dropbox',
    name: 'Dropbox',
    description: 'Upload files, create folders, and manage your Dropbox storage',
    icon: 'https://aem.dropbox.com/cms/content/dam/dropbox/www/en-us/branding/dropbox-logos/app-dropbox-iOS.png',
    category: 'storage',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'oauth2',
    authConfig: {
      authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
      tokenUrl: 'https://api.dropbox.com/oauth2/token',
      scopes: ['files.content.write', 'files.content.read', 'sharing.write'],
      clientId: process.env.DROPBOX_CLIENT_ID || '',
      clientSecret: process.env.DROPBOX_CLIENT_SECRET || '',
    },
    triggers: [
      {
        key: 'new_file',
        name: 'New File',
        description: 'Triggers when a new file is added to Dropbox',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            path_display: { type: 'string' },
            size: { type: 'number' },
            client_modified: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'upload_file',
        name: 'Upload File',
        description: 'Upload a file to Dropbox',
        configFields: [
          { key: 'path', label: 'Destination Path (e.g. /folder/file.txt)', type: 'string', required: true },
          { key: 'content', label: 'File Content', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, path_display: { type: 'string' } } },
      },
      {
        key: 'create_folder',
        name: 'Create Folder',
        description: 'Create a new folder in Dropbox',
        configFields: [
          { key: 'path', label: 'Folder Path (e.g. /new-folder)', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, path_display: { type: 'string' } } },
      },
      {
        key: 'delete_file',
        name: 'Delete File',
        description: 'Delete a file or folder from Dropbox',
        configFields: [
          { key: 'path', label: 'Path to Delete', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { metadata: { type: 'object' } } },
      },
      {
        key: 'share_file',
        name: 'Share File',
        description: 'Create a public shared link for a file',
        configFields: [
          { key: 'path', label: 'File Path', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { url: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: 'null',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    if (triggerKey !== 'new_file') return { newItems: [], nextPollState: lastPollState };

    const cursor = lastPollState.cursor as string | undefined;

    let data: { entries?: Record<string, unknown>[]; cursor?: string; has_more?: boolean };

    if (cursor) {
      const res = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cursor }),
      });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      data = await res.json() as typeof data;
    } else {
      const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: '', recursive: false }),
      });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      data = await res.json() as typeof data;
    }

    const files = (data.entries || []).filter(e => (e as { '.tag'?: string })['.tag'] === 'file');
    return {
      newItems: files,
      nextPollState: { cursor: data.cursor },
    };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const token = credentials.access_token;
    const jsonHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (actionKey === 'upload_file') {
      const { path, content } = params as Record<string, string>;
      const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({ path, mode: 'add', autorename: true }),
        },
        body: content,
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'create_folder') {
      const { path } = params as Record<string, string>;
      const res = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ path, autorename: false }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'delete_file') {
      const { path } = params as Record<string, string>;
      const res = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ path }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'share_file') {
      const { path } = params as Record<string, string>;
      const res = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ path, settings: { requested_visibility: { '.tag': 'public' } } }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default dropboxConnector;
