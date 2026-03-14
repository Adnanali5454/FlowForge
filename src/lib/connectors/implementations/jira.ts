import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

function jiraBase(domain: string): string {
  return `https://${domain}.atlassian.net/rest/api/3`;
}

function jiraHeaders(email: string, apiToken: string): Record<string, string> {
  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

const jiraConnector: ConnectorPlugin = {
  manifest: {
    id: 'jira',
    slug: 'jira',
    name: 'Jira',
    description: 'Project management and issue tracking with Jira',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg',
    category: 'productivity',
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
        key: 'new_issue',
        name: 'New Issue',
        description: 'Triggers when a new issue is created in Jira',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            key: { type: 'string' },
            summary: { type: 'string' },
            status: { type: 'string' },
            priority: { type: 'string' },
            created: { type: 'string' },
          },
        },
      },
      {
        key: 'issue_updated',
        name: 'Issue Updated',
        description: 'Triggers when a Jira issue is updated',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            key: { type: 'string' },
            summary: { type: 'string' },
            status: { type: 'string' },
            updated: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_issue',
        name: 'Create Issue',
        description: 'Create a new issue in Jira',
        configFields: [
          { key: 'project_key', label: 'Project Key', type: 'string', required: true },
          { key: 'summary', label: 'Summary', type: 'string', required: true },
          { key: 'description', label: 'Description', type: 'textarea', required: false },
          { key: 'issue_type', label: 'Issue Type', type: 'string', required: false, placeholder: 'Task' },
          { key: 'priority', label: 'Priority', type: 'string', required: false },
          { key: 'assignee_id', label: 'Assignee Account ID', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, key: { type: 'string' } } },
      },
      {
        key: 'update_issue',
        name: 'Update Issue',
        description: 'Update an existing Jira issue',
        configFields: [
          { key: 'issue_key', label: 'Issue Key (e.g. PROJ-123)', type: 'string', required: true },
          { key: 'summary', label: 'Summary', type: 'string', required: false },
          { key: 'description', label: 'Description', type: 'textarea', required: false },
          { key: 'priority', label: 'Priority', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { key: { type: 'string' } } },
      },
      {
        key: 'add_comment',
        name: 'Add Comment',
        description: 'Add a comment to a Jira issue',
        configFields: [
          { key: 'issue_key', label: 'Issue Key', type: 'string', required: true },
          { key: 'body', label: 'Comment Body', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'transition_issue',
        name: 'Transition Issue',
        description: 'Transition a Jira issue to a different status',
        configFields: [
          { key: 'issue_key', label: 'Issue Key', type: 'string', required: true },
          { key: 'transition_id', label: 'Transition ID', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const base = jiraBase(credentials.domain);
    const headers = jiraHeaders(credentials.email, credentials.api_token);
    const res = await fetch(`${base}/myself`, { headers });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const base = jiraBase(credentials.domain);
    const headers = jiraHeaders(credentials.email, credentials.api_token);
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString().split('.')[0].replace('T', ' ');

    if (triggerKey === 'new_issue') {
      const jql = encodeURIComponent(`created >= "${since}" ORDER BY created ASC`);
      const res = await fetch(`${base}/search?jql=${jql}&maxResults=20&fields=summary,status,priority,created`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { issues?: Array<{ id: string; key: string; fields: Record<string, unknown> }> };
      const items = (data.issues || []).map(issue => ({
        id: issue.id,
        key: issue.key,
        summary: (issue.fields.summary as string) || '',
        status: ((issue.fields.status as { name: string })?.name) || '',
        priority: ((issue.fields.priority as { name: string })?.name) || '',
        created: issue.fields.created,
      }));
      return {
        newItems: items,
        nextPollState: { since: new Date().toISOString().split('.')[0].replace('T', ' ') },
      };
    }

    if (triggerKey === 'issue_updated') {
      const jql = encodeURIComponent(`updated >= "${since}" ORDER BY updated ASC`);
      const res = await fetch(`${base}/search?jql=${jql}&maxResults=20&fields=summary,status,priority,updated`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { issues?: Array<{ id: string; key: string; fields: Record<string, unknown> }> };
      const items = (data.issues || []).map(issue => ({
        id: issue.id,
        key: issue.key,
        summary: (issue.fields.summary as string) || '',
        status: ((issue.fields.status as { name: string })?.name) || '',
        updated: issue.fields.updated,
      }));
      return {
        newItems: items,
        nextPollState: { since: new Date().toISOString().split('.')[0].replace('T', ' ') },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const base = jiraBase(credentials.domain);
    const headers = jiraHeaders(credentials.email, credentials.api_token);

    if (actionKey === 'create_issue') {
      const { project_key, summary, description, issue_type, priority, assignee_id } = params as {
        project_key: string;
        summary: string;
        description?: string;
        issue_type?: string;
        priority?: string;
        assignee_id?: string;
      };
      const fields: Record<string, unknown> = {
        project: { key: project_key },
        summary,
        issuetype: { name: issue_type || 'Task' },
      };
      if (description) {
        fields.description = {
          type: 'doc',
          version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }],
        };
      }
      if (priority) fields.priority = { name: priority };
      if (assignee_id) fields.assignee = { id: assignee_id };

      const res = await fetch(`${base}/issue`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Jira create_issue failed: ${err}` };
      }
      const data = await res.json() as { id: string; key: string };
      return { success: true, data: { id: data.id, key: data.key } };
    }

    if (actionKey === 'update_issue') {
      const { issue_key, summary, description, priority } = params as {
        issue_key: string;
        summary?: string;
        description?: string;
        priority?: string;
      };
      const fields: Record<string, unknown> = {};
      if (summary) fields.summary = summary;
      if (description) {
        fields.description = {
          type: 'doc',
          version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }],
        };
      }
      if (priority) fields.priority = { name: priority };

      const res = await fetch(`${base}/issue/${issue_key}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Jira update_issue failed: ${err}` };
      }
      return { success: true, data: { key: issue_key } };
    }

    if (actionKey === 'add_comment') {
      const { issue_key, body } = params as { issue_key: string; body: string };
      const commentBody = {
        body: {
          type: 'doc',
          version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
        },
      };
      const res = await fetch(`${base}/issue/${issue_key}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commentBody),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Jira add_comment failed: ${err}` };
      }
      const data = await res.json() as { id: string };
      return { success: true, data: { id: data.id } };
    }

    if (actionKey === 'transition_issue') {
      const { issue_key, transition_id } = params as { issue_key: string; transition_id: string };
      const res = await fetch(`${base}/issue/${issue_key}/transitions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ transition: { id: transition_id } }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Jira transition_issue failed: ${err}` };
      }
      return { success: true, data: { success: true, issue_key, transition_id } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default jiraConnector;
