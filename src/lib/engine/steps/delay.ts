// ─── Delay Step Executor ────────────────────────────────────────────────────
// Pauses workflow execution for a configured duration.
// Supports: fixed duration OR "until specific time."

import type { DelayConfig } from '@/types';

export interface DelayResult {
  delayedMs: number;
  resumeAt: string;
  type: 'duration' | 'until_time';
}

/**
 * Calculate delay duration and return metadata.
 * Actual delay is handled by the executor (sleep or scheduled resume).
 */
export function calculateDelay(config: DelayConfig): DelayResult {
  // "Until specific time" mode
  if (config.untilTime) {
    const target = new Date(config.untilTime);
    const now = new Date();
    const delayedMs = Math.max(0, target.getTime() - now.getTime());
    return {
      delayedMs,
      resumeAt: target.toISOString(),
      type: 'until_time',
    };
  }

  // Fixed duration mode
  const multipliers: Record<string, number> = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };

  const multiplier = multipliers[config.unit] ?? 1000;
  const delayedMs = config.duration * multiplier;
  const resumeAt = new Date(Date.now() + delayedMs).toISOString();

  return {
    delayedMs,
    resumeAt,
    type: 'duration',
  };
}

/**
 * Execute the delay (for short delays — under 30 seconds).
 * Longer delays should be handled by the scheduler, not in-process.
 */
export async function executeDelay(config: DelayConfig): Promise<DelayResult> {
  const result = calculateDelay(config);

  // Only inline-sleep for short delays (< 30s)
  // Longer delays should be persisted and resumed by the scheduler
  const MAX_INLINE_DELAY_MS = 30_000;

  if (result.delayedMs <= MAX_INLINE_DELAY_MS && result.delayedMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, result.delayedMs));
  }

  return result;
}
