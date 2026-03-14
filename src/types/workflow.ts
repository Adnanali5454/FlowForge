// ─── FlowForge Core Type System ─────────────────────────────────────────────
// Every type in the platform flows from these definitions.
// Zero ambiguity. Zero drift.

// ─── Enums ──────────────────────────────────────────────────────────────────

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

export type StepType =
  | 'trigger'
  | 'action'
  | 'filter'
  | 'path'
  | 'delay'
  | 'loop'
  | 'formatter'
  | 'code'
  | 'http'
  | 'ai'
  | 'human-in-the-loop'
  | 'sub-workflow'
  | 'digest'
  | 'storage'
  | 'error-handler';

export type TriggerType =
  | 'webhook'
  | 'polling'
  | 'schedule'
  | 'manual'
  | 'app-event'
  | 'sub-workflow';

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'waiting'    // HITL approval pending
  | 'cancelled'
  | 'retrying';

export type StepExecutionStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'skipped'    // Filter returned false
  | 'waiting';   // HITL

export type ConnectorAuthType =
  | 'oauth2'
  | 'api_key'
  | 'basic'
  | 'bearer'
  | 'custom';

export type PlanTier = 'free' | 'pro' | 'team' | 'business' | 'enterprise';

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

// ─── Core Data Structures ───────────────────────────────────────────────────

export interface WorkflowDefinition {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  version: number;
  trigger: TriggerConfig;
  steps: StepConfig[];
  variables: Record<string, WorkflowVariable>;
  settings: WorkflowSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  folderId: string | null;
  tags: string[];
}

export interface TriggerConfig {
  id: string;
  type: TriggerType;
  connectorId: string | null;   // null for manual/schedule/webhook
  eventKey: string;             // e.g., 'new_email', 'new_row', 'cron'
  config: Record<string, unknown>;
  outputSchema: JsonSchema;
  position: NodePosition;
}

export interface StepConfig {
  id: string;
  type: StepType;
  name: string;
  description: string;
  connectorId: string | null;
  actionKey: string;
  config: StepTypeConfig;
  inputMapping: Record<string, DataMapping>;
  outputSchema: JsonSchema;
  errorHandling: StepErrorConfig;
  position: NodePosition;
  conditions: StepCondition[];
  nextStepIds: string[];        // DAG edges
}

export interface NodePosition {
  x: number;
  y: number;
}

// ─── Step Type Configs ──────────────────────────────────────────────────────

export type StepTypeConfig =
  | FilterConfig
  | PathConfig
  | DelayConfig
  | LoopConfig
  | FormatterConfig
  | CodeConfig
  | HttpConfig
  | AiConfig
  | HitlConfig
  | SubWorkflowConfig
  | DigestConfig
  | StorageConfig
  | ErrorHandlerConfig
  | ActionConfig;

export interface FilterConfig {
  type: 'filter';
  conditions: FilterCondition[];
  logic: 'and' | 'or';
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

export type FilterOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than'
  | 'greater_equal' | 'less_equal'
  | 'is_empty' | 'is_not_empty'
  | 'matches_regex';

export interface PathConfig {
  type: 'path';
  branches: PathBranch[];
  fallbackStepIds: string[];
}

export interface PathBranch {
  id: string;
  name: string;
  conditions: FilterCondition[];
  logic: 'and' | 'or';
  nextStepIds: string[];
}

export interface DelayConfig {
  type: 'delay';
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
  untilTime: string | null;     // ISO datetime — delay until specific time
}

export interface LoopConfig {
  type: 'loop';
  sourceField: string;          // Field containing array to iterate
  maxIterations: number;        // Safety cap
  parallel: boolean;
  loopStepIds: string[];        // Steps to run per iteration
}

export interface FormatterConfig {
  type: 'formatter';
  operation: FormatterOperation;
  inputField: string;
  options: Record<string, unknown>;
}

export type FormatterOperation =
  | 'text_split' | 'text_replace' | 'text_extract' | 'text_case'
  | 'text_trim' | 'text_encode' | 'text_truncate' | 'text_default'
  | 'number_format' | 'number_math' | 'number_random' | 'number_round'
  | 'number_currency'
  | 'date_format' | 'date_add' | 'date_compare' | 'date_timezone'
  | 'date_to_timestamp' | 'timestamp_to_date'
  | 'lookup_table'
  | 'line_items_create' | 'line_items_convert' | 'csv_parse';

export interface CodeConfig {
  type: 'code';
  language: 'javascript' | 'python' | 'typescript';
  source: string;
  timeout: number;              // milliseconds
}

export interface HttpConfig {
  type: 'http';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body: string | Record<string, unknown> | null;
  bodyType: 'json' | 'form' | 'raw' | 'none';
  auth: HttpAuthConfig | null;
  timeout: number;
  followRedirects: boolean;
}

export interface HttpAuthConfig {
  type: 'basic' | 'bearer' | 'api_key';
  credentials: Record<string, string>;
}

export interface AiConfig {
  type: 'ai';
  model: 'claude-sonnet-4-5-20250514' | 'claude-opus-4-5-20250414' | 'gpt-4o' | 'gemini-pro';
  prompt: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  outputFormat: 'text' | 'json' | 'structured';
  outputSchema: JsonSchema | null;
  knowledgeSourceIds: string[];
}

export interface HitlConfig {
  type: 'human-in-the-loop';
  assigneeEmail: string;
  instructions: string;
  deadline: number;             // hours
  deadlineAction: 'approve' | 'reject' | 'escalate';
  escalateTo: string | null;   // email
  fields: HitlField[];
}

export interface HitlField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'textarea';
  options: string[];
  required: boolean;
}

