// ─── FlowForge Data Mapper ──────────────────────────────────────────────────
// Resolves data references between steps: {{steps.0.output.email}}
// Handles: references, static values, expressions, templates

import type { DataMapping, StepExecution } from '@/types';
import { getNestedValue, resolveTemplate } from '@/lib/utils';

export interface ExecutionContext {
  trigger: Record<string, unknown>;
  steps: Record<string, StepExecutionData>;
  variables: Record<string, unknown>;
  system: SystemVariables;
}

export interface StepExecutionData {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: string;
}

export interface SystemVariables {
  workflowId: string;
  workflowName: string;
  executionId: string;
  stepIndex: number;
  timestamp: string;
  workspaceId: string;
}

/**
 * Resolve a single DataMapping to its actual value using the execution context.
 */
export function resolveMapping(
  mapping: DataMapping,
  context: ExecutionContext
): unknown {
  switch (mapping.type) {
    case 'static':
      return mapping.value;

    case 'reference': {
      // Build the full context object for dot-notation resolution
      const flatContext = buildFlatContext(context);
      return getNestedValue(flatContext, mapping.value);
    }

    case 'template': {
      const flatContext = buildFlatContext(context);
      return resolveTemplate(mapping.value, flatContext);
    }

    case 'expression': {
      // Safe expression evaluation — no eval(), uses simple operations
      return evaluateExpression(mapping.value, context);
    }

    default:
      return mapping.value;
  }
}

/**
 * Resolve all input mappings for a step, returning the resolved input object.
 */
export function resolveInputMappings(
  mappings: Record<string, DataMapping>,
  context: ExecutionContext
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, mapping] of Object.entries(mappings)) {
    result[key] = resolveMapping(mapping, context);
  }
  return result;
}

/**
 * Build a flat context object for template/reference resolution.
 * Produces: { trigger.field, steps.stepId.output.field, variables.key, system.key }
 */
function buildFlatContext(context: ExecutionContext): Record<string, unknown> {
  const flat: Record<string, unknown> = {
    trigger: context.trigger,
    steps: {} as Record<string, unknown>,
    variables: context.variables,
    system: context.system,
  };

  // Add step data indexed by step ID
  const stepsObj = flat.steps as Record<string, unknown>;
  for (const [stepId, stepData] of Object.entries(context.steps)) {
    stepsObj[stepId] = {
      input: stepData.input,
      output: stepData.output,
      status: stepData.status,
    };
  }

  return flat;
}

/**
 * Evaluate simple expressions without eval().
 * Supports: string concatenation, basic math, ternary-like defaults.
 */
function evaluateExpression(
  expr: string,
  context: ExecutionContext
): unknown {
  const flatContext = buildFlatContext(context);
  const trimmed = expr.trim();

  // Default value expression: {{field}} || 'fallback'
  const defaultMatch = trimmed.match(/^\{\{([^}]+)\}\}\s*\|\|\s*['"](.+)['"]$/);
  if (defaultMatch) {
    const value = getNestedValue(flatContext, defaultMatch[1].trim());
    return (value !== undefined && value !== null && value !== '')
      ? value
      : defaultMatch[2];
  }

  // Simple math: {{field}} + {{field}}
  const mathMatch = trimmed.match(
    /^\{\{([^}]+)\}\}\s*([+\-*/])\s*\{\{([^}]+)\}\}$/
  );
  if (mathMatch) {
    const left = Number(getNestedValue(flatContext, mathMatch[1].trim()));
    const right = Number(getNestedValue(flatContext, mathMatch[3].trim()));
    const op = mathMatch[2];
    if (!isNaN(left) && !isNaN(right)) {
      switch (op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? left / right : 0;
      }
    }
  }

  // Fall back to template resolution
  return resolveTemplate(trimmed, flatContext);
}

/**
 * Validate that all required mappings are resolvable.
 */
export function validateMappings(
  mappings: Record<string, DataMapping>,
  context: ExecutionContext
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, mapping] of Object.entries(mappings)) {
    try {
      const resolved = resolveMapping(mapping, context);
      if (resolved === undefined) {
        errors.push(`Mapping '${key}' resolved to undefined — source may not exist`);
      }
    } catch (err) {
      errors.push(`Mapping '${key}' failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
