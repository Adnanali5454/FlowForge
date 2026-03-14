// ─── FlowForge Database Schema ──────────────────────────────────────────────
// Drizzle ORM + Neon PostgreSQL
// All tables. All relations. All indexes. Production-grade.

import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ──────────────────────────────────────────────────────────────────

export const workflowStatusEnum = pgEnum('workflow_status', [
  'draft', 'active', 'paused', 'error', 'archived',
]);

export const executionStatusEnum = pgEnum('execution_status', [
  'pending', 'running', 'success', 'error', 'waiting', 'cancelled', 'retrying',
]);

export const stepExecutionStatusEnum = pgEnum('step_execution_status', [
  'pending', 'running', 'success', 'error', 'skipped', 'waiting',
]);

export const planTierEnum = pgEnum('plan_tier', [
  'free', 'pro', 'team', 'business', 'enterprise',
]);

export const userRoleEnum = pgEnum('user_role', [
  'owner', 'admin', 'editor', 'viewer',
]);

export const connectorAuthTypeEnum = pgEnum('connector_auth_type', [
  'oauth2', 'api_key', 'basic', 'bearer', 'custom',
]);

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  twoFactorSecret: text('two_factor_secret'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

// ─── Workspaces ─────────────────────────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  plan: planTierEnum('plan').default('free').notNull(),
  settings: jsonb('settings').default({}).notNull(),
  maxTasksPerMonth: integer('max_tasks_per_month').default(500).notNull(),
  usedTasksThisMonth: integer('used_tasks_this_month').default(0).notNull(),
  taskResetDate: timestamp('task_reset_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('workspaces_slug_idx').on(table.slug),
  ownerIdx: index('workspaces_owner_idx').on(table.ownerId),
}));

// ─── Workspace Members ──────────────────────────────────────────────────────

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').default('editor').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  memberIdx: uniqueIndex('workspace_members_unique_idx').on(table.workspaceId, table.userId),
  userIdx: index('workspace_members_user_idx').on(table.userId),
}));

// ─── Workflow Definitions ───────────────────────────────────────────────────

export const workflowDefinitions = pgTable('workflow_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description').default('').notNull(),
  status: workflowStatusEnum('status').default('draft').notNull(),
  version: integer('version').default(1).notNull(),
  trigger: jsonb('trigger').notNull(),             // TriggerConfig
  steps: jsonb('steps').default([]).notNull(),      // StepConfig[]
  variables: jsonb('variables').default({}).notNull(),
  settings: jsonb('settings').default({}).notNull(),
  folderId: uuid('folder_id'),
  tags: jsonb('tags').default([]).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('workflows_workspace_idx').on(table.workspaceId),
  statusIdx: index('workflows_status_idx').on(table.status),
  folderIdx: index('workflows_folder_idx').on(table.folderId),
  createdByIdx: index('workflows_created_by_idx').on(table.createdBy),
}));

// ─── Workflow Versions ──────────────────────────────────────────────────────

export const workflowVersions = pgTable('workflow_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflowDefinitions.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  trigger: jsonb('trigger').notNull(),
  steps: jsonb('steps').notNull(),
  variables: jsonb('variables').default({}).notNull(),
  settings: jsonb('settings').default({}).notNull(),
  publishedBy: uuid('published_by').references(() => users.id),
  changeLog: text('change_log'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workflowVersionIdx: uniqueIndex('workflow_versions_unique_idx').on(table.workflowId, table.version),
}));

// ─── Workflow Executions ────────────────────────────────────────────────────

export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflowDefinitions.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  status: executionStatusEnum('status').default('pending').notNull(),
  triggerData: jsonb('trigger_data').default({}).notNull(),
  outputData: jsonb('output_data'),
  stepsExecuted: integer('steps_executed').default(0).notNull(),
  stepsTotal: integer('steps_total').default(0).notNull(),
  error: text('error'),
  retryOf: uuid('retry_of'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
}, (table) => ({
  workflowIdx: index('executions_workflow_idx').on(table.workflowId),
  workspaceIdx: index('executions_workspace_idx').on(table.workspaceId),
  statusIdx: index('executions_status_idx').on(table.status),
  startedAtIdx: index('executions_started_at_idx').on(table.startedAt),
}));

