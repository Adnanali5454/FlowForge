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
 * Utility function: resolves and slices the source array up to maxIterations.
 * NOTE: This does NOT execute loopStepIds. The WorkflowExecutor handles
 * full loop iteration including sub-step execution. Use this for
 * standalone array resolution only.
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
