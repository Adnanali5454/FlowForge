// ─── Error Handler Step Executor ────────────────────────────────────────────
// Declarative error handling configuration.
// Returns the error handling config for the executor to use.

import type { ErrorHandlerConfig } from '@/types';

export interface ErrorHandlerResult {
  action: string;
  maxRetries: number;
  retryDelayMs: number;
  retryBackoff: string;
  routeToStepId: string | null;
}

/**
 * Execute an error handler step.
 * This is a declarative step that returns the error handling configuration.
 * The executor uses this to configure error behavior for subsequent steps.
 */
export function executeErrorHandler(config: ErrorHandlerConfig): ErrorHandlerResult {
  return {
    action: config.action,
    maxRetries: config.maxRetries,
    retryDelayMs: config.retryDelayMs,
    retryBackoff: config.retryBackoff,
    routeToStepId: config.routeToStepId,
  };
}