// ─── Step Executions ────────────────────────────────────────────────────────

export const stepExecutions = pgTable('step_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  stepId: varchar('step_id', { length: 100 }).notNull(),
  stepIndex: integer('step_index').notNull(),
  stepType: varchar('step_type', { length: 50 }).notNull(),
  stepName: varchar('step_name', { length: 500 }).notNull(),
  status: stepExecutionStatusEnum('status').default('pending').notNull(),
  inputData: jsonb('input_data').default({}).notNull(),
  outputData: jsonb('output_data'),
  error: text('error'),
  retryCount: integer('retry_count').default(0).notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
}, (table) => ({
  executionIdx: index('step_executions_execution_idx').on(table.executionId),
  stepIdIdx: index('step_executions_step_id_idx').on(table.stepId),
}));

// ─── Connector Registry ────────────────────────────────────────────────────

export const connectorRegistry = pgTable('connector_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  icon: text('icon').default('').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  authType: connectorAuthTypeEnum('auth_type').notNull(),
  authConfig: jsonb('auth_config').default({}).notNull(),
  triggers: jsonb('triggers').default([]).notNull(),
  actions: jsonb('actions').default([]).notNull(),
  version: varchar('version', { length: 20 }).default('1.0.0').notNull(),
  isBuiltIn: boolean('is_built_in').default(false).notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('connectors_slug_idx').on(table.slug),
  categoryIdx: index('connectors_category_idx').on(table.category),
}));

// ─── App Connections (user OAuth tokens, API keys) ──────────────────────────

export const appConnections = pgTable('app_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  connectorId: uuid('connector_id').notNull().references(() => connectorRegistry.id),
  name: varchar('name', { length: 255 }).notNull(),
  credentials: jsonb('credentials').default({}).notNull(),   // encrypted in application layer
  isValid: boolean('is_valid').default(true).notNull(),
  lastTestedAt: timestamp('last_tested_at'),
  expiresAt: timestamp('expires_at'),                        // for OAuth token expiry
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('connections_workspace_idx').on(table.workspaceId),
  connectorIdx: index('connections_connector_idx').on(table.connectorId),
}));

// ─── Workflow Folders ───────────────────────────────────────────────────────

export const workflowFolders = pgTable('workflow_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('folders_workspace_idx').on(table.workspaceId),
}));

// ─── Workspace Variables ────────────────────────────────────────────────────

export const workspaceVariables = pgTable('workspace_variables', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 255 }).notNull(),
  value: text('value').notNull(),
  type: varchar('type', { length: 20 }).default('string').notNull(),
  isSecret: boolean('is_secret').default(false).notNull(),
  environment: varchar('environment', { length: 20 }).default('all').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueKeyEnv: uniqueIndex('variables_unique_key_env').on(table.workspaceId, table.key, table.environment),
}));

// ─── Workflow Storage (key-value store) ─────────────────────────────────────

export const workflowStorage = pgTable('workflow_storage', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  namespace: varchar('namespace', { length: 255 }).default('default').notNull(),
  key: varchar('key', { length: 500 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueKey: uniqueIndex('storage_unique_key').on(table.workspaceId, table.namespace, table.key),
}));

// ─── Digest Buffer ──────────────────────────────────────────────────────────

export const digestEntries = pgTable('digest_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  digestKey: varchar('digest_key', { length: 255 }).notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  digestKeyIdx: index('digest_key_idx').on(table.workspaceId, table.digestKey),
}));

// ─── Audit Log ──────────────────────────────────────────────────────────────

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: varchar('resource_id', { length: 100 }),
  details: jsonb('details').default({}).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('audit_workspace_idx').on(table.workspaceId),
  actionIdx: index('audit_action_idx').on(table.action),
  createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
}));

// ─── Sessions ───────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('sessions_token_idx').on(table.token),
  userIdx: index('sessions_user_idx').on(table.userId),
  expiresIdx: index('sessions_expires_idx').on(table.expiresAt),
}));

