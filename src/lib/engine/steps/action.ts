// ─── Action Step Executor ───────────────────────────────────────────────────
// Execute connector actions in workflows.
// Looks up connector, validates credentials, and calls executeAction.

import type { ActionConfig } from '@/types';
import { getConnector } from '@/lib/connectors/base';

export interface ActionExecutionParams {
  connectorId: string;
  actionKey: string;
  credentials: Record<string, string>;
  params: Record<string, unknown>;
}

export interface ActionExecutionResult {
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
}

/**
 * Execute an action step by invoking the appropriate connector.
 */
export async function executeAction(
  config: ActionConfig,
  credentials: Record<string, string>,
  params: Record<string, unknown>
): Promise<ActionExecutionResult> {
  const { connectorId, actionKey } = config;

  if (!connectorId) {
    return {
      success: false,
      data: {},
      error: 'No connector ID specified in action config',
    };
  }

  if (!actionKey) {
    return {
      success: false,
      data: {},
      error: 'No action key specified in action config',
    };
  }

  // Look up the connector
  const connector = getConnector(connectorId);

  if (!connector) {
    return {
      success: false,
      data: {},
      error: `Connector not found: ${connectorId}`,
    };
  }

  try {
    // Execute the action via the connector
    const result = await connector.executeAction(actionKey, credentials, params);

    return {
      success: result.success,
      data: result.data ?? {},
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      data: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
