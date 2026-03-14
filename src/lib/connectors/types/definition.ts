import { z } from 'zod';

export interface ConnectorDefinition {
  metadata: {
    id: string;
    name: string;
    version: string;
    description: string;
    icon: string;
    category: string;
    tags: string[];
    requiresAuth: boolean;
    requiredScopes: string[];
    webhookSupport: "native" | "rest_hooks" | "polling_only";
    rateLimit?: { requests: number; per: "minute" | "hour" | "day" };
    tier: 1 | 2 | 3;
  };
  auth: AuthConfig;
  triggers: Array<PollingTrigger | WebhookTrigger | ScheduledTrigger>;
  actions: Action[];
  resources?: Record<string, ResourceFetcher>;
  middleware?: MiddlewareHooks;
  errorHandling?: ErrorHandlingConfig;
  sampleData?: Record<string, unknown>;
}

export type AuthConfig =
  | OAuth2Config
  | OAuth1Config
  | APIKeyConfig
  | BearerTokenConfig
  | BasicAuthConfig
  | CustomAuthConfig
  | SessionAuthConfig
  | DigestAuthConfig;

export interface OAuth2Config {
  type: "oauth2";
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  grantType?: "authorization_code" | "client_credentials";
  revokeUrl?: string;
  tokenRefreshBeforeExpiry?: number;
}

export interface OAuth1Config {
  type: "oauth1";
  authorizationUrl: string;
  requestTokenUrl: string;
  tokenUrl: string;
  signatureMethod: "HMAC-SHA1" | "RSA-SHA1" | "PLAINTEXT";
}

export interface APIKeyConfig {
  type: "api_key";
  headerName?: string;
  queryParamName?: string;
  prefix?: string;
}

export interface BearerTokenConfig {
  type: "bearer_token";
  headerPrefix?: string;
}

export interface BasicAuthConfig {
  type: "basic_auth";
  usernameField: string;
  passwordField?: string;
}

export interface CustomAuthConfig {
  type: "custom";
  authHeaderBuilder: (credentials: Record<string, string>) => Record<string, string>;
  validateCredentials?: (bundle: Bundle) => Promise<boolean>;
}

export interface SessionAuthConfig {
  type: "session";
  loginUrl: string;
  logoutUrl?: string;
  sessionKey: string;
}

export interface DigestAuthConfig {
  type: "digest_auth";
  realm: string;
  qop?: "auth" | "auth-int";
}

export interface Bundle {
  authData: Record<string, string | undefined>;
  inputData: Record<string, unknown>;
  meta: {
    workflow: { id: string; name: string; step: number };
    account: { id: string; workspaceId: string };
    environment: "development" | "production";
  };
  request: {
    get: (url: string, options?: RequestOptions) => Promise<unknown>;
    post: (url: string, data?: unknown, options?: RequestOptions) => Promise<unknown>;
    put: (url: string, data?: unknown, options?: RequestOptions) => Promise<unknown>;
    patch: (url: string, data?: unknown, options?: RequestOptions) => Promise<unknown>;
    delete: (url: string, options?: RequestOptions) => Promise<unknown>;
  };
  z: typeof z;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  timeout?: number;
  retryCount?: number;
}

export interface PollingTrigger {
  type: "polling";
  id: string;
  name: string;
  description: string;
  pollInterval: number;
  inputFields: InputField[];
  perform: (bundle: Bundle) => Promise<TriggerPayload[]>;
  deduplicationKey?: (item: TriggerPayload) => string;
  canPaginate?: boolean;
  cursorField?: string;
}

export interface WebhookTrigger {
  type: "webhook";
  id: string;
  name: string;
  description: string;
  webhookSubscriptionUrl: string;
  subscriberMethod: "POST" | "DELETE";
  inputFields: InputField[];
  perform: (bundle: Bundle) => Promise<TriggerPayload>;
  verifyWebhookSignature?: (bundle: Bundle, signature: string, body: string) => boolean;
}

export interface ScheduledTrigger {
  type: "scheduled";
  id: string;
  name: string;
  description: string;
  schedule: string;
  perform: (bundle: Bundle) => Promise<TriggerPayload[]>;
}

export interface TriggerPayload {
  id?: string;
  [key: string]: unknown;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  inputFields: InputField[];
  perform: (bundle: Bundle) => Promise<ActionPayload>;
  sampleOutput?: ActionPayload;
}

export interface ActionPayload {
  id?: string;
  success?: boolean;
  [key: string]: unknown;
}

export type InputField =
  | TextField
  | NumberField
  | BooleanField
  | DropdownField
  | DynamicDropdownField
  | TextAreaField
  | DateField
  | FileField;

export interface BaseInputField {
  key: string;
  label: string;
  helpText?: string;
  required?: boolean;
  hidden?: boolean;
  default?: unknown;
  placeholder?: string;
}

export interface TextField extends BaseInputField { type: "string"; minLength?: number; maxLength?: number; }
export interface NumberField extends BaseInputField { type: "number"; min?: number; max?: number; }
export interface BooleanField extends BaseInputField { type: "boolean"; }
export interface DropdownField extends BaseInputField { type: "dropdown"; choices: Array<{ value: string; label: string }>; }
export interface DynamicDropdownField extends BaseInputField { type: "dynamic"; fieldFetcher: (bundle: Bundle) => Promise<Array<{ value: string; label: string }>>; }
export interface TextAreaField extends BaseInputField { type: "text"; minLength?: number; maxLength?: number; }
export interface DateField extends BaseInputField { type: "date"; }
export interface FileField extends BaseInputField { type: "file"; mimeTypes?: string[]; }

export type ResourceFetcher = (bundle: Bundle) => Promise<Array<{ id: string; name: string }>>;

export interface MiddlewareHooks {
  beforeRequest?: (request: { headers: Record<string, string>; body?: unknown }) => void;
  afterResponse?: (response: { status: number; body: unknown }) => void;
  onError?: (error: Error) => void;
}

export interface ErrorHandlingConfig {
  errorClassifier: (error: Error) => "transient" | "permanent";
  retryPolicy?: { maxRetries: number; backoffMultiplier: number; initialDelayMs: number };
  rateLimitHandler?: {
    detectRateLimitError: (error: Error) => boolean;
    extractRetryAfterMs: (error: Error) => number;
  };
}