// ─── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  memberships: many(workspaceMembers),
  sessions: many(sessions),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  workflows: many(workflowDefinitions),
  connections: many(appConnections),
  folders: many(workflowFolders),
  variables: many(workspaceVariables),
  storage: many(workflowStorage),
  executions: many(workflowExecutions),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const workflowDefinitionsRelations = relations(workflowDefinitions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [workflowDefinitions.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [workflowDefinitions.createdBy],
    references: [users.id],
  }),
  executions: many(workflowExecutions),
  versions: many(workflowVersions),
}));

export const workflowVersionsRelations = relations(workflowVersions, ({ one }) => ({
  workflow: one(workflowDefinitions, {
    fields: [workflowVersions.workflowId],
    references: [workflowDefinitions.id],
  }),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one, many }) => ({
  workflow: one(workflowDefinitions, {
    fields: [workflowExecutions.workflowId],
    references: [workflowDefinitions.id],
  }),
  workspace: one(workspaces, {
    fields: [workflowExecutions.workspaceId],
    references: [workspaces.id],
  }),
  steps: many(stepExecutions),
}));

export const stepExecutionsRelations = relations(stepExecutions, ({ one }) => ({
  execution: one(workflowExecutions, {
    fields: [stepExecutions.executionId],
    references: [workflowExecutions.id],
  }),
}));

export const appConnectionsRelations = relations(appConnections, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [appConnections.workspaceId],
    references: [workspaces.id],
  }),
  connector: one(connectorRegistry, {
    fields: [appConnections.connectorId],
    references: [connectorRegistry.id],
  }),
}));

// ─── FlowForge Tables ────────────────────────────────────────────────────────

export const flowforgeTables = pgTable('flowforge_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  icon: varchar('icon', { length: 10 }).default('📊').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('ff_tables_workspace_idx').on(table.workspaceId),
}));

export const flowforgeTableColumns = pgTable('flowforge_table_columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: uuid('table_id').notNull().references(() => flowforgeTables.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // text/number/boolean/date/email/url/select/multiselect/checkbox/attachment/ai/formula/autonumber/created_time/created_by
  config: jsonb('config').default({}).notNull(), // { options: string[], formula: string, linkedTableId: string }
  position: integer('position').default(0).notNull(),
  isRequired: boolean('is_required').default(false).notNull(),
  defaultValue: text('default_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tableIdx: index('ff_columns_table_idx').on(table.tableId),
}));

export const flowforgeTableRows = pgTable('flowforge_table_rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: uuid('table_id').notNull().references(() => flowforgeTables.id, { onDelete: 'cascade' }),
  data: jsonb('data').default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tableIdx: index('ff_rows_table_idx').on(table.tableId),
}));

export const flowforgeTableViews = pgTable('flowforge_table_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: uuid('table_id').notNull().references(() => flowforgeTables.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).default('grid').notNull(), // grid/form/gallery/calendar/kanban
  config: jsonb('config').default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tableIdx: index('ff_views_table_idx').on(table.tableId),
}));

// ─── FlowForge Tables Relations ──────────────────────────────────────────────

export const flowforgeTablesRelations = relations(flowforgeTables, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [flowforgeTables.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [flowforgeTables.createdBy],
    references: [users.id],
  }),
  columns: many(flowforgeTableColumns),
  rows: many(flowforgeTableRows),
  views: many(flowforgeTableViews),
}));

export const flowforgeTableColumnsRelations = relations(flowforgeTableColumns, ({ one }) => ({
  table: one(flowforgeTables, {
    fields: [flowforgeTableColumns.tableId],
    references: [flowforgeTables.id],
  }),
}));

export const flowforgeTableRowsRelations = relations(flowforgeTableRows, ({ one }) => ({
  table: one(flowforgeTables, {
    fields: [flowforgeTableRows.tableId],
    references: [flowforgeTables.id],
  }),
  creator: one(users, {
    fields: [flowforgeTableRows.createdBy],
    references: [users.id],
  }),
}));

export const flowforgeTableViewsRelations = relations(flowforgeTableViews, ({ one }) => ({
  table: one(flowforgeTables, {
    fields: [flowforgeTableViews.tableId],
    references: [flowforgeTables.id],
  }),
  creator: one(users, {
    fields: [flowforgeTableViews.createdBy],
    references: [users.id],
  }),
}));

// ─── FlowForge Interfaces (Forms) ────────────────────────────────────────────

