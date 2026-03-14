// ─── Connector Registry ─────────────────────────────────────────────────────
// Central export + initialization for all built-in connectors.

export {
  type ConnectorPlugin,
  type PollResult,
  type WebhookResult,
  type ActionResult,
  type DynamicFieldResult,
  registerConnector,
  getConnector,
  getAllConnectors,
  getAllConnectorManifests,
} from './base';

import { registerConnector } from './base';
import { webhookConnector } from './webhook';
import { schedulerConnector } from './scheduler';

/**
 * Register all built-in connectors.
 * Called once at application startup.
 */
export function initializeBuiltInConnectors(): void {
  registerConnector(webhookConnector);
  registerConnector(schedulerConnector);
}

export { webhookConnector } from './webhook';
export { schedulerConnector } from './scheduler';
