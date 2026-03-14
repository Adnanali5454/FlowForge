import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.github.com';

const githubConnector: ConnectorPlugin = {
  manifest: {
    id: 'github',
    slug: 'github',
    name: 'GitHub',
    description: 'Automate issues, pull requests, and commits on GitHub',
    icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    category: 'developer',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'api_key',
    authConfig: {
      fields: [
        { key: 'token', label: 'Personal Access Token', type: 'password', required: true },
        { key: 'owner', label: 'Repository Owner', type: 'string', required: true },
        { key: 'repo', label: 'Repository Name', type: 'string', required: true },
      ],
    },
    triggers: [
      {
        key: 'new_issue',
        name: 'New Issue',
        description: 'Triggers when a new issue is created in the repository',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            number: { type: 'number' },
            title: { type: 'string' },
            body: { type: 'string' },
            state: { type: 'string' },
            html_url: { type: 'string' },
            created_at: { type: 'string' },
          },
        },
      },
      {
        key: 'new_pr',
        name: 'New Pull Request',
        description: 'Triggers when a new pull request is opened',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            number: { type: 'number' },
            title: { type: 'string' },
            html_url: { type: 'string' },
            created_at: { type: 'string' },
          },
        },
      },
      {
        key: 'new_commit',
        name: 'New Commit',
        description: 'Triggers when a new commit is pushed to the repository',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            sha: { type: 'string' },
            message: { type: 'string' },
            html_url: { type: 'string' },
            author: { type: 'object' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_issue',
        name: 'Create Issue',
        description: 'Create a new issue in the repository',
        configFields: [
          { key: 'title', label: 'Title', type: 'string', required: true },
          { key: 'body', label: 'Body', type: 'textarea', required: false },
          { key: 'labels', label: 'Labels (comma-separated)', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { number: { type: 'number' }, html_url: { type: 'string' } } },
      },
      {
        key: 'create_comment',
        name: 'Create Comment',
        description: 'Add a comment to an issue or pull request',
        configFields: [
          { key: 'issueNumber', label: 'Issue Number', type: 'number', required: true },
          { key: 'body', label: 'Comment Body', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' } } },
      },
      {
        key: 'merge_pr',
        name: 'Merge Pull Request',
        description: 'Merge an open pull request',
        configFields: [
          { key: 'pullNumber', label: 'PR Number', type: 'number', required: true },
          { key: 'commit_title', label: 'Merge Commit Title', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { merged: { type: 'boolean' } } },
      },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch(`${BASE}/user`, {
        headers: {
          Authorization: `token ${credentials.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const { token, owner, repo } = credentials;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };
    const since = (lastPollState.since as string) || new Date(Date.now() - 3600000).toISOString();

    if (triggerKey === 'new_issue') {
      const res = await fetch(
        `${BASE}/repos/${owner}/${repo}/issues?state=open&sort=created&direction=desc&since=${since}&per_page=10`,
        { headers }
      );
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const items = await res.json() as Record<string, unknown>[];
      return { newItems: items, nextPollState: { since: new Date().toISOString() } };
    }

    if (triggerKey === 'new_pr') {
      const res = await fetch(
        `${BASE}/repos/${owner}/${repo}/pulls?state=open&sort=created&direction=desc&per_page=10`,
        { headers }
      );
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const items = await res.json() as Record<string, unknown>[];
      return { newItems: items, nextPollState: { since: new Date().toISOString() } };
    }

    if (triggerKey === 'new_commit') {
      const res = await fetch(
        `${BASE}/repos/${owner}/${repo}/commits?since=${since}&per_page=10`,
        { headers }
      );
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const items = await res.json() as Record<string, unknown>[];
      return { newItems: items, nextPollState: { since: new Date().toISOString() } };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const { token, owner, repo } = credentials;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    if (actionKey === 'create_issue') {
      const { title, body, labels } = params as { title: string; body?: string; labels?: string };
      const labelArray = labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : [];
      const res = await fetch(`${BASE}/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, body, labels: labelArray }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'create_comment') {
      const { issueNumber, body } = params as { issueNumber: number; body: string };
      const res = await fetch(`${BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    if (actionKey === 'merge_pr') {
      const { pullNumber, commit_title } = params as { pullNumber: number; commit_title?: string };
      const res = await fetch(`${BASE}/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ commit_title, merge_method: 'squash' }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = await res.json() as Record<string, unknown>;
      return { success: true, data };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default githubConnector;