export const flowforgeInterfaces = pgTable('flowforge_interfaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  type: varchar('type', { length: 20 }).default('form').notNull(),
  config: jsonb('config').default({}).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  brandingConfig: jsonb('branding_config').default({}).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('ff_interfaces_workspace_idx').on(table.workspaceId),
}));

export const flowforgeInterfaceFields = pgTable('flowforge_interface_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  interfaceId: uuid('interface_id').notNull().references(() => flowforgeInterfaces.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  placeholder: varchar('placeholder', { length: 500 }).default('').notNull(),
  helpText: text('help_text').default('').notNull(),
  isRequired: boolean('is_required').default(false).notNull(),
  config: jsonb('config').default({}).notNull(),
  conditionalLogic: jsonb('conditional_logic').default({}).notNull(),
  position: integer('position').default(0).notNull(),
}, (table) => ({
  interfaceIdx: index('ff_fields_interface_idx').on(table.interfaceId),
}));

export const flowforgeInterfaceSubmissions = pgTable('flowforge_interface_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  interfaceId: uuid('interface_id').notNull().references(() => flowforgeInterfaces.id, { onDelete: 'cascade' }),
  data: jsonb('data').default({}).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  interfaceIdx: index('ff_submissions_interface_idx').on(table.interfaceId),
}));

// ─── FlowForge Chatbots ───────────────────────────────────────────────────────

export const flowforgeChatbots = pgTable('flowforge_chatbots', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  model: varchar('model', { length: 100 }).default('claude-sonnet').notNull(),
  systemPrompt: text('system_prompt').default('').notNull(),
  welcomeMessage: text('welcome_message').default('Hello! How can I help you today?').notNull(),
  suggestedQuestions: jsonb('suggested_questions').default([]).notNull(),
  brandingConfig: jsonb('branding_config').default({}).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('ff_chatbots_workspace_idx').on(table.workspaceId),
}));

export const flowforgeChatbotConversations = pgTable('flowforge_chatbot_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatbotId: uuid('chatbot_id').notNull().references(() => flowforgeChatbots.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  messages: jsonb('messages').default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  chatbotIdx: index('ff_conversations_chatbot_idx').on(table.chatbotId),
  sessionIdx: index('ff_conversations_session_idx').on(table.sessionId),
}));

// ─── FlowForge Agents ────────────────────────────────────────────────────────

export const flowforgeAgents = pgTable('flowforge_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  type: varchar('type', { length: 50 }).default('task').notNull(),
  model: varchar('model', { length: 100 }).default('claude-sonnet').notNull(),
  systemPrompt: text('system_prompt').default('').notNull(),
  tools: jsonb('tools').default([]).notNull(),
  constraints: jsonb('constraints').default({}).notNull(),
  memory: jsonb('memory').default({}).notNull(),
  triggerConfig: jsonb('trigger_config').default({}).notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('ff_agents_workspace_idx').on(table.workspaceId),
}));

export const flowforgeAgentRuns = pgTable('flowforge_agent_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => flowforgeAgents.id, { onDelete: 'cascade' }),
  trigger: text('trigger').default('manual').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  steps: jsonb('steps').default([]).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  agentIdx: index('ff_agent_runs_agent_idx').on(table.agentId),
}));

// ─── FlowForge Transfer ──────────────────────────────────────────────────────

export const flowforgeTransfers = pgTable('flowforge_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  sourceConnectorId: varchar('source_connector_id', { length: 100 }).notNull(),
  sourceConfig: jsonb('source_config').default({}).notNull(),
  destConnectorId: varchar('dest_connector_id', { length: 100 }).notNull(),
  destConfig: jsonb('dest_config').default({}).notNull(),
  fieldMapping: jsonb('field_mapping').default({}).notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  totalRecords: integer('total_records').default(0).notNull(),
  processedRecords: integer('processed_records').default(0).notNull(),
  errorRecords: integer('error_records').default(0).notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('ff_transfers_workspace_idx').on(table.workspaceId),
}));

// ─── FlowForge Canvas ────────────────────────────────────────────────────────

export const flowforgeCanvases = pgTable('flowforge_canvases', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  data: jsonb('data').default({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('ff_canvases_workspace_idx').on(table.workspaceId),
}));
