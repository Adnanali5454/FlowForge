// ─── Connector Registry ─────────────────────────────────────────────────────
// Central export + initialization for all built-in connectors.
// 50 priority connectors + dynamic HTTP connector for 6,000+ apps.

export {
  type ConnectorPlugin,
  type PollResult,
  type WebhookResult,
  type ActionResult,
  type DynamicFieldResult,
  registerConnector,
  registerConnectorManifest,
  registerConnectorManifests,
  getConnector,
  getAllConnectors,
  getAllConnectorManifests,
} from './base';

import { registerConnector, registerConnectorManifests, getAllConnectorManifests } from './base';
import { webhookConnector } from './webhook';
import { schedulerConnector } from './scheduler';
import { dynamicHttpConnector } from './dynamic';
import { priorityConnectorManifests } from './manifests';

/**
 * Register all built-in connectors.
 * Called once at application startup.
 */
export function initializeBuiltInConnectors(): void {
  // Core utility connectors (full implementations)
  registerConnector(webhookConnector);
  registerConnector(schedulerConnector);
  registerConnector(dynamicHttpConnector);

  // 50 priority connector manifests
  // Full implementations for each will be added incrementally
  // Users can still integrate with these apps via the dynamic HTTP connector
  registerConnectorManifests(priorityConnectorManifests);
}

/**
 * Get total count of available connectors.
 * Includes 50+ built-in priority connectors + dynamic HTTP for 6,000+ apps.
 */
export function getConnectorCount(): number {
  return getAllConnectorManifests().length;
}

export { webhookConnector } from './webhook';
export { schedulerConnector } from './scheduler';
export { dynamicHttpConnector } from './dynamic';
export { priorityConnectorManifests } from './manifests';
