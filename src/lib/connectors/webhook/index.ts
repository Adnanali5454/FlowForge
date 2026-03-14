// ─── Webhook Connector ──────────────────────────────────────────────────────
// Built-in connector for catch/send webhooks — no external auth required.

import type { ConnectorPlugin, ActionResult, WebhookResult } from '../base';
import { createManifest } from '../base';

export const webhookConnector: ConnectorPlugin = {
  manifest: createManifest({
    slug: 'webhook',
    name: 'Webhooks by FlowForge',
    description: 'Send and receive webhooks. Accept incoming data or POST data to any URL.',
    icon: '/icons/connectors/webhook.svg',
    category: 'utility',
    authType: 'custom',
    authConfig: { type: 'custom' as const, usernameField: '', passwordField: '' },
    triggers: [
      {
        key: 'catch_hook',
        name: 'Catch Hook',
        description: 'Wait for a POST/PUT/GET request to a unique FlowForge webhook URL',
        type: 'webhook',
        outputSchema: {
          type: 'object',
          properties: {
            body: { type: 'object', description: 'Request body' },
            headers: { type: 'object', description: 'Request headers' },
            queryParams: { type: 'object', description: 'URL query parameters' },
            method: { type: 'string', description: 'HTTP method' },
          },
        },
        configFields: [],
      },
      {
        key: 'catch_raw_hook',
        name: 'Catch Raw Hook',
        description: 'Receive raw request data including headers and body',
        type: 'webhook',
        outputSchema: {
          type: 'object',
          properties: {
            rawBody: { type: 'string', description: 'Raw request body' },
            headers: { type: 'object', description: 'All request headers' },
            method: { type: 'string', description: 'HTTP method' },
            contentType: { type: 'string', description: 'Content-Type header' },
          },
        },
        configFields: [],
      },
    ],
    actions: [
      {
        key: 'send_post',
        name: 'POST',
        description: 'Send a POST request with JSON or form data',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Destination URL' },
            data: { type: 'object', description: 'Request body data' },
            headers: { type: 'object', description: 'Custom headers' },
          },
          required: ['url'],
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
          { key: 'url', label: 'URL', type: 'string', required: true, placeholder: 'https://...' },
          { key: 'bodyType', label: 'Payload Type', type: 'select', required: true,
            options: [
              { label: 'JSON', value: 'json' },
              { label: 'Form', value: 'form' },
              { label: 'Raw', value: 'raw' },
            ]
          },
        ],
      },
      {
        key: 'send_get',
        name: 'GET',
        description: 'Send a GET request to retrieve data',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Request URL' },
            headers: { type: 'object', description: 'Custom headers' },
          },
          required: ['url'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            body: { type: 'object' },
          },
        },
        configFields: [
          { key: 'url', label: 'URL', type: 'string', required: true, placeholder: 'https://...' },
        ],
      },
    ],
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
  }),

  async testConnection(): Promise<boolean> {
    // Webhooks don't need authentication
    return true;
  },

  async handleWebhook(
    triggerKey: string,
    payload: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<WebhookResult> {
    return {
      items: [{
        body: payload,
        headers,
        method: headers['x-http-method'] ?? 'POST',
        queryParams: {},
        receivedAt: new Date().toISOString(),
      }],
      verified: true,
    };
  },

  async executeAction(
    actionKey: string,
    _credentials: Record<string, string>,
    params: Record<string, unknown>
  ): Promise<ActionResult> {
    const url = String(params.url ?? '');
    if (!url) {
      return { success: false, data: {}, error: 'URL is required' };
    }

    try {
      const method = actionKey === 'send_get' ? 'GET' : 'POST';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(params.headers as Record<string, string> ?? {}),
      };

      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      if (method !== 'GET' && params.data) {
        fetchOptions.body = JSON.stringify(params.data);
      }

      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get('content-type') ?? '';
      const body = contentType.includes('json')
        ? await response.json()
        : await response.text();

      return {
        success: response.ok,
        data: {
          statusCode: response.status,
          body,
          headers: Object.fromEntries(response.headers.entries()),
        },
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
