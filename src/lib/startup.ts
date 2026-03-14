/**
 * Server-side startup — initializes the connector registry.
 * Import this in every API route that executes workflows or uses connectors.
 * The 'initialized' guard prevents redundant re-registration.
 */
import { initializeBuiltInConnectors } from './connectors';

let initialized = false;

export function ensureInitialized(): void {
  if (initialized) return;
  initializeBuiltInConnectors();
  initialized = true;
}

ensureInitialized();
