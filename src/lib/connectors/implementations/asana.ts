import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://app.asana.com/api/1.0';

const asanaConnector: ConnectorPlugin = {
  manifest: {
    id: 'asana',
    slug: 'asana',
    name: 'Asana',
    description: 'Create tasks, update projects, and manage work in Asana',
    icon: 'https://assets.asana.biz/transform/fbe4e4b8-c21c-4cd9-85e9-f9b2a1c2e1c8/logo-asana.svg',
    category: 'productivity',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'bearer',
    authConfig: {
      fields: [
        { key: 'access_token', label: 'Personal Access Token', type: 'password', required: true },
        { key: 'workspace_gid', label: 'Workspace GID', type: 'string', required: true },
        { key: 'project_gid', label: 'Project GID', type: 'string', required: true },
      ],
    },
    triggers: [
      {
        key: 'new_task',
        name: 'New Task',
        description: 'Triggers when a new task is created in a project',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            gid: { type: 'string' },
            name: { type: 'string' },
            created_at: { type: 'string' },
            completed: { type: 'boolean' },
            assignee: { type: 'object' },
            due_on: { type: 'string' },
          },
        },
      },
      {
        key: 'task_completed',
        name: 'Task Completed',
        description: 'Triggers when a task is marked as completed',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            gid: { type: 'string' },
            name: { type: 'string' },
            completed: { type: 'boolean' },
            completed_at: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_task',
        name: 'Create Task',
        description: 'Create a new task in Asana',
        configFields: [
          { key: 'name', label: 'Task Name', type: 'string', required: true },
          { key: 'notes', label: 'Notes', type: 'textarea', required: false },
          { key: 'assignee', label: 'Assignee (email or GID)', type: 'string', required: false },
          { key: 'due_on', label: 'Due Date (YYYY-MM-DD)', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { gid: { type: 'string' } } },
      },
      {
        key: 'update_task',
        name: 'Update Task',
        description: 'Update an existing task in Asana',
        configFields: [
          { key: 'taskGid', label: 'Task GID', type: 'string', required: true },
          { key: 'name', label: 'Task Name', type: 'string', required: false },
          { key: 'notes', label: 'Notes', type: 'textarea', required: false },
          { key: 'completed', label: 'Completed', type: 'boolean', required: false },
          { key: 'due_on', label: 'Due Date (YYYY-MM-DD)', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { gid: { type: 'string' } } },
      },
      {
        key: 'add_comment',
        name: 'Add Comment',
        description: 'Add a comment to an Asana task',
        configFields: [
          { key: 'taskGid', label: 'Task GID', type: 'string', required: true },
          { key: 'text', label: 'Comment Text', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { gid: { type: 'string' } } },
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
    const projectGid = credentials.project_gid;
    const headers = { Authorization: `Bearer ${credentials.access_token}` };
    const since = (lastPollState.since as string) || new Date(Date.now() - 3600000).toISOString();

    if (triggerKey === 'new_task') {
      const res = await fetch(
        `${BASE}/tasks?project=${projectGid}&opt_fields=gid,name,created_at,completed,assignee,due_on&created_since=${since}&limit=10`,
        { headers }
      );
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { data: Record<string, unknown>[] };
      return { newItems: data.data || [], nextPollState: { since: new Date().toISOString() } };
    }

    if (triggerKey === 'task_completed') {
      const res = await fetch(
        `${BASE}/tasks?project=${projectGid}&opt_fields=gid,name,completed,completed_at&completed_since=${since}&limit=10`,
        { headers }
      );
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { data: Record<string, unknown>[] };
      const completed = (data.data || []).filter(t => t.completed);
      return { newItems: completed, nextPollState: { since: new Date().toISOString() } };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    };
    const projectGid = credentials.project_gid;
    const workspaceGid = credentials.workspace_gid;

    if (actionKey === 'create_task') {
      const { name, notes, assignee, due_on } = params as Record<string, string>;
      const res = await fetch(`${BASE}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: {
            name,
            notes,
            projects: [projectGid],
            workspace: workspaceGid,
            assignee: assignee || null,
            due_on: due_on || null,
          },
        }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'update_task') {
      const { taskGid, name, notes, completed, due_on } = params as Record<string, string>;
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (notes !== undefined) updateData.notes = notes;
      if (completed !== undefined) updateData.completed = completed === 'true' || completed === true as unknown;
      if (due_on !== undefined) updateData.due_on = due_on;
      const res = await fetch(`${BASE}/tasks/${taskGid}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: updateData }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'add_comment') {
      const { taskGid, text } = params as Record<string, string>;
      const res = await fetch(`${BASE}/tasks/${taskGid}/stories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: { text } }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default asanaConnector;
