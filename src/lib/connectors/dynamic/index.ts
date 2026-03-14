// ─── Dynamic HTTP Connector ──────────────────────────────────────────────────
// Generic HTTP/REST API connector for 6,000+ apps.
// Supports OAuth2, API key, bearer token, basic auth, and custom auth.
// Enables webhook triggers, polling, and dynamic action execution.

import type { ConnectorPlugin, ActionResult, WebhookResult, PollResult } from '../base';
import { createManifest } from '../base';

/**
 * Dynamic HTTP Connector Manifest
 * Allows users to define custom REST API integrations without code.
 */
export const dynamicHttpConnector: ConnectorPlugin = {
  manifest: createManifest({
    slug: 'http-connector',
    name: 'Custom HTTP / REST API',
    description: 'Connect to any app with a REST API — supports 6,000+ services',
    icon: '🌐',
    category: 'utility',
    authType: 'custom',
    authConfig: {
      type: 'custom',
      usernameField: 'baseUrl',
      passwordField: 'authMethod',
    },
    triggers: [
      {
        key: 'webhook_trigger',
        name: 'Webhook',
        description: 'Receive data via HTTP webhook',
        type: 'webhook',
        outputSchema: {
          type: 'object',
          properties: {
            body: { type: 'object', description: 'Request body' },
            headers: { type: 'object', description: 'Request headers' },
            method: { type: 'string', description: 'HTTP method' },
            path: { type: 'string', description: 'Request path' },
            query: { type: 'object', description: 'Query parameters' },
          },
        },
        configFields: [
          {
            key: 'path',
            label: 'Webhook Path',
            type: 'string',
            required: false,
            placeholder: '/webhook/custom',
            helpText: 'Path suffix for this webhook endpoint',
          },
          {
            key: 'expectedMethod',
            label: 'Expected Method',
            type: 'select',
            required: false,
            options: [
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'GET', value: 'GET' },
              { label: 'PATCH', value: 'PATCH' },
            ],
          },
        ],
      },
      {
        key: 'polling_trigger',
        name: 'Polling',
        description: 'Poll an API endpoint at regular intervals',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            items: { type: 'array', description: 'Polled items' },
            hasMore: { type: 'boolean' },
            cursor: { type: 'string', description: 'Pagination cursor' },
          },
        },
        configFields: [
          {
            key: 'endpoint',
            label: 'Endpoint',
            type: 'string',
            required: true,
            placeholder: '/api/v1/items',
            helpText: 'API endpoint path (relative to base URL)',
          },
          {
            key: 'method',
            label: 'Method',
            type: 'select',
            required: false,
            options: [
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
            ],
          },
          {
            key: 'pollingInterval',
            label: 'Polling Interval (seconds)',
            type: 'number',
            required: true,
            placeholder: '300',
          },
          {
            key: 'dataPath',
            label: 'Data Path (JSONPath)',
            type: 'string',
            required: false,
            placeholder: 'data.items',
            helpText: 'Path to array in response (e.g., data.items)',
          },
          {
            key: 'lastModifiedField',
            label: 'Last Modified Field',
            type: 'string',
            required: false,
            placeholder: 'updatedAt',
            helpText: 'Field to track changes for new items only',
          },
        ],
      },
    ],
    actions: [
      {
        key: 'make_request',
        name: 'Make Request',
        description: 'Make a custom HTTP request to any endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
            endpoint: { type: 'string' },
            headers: { type: 'object' },
            body: { type: 'object' },
            queryParams: { type: 'object' },
          },
          required: ['method', 'endpoint'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            body: { type: 'object' },
            headers: { type: 'object' },
          },
        },
        configFields: [
          {
            key: 'method',
            label: 'HTTP Method',
            type: 'select',
            required: true,
            options: [
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'PATCH', value: 'PATCH' },
              { label: 'DELETE', value: 'DELETE' },
            ],
          },
          {
            key: 'endpoint',
            label: 'Endpoint Path',
            type: 'string',
            required: true,
            placeholder: '/api/v1/resource',
          },
          {
            key: 'headers',
            label: 'Custom Headers (JSON)',
            type: 'textarea',
            required: false,
            placeholder: '{"X-Custom": "value"}',
          },
          {
            key: 'body',
            label: 'Request Body (JSON)',
            type: 'textarea',
            required: false,
            placeholder: '{"key": "value"}',
          },
          {
            key: 'queryParams',
            label: 'Query Parameters (JSON)',
            type: 'textarea',
            required: false,
            placeholder: '{"limit": 10}',
          },
          {
            key: 'timeout',
            label: 'Timeout (ms)',
            type: 'number',
            required: false,
            placeholder: '30000',
          },
        ],
      },
      {
        key: 'crud_operation',
        name: 'CRUD Operation',
        description: 'Perform standard CRUD operations',
        inputSchema: {
          type: 'object',
          properties: {
            operation: { type: 'string', enum: ['create', 'read', 'update', 'delete', 'list'] },
            resource: { type: 'string' },
            id: { type: 'string' },
            data: { type: 'object' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        configFields: [
          {
            key: 'operation',
            label: 'Operation',
            type: 'select',
            required: true,
            options: [
              { label: 'Create (POST)', value: 'create' },
              { label: 'Read (GET)', value: 'read' },
              { label: 'Update (PUT)', value: 'update' },
              { label: 'Delete (DELETE)', value: 'delete' },
              { label: 'List (GET)', value: 'list' },
            ],
          },
          {
            key: 'resource',
            label: 'Resource Name',
            type: 'string',
            required: true,
            placeholder: 'users',
            helpText: 'Resource endpoint (e.g., users, products)',
          },
          {
            key: 'id',
            label: 'Resource ID',
            type: 'string',
            required: false,
            placeholder: 'id from previous step',
          },
        ],
      },
    ],
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
  }),

  async testConnection(credentials: Record<string, string>): Promise<boolean> {
    const baseUrl = credentials.baseUrl || '';
    if (!baseUrl) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(new URL('/', baseUrl).toString(), {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok || response.status === 404; // 404 is OK, means API exists
    } catch {
      return false;
    }
  },

  async handleWebhook(
    _triggerKey: string,
    payload: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<WebhookResult> {
    return {
      items: [{
        body: payload,
        headers,
        method: headers['x-http-method'] ?? 'POST',
        path: headers['x-http-path'] ?? '/',
        query: payload.query ?? {},
        receivedAt: new Date().toISOString(),
      }],
      verified: true,
    };
  },

  async poll(
    _triggerKey: string,
    credentials: Record<string, string>,
    lastPollState: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<PollResult> {
    const baseUrl = credentials.baseUrl || '';
    const endpoint = String(config?.endpoint ?? '');
    const method = String(config?.method ?? 'GET');
    const dataPath = String(config?.dataPath ?? '');
    const lastModifiedField = String(config?.lastModifiedField ?? '');

    if (!baseUrl || !endpoint) {
      return {
        items: [],
        newState: lastPollState,
        hasMore: false,
      };
    }

    try {
      const url = new URL(endpoint, baseUrl);
      const controller = new AbortController();
      const timeoutMs = 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url.toString(), {
        method,
        headers: buildHeaders(credentials),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          items: [],
          newState: lastPollState,
          hasMore: false,
        };
      }

      let data = await response.json();

      // Navigate to data path if specified
      if (dataPath) {
        data = getByPath(data, dataPath);
      }

      const items = Array.isArray(data) ? data : [data];
      const lastTimestamp = String(lastPollState.lastTimestamp ?? '');

      // Filter for new items based on timestamp
      let filteredItems = items;
      if (lastModifiedField && lastTimestamp) {
        filteredItems = items.filter((item: Record<string, unknown>) => {
          const itemTime = String(item[lastModifiedField] ?? '');
          return itemTime > lastTimestamp;
        });
      }

      const newTimestamp = filteredItems.length > 0
        ? String(filteredItems[filteredItems.length - 1]?.[lastModifiedField] ?? new Date().toISOString())
        : lastTimestamp;

      return {
        items: filteredItems,
        newState: { lastTimestamp: newTimestamp },
        hasMore: false,
      };
    } catch (error) {
      return {
        items: [],
        newState: lastPollState,
        hasMore: false,
      };
    }
  },

  async executeAction(
    actionKey: string,
    credentials: Record<string, string>,
    params: Record<string, unknown>
  ): Promise<ActionResult> {
    const baseUrl = credentials.baseUrl || '';
    if (!baseUrl) {
      return {
        success: false,
        data: {},
        error: 'Base URL not configured',
      };
    }

    try {
      if (actionKey === 'make_request') {
        return await executeMakeRequest(baseUrl, credentials, params);
      } else if (actionKey === 'crud_operation') {
        return await executeCrudOperation(baseUrl, credentials, params);
      }

      return {
        success: false,
        data: {},
        error: `Unknown action: ${actionKey}`,
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Build HTTP headers with authentication.
 */
function buildHeaders(credentials: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authMethod = credentials.authMethod || '';
  const authValue = credentials.authValue || '';

  switch (authMethod) {
    case 'api_key': {
      const headerName = credentials.authHeaderName || 'Authorization';
      const prefix = credentials.authPrefix || 'Bearer ';
      headers[headerName] = `${prefix}${authValue}`;
      break;
    }
    case 'basic': {
      const username = credentials.username || '';
      const password = credentials.password || '';
      const encoded = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
      break;
    }
    case 'bearer': {
      headers['Authorization'] = `Bearer ${authValue}`;
      break;
    }
    case 'oauth2': {
      headers['Authorization'] = `Bearer ${credentials.accessToken || ''}`;
      break;
    }
    case 'custom': {
      const customHeader = credentials.customHeader || '';
      const customValue = credentials.customValue || '';
      if (customHeader) {
        headers[customHeader] = customValue;
      }
      break;
    }
  }

  return headers;
}

/**
 * Navigate an object by dot-notation path (e.g., "data.items").
 */
function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Execute a generic make_request action.
 */
async function executeMakeRequest(
  baseUrl: string,
  credentials: Record<string, string>,
  params: Record<string, unknown>
): Promise<ActionResult> {
  const method = String(params.method ?? 'GET');
  const endpoint = String(params.endpoint ?? '');

  if (!endpoint) {
    return {
      success: false,
      data: {},
      error: 'Endpoint is required',
    };
  }

  const url = new URL(endpoint, baseUrl);

  // Add query params
  const queryParams = params.queryParams as Record<string, string> | undefined;
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const headers = buildHeaders(credentials);

  // Add custom headers
  const customHeaders = params.headers as Record<string, string> | undefined;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const timeoutMs = Number(params.timeout ?? 30000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  if (method !== 'GET' && method !== 'HEAD' && params.body) {
    const body = params.body as Record<string, unknown>;
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    clearTimeout(timeoutId);
    const contentType = response.headers.get('content-type') ?? '';
    let responseBody: unknown;

    if (contentType.includes('json')) {
      responseBody = await response.json();
    } else if (contentType.includes('text')) {
      responseBody = await response.text();
    } else {
      responseBody = await response.arrayBuffer();
    }

    return {
      success: response.ok,
      data: {
        statusCode: response.status,
        body: responseBody,
        headers: Object.fromEntries(response.headers.entries()),
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      data: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute a CRUD operation action.
 */
async function executeCrudOperation(
  baseUrl: string,
  credentials: Record<string, string>,
  params: Record<string, unknown>
): Promise<ActionResult> {
  const operation = String(params.operation ?? '');
  const resource = String(params.resource ?? '');
  const id = params.id ? String(params.id) : '';

  if (!resource) {
    return {
      success: false,
      data: {},
      error: 'Resource is required',
    };
  }

  let endpoint = `/api/v1/${resource}`;
  let method = 'GET';
  let body: Record<string, unknown> | null = null;

  switch (operation) {
    case 'create':
      method = 'POST';
      body = params.data as Record<string, unknown>;
      break;
    case 'read':
      method = 'GET';
      if (id) endpoint += `/${id}`;
      break;
    case 'update':
      method = 'PUT';
      if (id) endpoint += `/${id}`;
      body = params.data as Record<string, unknown>;
      break;
    case 'delete':
      method = 'DELETE';
      if (id) endpoint += `/${id}`;
      break;
    case 'list':
      method = 'GET';
      break;
    default:
      return {
        success: false,
        data: {},
        error: `Unknown operation: ${operation}`,
      };
  }

  const url = new URL(endpoint, baseUrl);
  const headers = buildHeaders(credentials);

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const responseBody = await response.json().catch(() => ({}));

    return {
      success: response.ok,
      data: {
        statusCode: response.status,
        body: responseBody,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
