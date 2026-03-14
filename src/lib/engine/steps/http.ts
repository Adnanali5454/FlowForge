// ─── HTTP Step Executor ─────────────────────────────────────────────────────
// Makes HTTP requests (GET, POST, PUT, PATCH, DELETE) with configurable
// auth, headers, body, timeout, and redirect behavior.

import type { HttpConfig } from '@/types';

export interface HttpResult {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
  redirected: boolean;
  url: string;
}

/**
 * Execute an HTTP request step.
 */
export async function executeHttp(
  config: HttpConfig,
  inputData: Record<string, unknown>
): Promise<HttpResult> {
  const startTime = Date.now();

  // Build headers
  const headers: Record<string, string> = {
    ...config.headers,
  };

  // Apply auth
  if (config.auth) {
    switch (config.auth.type) {
      case 'basic': {
        const username = config.auth.credentials.username ?? '';
        const password = config.auth.credentials.password ?? '';
        headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        break;
      }
      case 'bearer':
        headers['Authorization'] = `Bearer ${config.auth.credentials.token ?? ''}`;
        break;
      case 'api_key': {
        const headerName = config.auth.credentials.headerName ?? 'X-API-Key';
        headers[headerName] = config.auth.credentials.key ?? '';
        break;
      }
    }
  }

  // Build body
  let body: string | undefined;
  if (config.method !== 'GET' && config.body !== null) {
    switch (config.bodyType) {
      case 'json':
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
        body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
        break;
      case 'form':
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/x-www-form-urlencoded';
        if (typeof config.body === 'object' && config.body !== null) {
          body = new URLSearchParams(config.body as Record<string, string>).toString();
        } else {
          body = String(config.body);
        }
        break;
      case 'raw':
        body = String(config.body);
        break;
      case 'none':
      default:
        body = undefined;
    }
  }

  // Execute request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers,
      body,
      signal: controller.signal,
      redirect: config.followRedirects ? 'follow' : 'manual',
    });

    clearTimeout(timeoutId);

    // Parse response body
    let responseBody: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    // Convert response headers to plain object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
      durationMs: Date.now() - startTime,
      redirected: response.redirected,
      url: response.url,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        statusCode: 408,
        headers: {},
        body: { error: `Request timed out after ${config.timeout || 30000}ms` },
        durationMs: Date.now() - startTime,
        redirected: false,
        url: config.url,
      };
    }

    return {
      statusCode: 0,
      headers: {},
      body: { error: error instanceof Error ? error.message : 'Unknown error' },
      durationMs: Date.now() - startTime,
      redirected: false,
      url: config.url,
    };
  }
}
