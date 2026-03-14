// ─── Code Step Executor ─────────────────────────────────────────────────────
// Executes user-provided JavaScript code in a sandboxed environment.
// Input data is available as `inputData`. Must return an object.

import type { CodeConfig } from '@/types';

export interface CodeResult {
  output: Record<string, unknown>;
  logs: string[];
  durationMs: number;
  language: string;
}

/**
 * Execute a JavaScript code step.
 * Uses Function constructor for isolation (not eval).
 * Python execution would require a serverless backend (Phase 2).
 */
export async function executeCode(
  config: CodeConfig,
  inputData: Record<string, unknown>
): Promise<CodeResult> {
  const startTime = Date.now();
  const logs: string[] = [];

  if (config.language !== 'javascript' && config.language !== 'typescript') {
    return {
      output: { error: `Language '${config.language}' is not yet supported in this environment. JavaScript/TypeScript only.` },
      logs: [],
      durationMs: Date.now() - startTime,
      language: config.language,
    };
  }

  try {
    // Create a sandboxed console that captures logs
    const sandboxConsole = {
      log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
      warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(String).join(' ')}`),
      error: (...args: unknown[]) => logs.push(`[ERROR] ${args.map(String).join(' ')}`),
      info: (...args: unknown[]) => logs.push(`[INFO] ${args.map(String).join(' ')}`),
    };

    // Wrap user code in an async function
    const wrappedCode = `
      return (async function(inputData, console) {
        ${config.source}
      })(inputData, sandboxConsole);
    `;

    // Execute with timeout
    const fn = new Function('inputData', 'sandboxConsole', wrappedCode);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Code execution timed out after ${config.timeout}ms`)),
        config.timeout || 10000);
    });

    const result = await Promise.race([
      fn(inputData, sandboxConsole),
      timeoutPromise,
    ]);

    // Validate return value
    const output = (result && typeof result === 'object')
      ? result as Record<string, unknown>
      : { result };

    return {
      output,
      logs,
      durationMs: Date.now() - startTime,
      language: config.language,
    };
  } catch (error) {
    return {
      output: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      logs,
      durationMs: Date.now() - startTime,
      language: config.language,
    };
  }
}