export interface SubWorkflowConfig {
  type: 'sub-workflow';
  targetWorkflowId: string;
  inputMapping: Record<string, DataMapping>;
  waitForCompletion: boolean;
}

export interface DigestConfig {
  type: 'digest';
  action: 'append' | 'release';
  digestKey: string;
  releaseSchedule: string | null;  // cron expression for auto-release
  releaseThreshold: number | null; // count-based release
  template: string;
}

export interface StorageConfig {
  type: 'storage';
  action: 'set' | 'get' | 'increment' | 'decrement' | 'delete' | 'list';
  key: string;
  value: string | null;
  namespace: string;
}

export interface ErrorHandlerConfig {
  type: 'error-handler';
  action: 'retry' | 'skip' | 'halt' | 'route';
  maxRetries: number;
  retryDelayMs: number;
  retryBackoff: 'fixed' | 'exponential';
  routeToStepId: string | null;
}

export interface ActionConfig {
  type: 'action';
  connectorId: string;
  actionKey: string;
  params: Record<string, unknown>;
}

// ─── Error Handling ─────────────────────────────────────────────────────────

export interface StepErrorConfig {
  onError: 'continue' | 'halt' | 'retry' | 'route';
  maxRetries: number;
  retryDelayMs: number;
  retryBackoff: 'fixed' | 'exponential';
  routeToStepId: string | null;
  notifyOnError: boolean;
}

export interface StepCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

// ─── Data Mapping ───────────────────────────────────────────────────────────

export interface DataMapping {
  type: 'reference' | 'static' | 'expression' | 'template';
  value: string;                // e.g., '{{steps.1.output.email}}' or 'hardcoded value'
  sourceStepId: string | null;
  sourceField: string | null;
}

// ─── Workflow Variables ─────────────────────────────────────────────────────

export interface WorkflowVariable {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  value: string;
  isSecret: boolean;
  environment: 'all' | 'development' | 'staging' | 'production';
}

// ─── Workflow Settings ──────────────────────────────────────────────────────

export interface WorkflowSettings {
  errorNotificationEmail: string | null;
  autoReplay: 'always' | 'never' | 'on_transient';
  errorRatioThreshold: number;  // 0-100, auto-pause if exceeded
  maxConcurrentRuns: number;
  timeout: number;              // max execution time in ms
  retentionDays: number;        // execution log retention
  floodProtection: {
    enabled: boolean;
    maxTasksPerWindow: number;
    windowMinutes: number;
  };
}

// ─── Execution ──────────────────────────────────────────────────────────────

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workspaceId: string;
  status: ExecutionStatus;
  triggerData: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  stepsExecuted: number;
  stepsTotal: number;
  error: string | null;
  retryOf: string | null;       // ID of original execution if this is a retry
}

export interface StepExecution {
  id: string;
  executionId: string;
  stepId: string;
  stepIndex: number;
  stepType: StepType;
  stepName: string;
  status: StepExecutionStatus;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown> | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  retryCount: number;
}

// ─── JSON Schema (subset) ───────────────────────────────────────────────────

export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
  enum?: (string | number)[];
  default?: unknown;
}

// ─── Connector Types ────────────────────────────────────────────────────────

export interface ConnectorManifest {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: ConnectorCategory;
  authType: ConnectorAuthType;
  authConfig: OAuthConfig | ApiKeyConfig | BasicAuthConfig | CustomAuthConfig;
  triggers: ConnectorTriggerDef[];
  actions: ConnectorActionDef[];
  version: string;
  isBuiltIn: boolean;
  isPremium: boolean;
}

export type ConnectorCategory =
  | 'communication'
  | 'crm'
  | 'productivity'
  | 'developer'
  | 'marketing'
  | 'finance'
  | 'ecommerce'
  | 'social'
  | 'analytics'
  | 'storage'
  | 'ai'
  | 'utility'
  | 'email'
  | 'payments';

export interface ConnectorTriggerDef {
  key: string;
  name: string;
  description: string;
  type: 'webhook' | 'polling';
  outputSchema?: JsonSchema;
  configFields?: ConnectorField[];
}

export interface ConnectorActionDef {
  key: string;
  name: string;
  description: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  configFields?: ConnectorField[];
}

export interface ConnectorField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'password';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  dependsOn?: string;
  isDynamic?: boolean;
  dynamicKey?: string;
}

export interface OAuthConfig {
  type?: 'oauth2';
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId?: string;
  clientSecret?: string;
}

export interface ApiKeyConfig {
  type?: 'api_key';
  headerName?: string;
  prefix?: string;              // e.g., 'Bearer ', 'Token '
  location?: 'header' | 'query';
  apiKeyField?: string;
  apiKeyLabel?: string;
  fields?: Array<{ key: string; label: string; type: string; required?: boolean }>;
}

export interface BasicAuthConfig {
  type: 'basic';
  usernameField: string;
  passwordField: string;
}

export interface CustomAuthConfig {
  type: 'custom';
  usernameField: string;
  passwordField: string;
}

// ─── Connection (user-specific app auth) ────────────────────────────────────

export interface AppConnection {
  id: string;
  workspaceId: string;
  connectorId: string;
  name: string;
  credentials: Record<string, string>;  // encrypted at rest
  isValid: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  createdBy: string;
}

// ─── Workspace & User ───────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: PlanTier;
  settings: WorkspaceSettings;
  createdAt: string;
}

export interface WorkspaceSettings {
  defaultErrorNotification: string;
  autoReplay: 'always' | 'never' | 'on_transient';
  allowedConnectors: string[] | null;  // null = all allowed
  publishingRestriction: 'all' | 'admins_only';
  maxTasksPerMonth: number;
  usedTasksThisMonth: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: UserRole;
  joinedAt: string;
}
