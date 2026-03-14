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
