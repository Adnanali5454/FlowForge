// ─── FlowForge Connector Plugin Interface ──────────────────────────────────
// Every connector (Gmail, Slack, Stripe, etc.) implements this interface.
// Standard contract: manifest + trigger handlers + action handlers.

import type {
  ConnectorManifest,
  ConnectorTriggerDef,
  ConnectorActionDef,
  ConnectorAuthType,
  JsonSchema,
} from '@/types';

/**
 * Base interface for all FlowForge connectors.
 * Implement this to create a new integration.
 */
export interface ConnectorPlugin {
  /** The connector's full manifest (metadata, triggers, actions). */
  manifest: ConnectorManifest;

  /**
   * Test a connection using provided credentials.
   * Returns true if credentials are valid, false otherwise.
   */
  testConnection(credentials: Record<string, string>): Promise<boolean>;

  /**
   * Execute a trigger's polling check.
   * Returns new items since the last poll.
   */
  poll?(
    triggerKey: string,
    credentials: Record<string, string>,
    lastPollState: Record<string, unknown>
  ): Promise<PollResult>;

  /**
   * Process an incoming webhook payload for a trigger.
   */
  handleWebhook?(
    triggerKey: string,
    payload: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<WebhookResult>;

  /**
   * Register a webhook URL with the external service.
   */
  registerWebhook?(
    triggerKey: string,
    webhookUrl: string,
    credentials: Record<string, string>
  ): Promise<{ webhookId: string }>;

  /**
   * Unregister a webhook URL from the external service.
   */
  unregisterWebhook?(
    triggerKey: string,
    webhookId: string,
    credentials: Record<string, string>
  ): Promise<void>;

  /**
   * Execute an action.
   */
  executeAction(
    actionKey: string,
    credentials: Record<string, string>,
    params: Record<string, unknown>
  ): Promise<ActionResult>;

  /**
   * Fetch dynamic field options (e.g., list of Slack channels).
   */
  getDynamicFields?(
    fieldKey: string,
    credentials: Record<string, string>,
    dependencyValues: Record<string, string>
  ): Promise<DynamicFieldResult>;
}

// ─── Result Types ───────────────────────────────────────────────────────────

export interface PollResult {
  items: Record<string, unknown>[];
  newState: Record<string, unknown>;  // Cursor/state for next poll
  hasMore: boolean;
}

export interface WebhookResult {
  items: Record<string, unknown>[];
  verified: boolean;
}

export interface ActionResult {
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
}

export interface DynamicFieldResult {
  options: { label: string; value: string }[];
}

// ─── Connector Registry (in-memory) ────────────────────────────────────────

const connectorRegistry = new Map<string, ConnectorPlugin>();
const manifestRegistry = new Map<string, ConnectorManifest>();

/**
 * Register a connector plugin.
 */
export function registerConnector(plugin: ConnectorPlugin): void {
  connectorRegistry.set(plugin.manifest.slug, plugin);
  manifestRegistry.set(plugin.manifest.slug, plugin.manifest);
}

/**
 * Register connector manifests without full implementations.
 * Used for displaying available connectors in the UI.
 */
export function registerConnectorManifest(manifest: ConnectorManifest): void {
  manifestRegistry.set(manifest.slug, manifest);
}

/**
 * Register multiple connector manifests at once.
 */
export function registerConnectorManifests(manifests: ConnectorManifest[]): void {
  manifests.forEach((manifest) => registerConnectorManifest(manifest));
}

/**
 * Get a registered connector by slug.
 */
export function getConnector(slug: string): ConnectorPlugin | undefined {
  return connectorRegistry.get(slug);
}

/**
 * Get all registered connectors.
 */
export function getAllConnectors(): ConnectorPlugin[] {
  return Array.from(connectorRegistry.values());
}

/**
 * Get all connector manifests (for listing in UI).
 * Includes both fully implemented connectors and manifest-only registrations.
 */
export function getAllConnectorManifests(): ConnectorManifest[] {
  return Array.from(manifestRegistry.values());
}

// ─── Helper: Create a connector manifest ────────────────────────────────────

export function createManifest(
  partial: Omit<ConnectorManifest, 'id'> & { id?: string }
): ConnectorManifest {
  return {
    id: partial.id ?? partial.slug,
    ...partial,
  };
}
