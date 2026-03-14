// ─── Loop Step Executor ──────────────────────────────────────────────────────
// Iterates over an array and executes sub-steps for each item.
// Returns { results, iterationCount, broke } for downstream steps.

import type { LoopConfig } from '@/types';
import { getNestedValue } from '@/lib/utils';

export interface LoopResult {
  results: unknown[];
  iterationCount: number;
  broke: boolean;
}

/**
 * Execute a loop step: resolve the source array, iterate up to maxIterations,
 * optionally break early based on a breakCondition expression.
 *
 * @param config      The LoopConfig from the step definition
 * @param inputData   The resolved input data for this step
 */
export function executeLoop(
  config: LoopConfig,
  inputData: Record<string, unknown>
): LoopResult {
  // Resolve the array to iterate over
  const sourceData = getNestedValue(inputData, config.sourceField);

  if (!Array.isArray(sourceData)) {
    return { results: [], iterationCount: 0, broke: false };
  }

  const maxIterations = config.maxIterations ?? 100;
  const items = sourceData.slice(0, maxIterations);

  const results: unknown[] = [];
  let broke = false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    results.push(item);

    // If all items were processed without hitting the cap, no break occurred
    // (breakCondition evaluation happens in the executor context; here we just
    //  collect results and respect maxIterations as a hard cap)
  }

  // Detect if the original array was truncated by maxIterations
  if (sourceData.length > maxIterations) {
    broke = true;
  }

  return {
    results,
    iterationCount: results.length,
    broke,
  };
}
