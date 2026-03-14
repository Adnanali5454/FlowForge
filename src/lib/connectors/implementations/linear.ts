import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const GRAPHQL_URL = 'https://api.linear.app/graphql';

function linearHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: apiKey,
    'Content-Type': 'application/json',
  };
}

async function linearQuery(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: linearHeaders(apiKey),
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Linear API error: ${res.status} ${err}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

const linearConnector: ConnectorPlugin = {
  manifest: {
    id: 'linear',
    slug: 'linear',
    name: 'Linear',
    description: 'Modern issue tracking and project management with Linear',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Linear_logo.svg/1280px-Linear_logo.svg.png',
    category: 'productivity',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'api_key',
    authConfig: {
      type: 'api_key',
      headerName: 'Authorization',
      apiKeyField: 'api_key',
      apiKeyLabel: 'API Key',
    },
    triggers: [
      {
        key: 'new_issue',
        name: 'New Issue',
        description: 'Triggers when a new issue is created in Linear',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            state: { type: 'string' },
            priority: { type: 'number' },
            createdAt: { type: 'string' },
          },
        },
      },
      {
        key: 'issue_updated',
        name: 'Issue Updated',
        description: 'Triggers when an issue is updated in Linear',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            state: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_issue',
        name: 'Create Issue',
        description: 'Create a new issue in Linear',
        configFields: [
          { key: 'team_id', label: 'Team ID', type: 'string', required: true },
          { key: 'title', label: 'Title', type: 'string', required: true },
          { key: 'description', label: 'Description', type: 'textarea', required: false },
          { key: 'priority', label: 'Priority (0-4)', type: 'number', required: false },
          { key: 'assignee_id', label: 'Assignee ID', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } },
      },
      {
        key: 'update_issue',
        name: 'Update Issue',
        description: 'Update an existing issue in Linear',
        configFields: [
          { key: 'issue_id', label: 'Issue ID', type: 'string', required: true },
          { key: 'title', label: 'Title', type: 'string', required: false },
          { key: 'description', label: 'Description', type: 'textarea', required: false },
          { key: 'priority', label: 'Priority (0-4)', type: 'number', required: false },
          { key: 'state_id', label: 'State ID', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      {
        key: 'add_comment',
        name: 'Add Comment',
        description: 'Add a comment to a Linear issue',
        configFields: [
          { key: 'issue_id', label: 'Issue ID', type: 'string', required: true },
          { key: 'body', label: 'Comment Body', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const data = await linearQuery(credentials.api_key, '{ viewer { id name } }');
      return !!(data as { data?: { viewer?: { id?: string } } }).data?.viewer?.id;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (triggerKey === 'new_issue') {
      const query = `
        query NewIssues($after: String!) {
          issues(
            filter: { createdAt: { gte: $after } }
            orderBy: createdAt
          ) {
            nodes {
              id
              title
              description
              priority
              createdAt
              state { name }
              team { id name }
            }
          }
        }
      `;
      try {
        const data = await linearQuery(credentials.api_key, query, { after: since });
        const issues = (data as { data?: { issues?: { nodes?: Record<string, unknown>[] } } }).data?.issues?.nodes || [];
        const items = issues.map(issue => ({
          ...issue,
          state: (issue.state as { name: string })?.name || '',
          team_name: (issue.team as { name: string })?.name || '',
        }));
        return {
          newItems: items,
          nextPollState: { since: new Date().toISOString() },
        };
      } catch {
        return { newItems: [], nextPollState: lastPollState };
      }
    }

    if (triggerKey === 'issue_updated') {
      const query = `
        query UpdatedIssues($after: String!) {
          issues(
            filter: { updatedAt: { gte: $after } }
            orderBy: updatedAt
          ) {
            nodes {
              id
              title
              updatedAt
              state { name }
            }
          }
        }
      `;
      try {
        const data = await linearQuery(credentials.api_key, query, { after: since });
        const issues = (data as { data?: { issues?: { nodes?: Record<string, unknown>[] } } }).data?.issues?.nodes || [];
        const items = issues.map(issue => ({
          ...issue,
          state: (issue.state as { name: string })?.name || '',
        }));
        return {
          newItems: items,
          nextPollState: { since: new Date().toISOString() },
        };
      } catch {
        return { newItems: [], nextPollState: lastPollState };
      }
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    if (actionKey === 'create_issue') {
      const { team_id, title, description, priority, assignee_id } = params as {
        team_id: string;
        title: string;
        description?: string;
        priority?: number;
        assignee_id?: string;
      };
      const mutation = `
        mutation CreateIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue { id title }
          }
        }
      `;
      const input: Record<string, unknown> = { teamId: team_id, title };
      if (description) input.description = description;
      if (priority !== undefined) input.priority = priority;
      if (assignee_id) input.assigneeId = assignee_id;

      try {
        const data = await linearQuery(credentials.api_key, mutation, { input });
        const result = (data as { data?: { issueCreate?: { success: boolean; issue: { id: string; title: string } } } }).data?.issueCreate;
        if (!result?.success) return { success: false, error: 'Linear create_issue failed' };
        return { success: true, data: { id: result.issue.id, title: result.issue.title } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }

    if (actionKey === 'update_issue') {
      const { issue_id, title, description, priority, state_id } = params as {
        issue_id: string;
        title?: string;
        description?: string;
        priority?: number;
        state_id?: string;
      };
      const mutation = `
        mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) {
            success
            issue { id }
          }
        }
      `;
      const input: Record<string, unknown> = {};
      if (title) input.title = title;
      if (description) input.description = description;
      if (priority !== undefined) input.priority = priority;
      if (state_id) input.stateId = state_id;

      try {
        const data = await linearQuery(credentials.api_key, mutation, { id: issue_id, input });
        const result = (data as { data?: { issueUpdate?: { success: boolean; issue: { id: string } } } }).data?.issueUpdate;
        if (!result?.success) return { success: false, error: 'Linear update_issue failed' };
        return { success: true, data: { id: result.issue.id } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }

    if (actionKey === 'add_comment') {
      const { issue_id, body } = params as { issue_id: string; body: string };
      const mutation = `
        mutation AddComment($input: CommentCreateInput!) {
          commentCreate(input: $input) {
            success
            comment { id }
          }
        }
      `;
      try {
        const data = await linearQuery(credentials.api_key, mutation, { input: { issueId: issue_id, body } });
        const result = (data as { data?: { commentCreate?: { success: boolean; comment: { id: string } } } }).data?.commentCreate;
        if (!result?.success) return { success: false, error: 'Linear add_comment failed' };
        return { success: true, data: { id: result.comment.id } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default linearConnector;
