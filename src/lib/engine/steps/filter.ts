// ─── Filter Step Executor ───────────────────────────────────────────────────
// Evaluates conditions against input data.
// Returns { passed: boolean } — downstream steps only run if passed = true.

import type { FilterConfig, FilterCondition, FilterOperator } from '@/types';
import { getNestedValue } from '@/lib/utils';

export interface FilterResult {
  passed: boolean;
  evaluations: ConditionEvaluation[];
}

export interface ConditionEvaluation {
  field: string;
  operator: FilterOperator;
  expectedValue: string | number | boolean;
  actualValue: unknown;
  result: boolean;
}

/**
 * Execute a filter step against the given input data.
 */
export function executeFilter(
  config: FilterConfig,
  inputData: Record<string, unknown>
): FilterResult {
  const evaluations: ConditionEvaluation[] = config.conditions.map((condition) => {
    const actualValue = getNestedValue(inputData, condition.field);
    const result = evaluateCondition(condition, actualValue);
    return {
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue,
      result,
    };
  });

  const passed = config.logic === 'and'
    ? evaluations.every((e) => e.result)
    : evaluations.some((e) => e.result);

  return { passed, evaluations };
}

/**
 * Evaluate a single filter condition.
 */
function evaluateCondition(
  condition: FilterCondition,
  actualValue: unknown
): boolean {
  const { operator, value: expected } = condition;
  const actual = actualValue;

  switch (operator) {
    case 'equals':
      return String(actual) === String(expected);

    case 'not_equals':
      return String(actual) !== String(expected);

    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(expected).toLowerCase());

    case 'not_contains':
      return !String(actual ?? '').toLowerCase().includes(String(expected).toLowerCase());

    case 'starts_with':
      return String(actual ?? '').toLowerCase().startsWith(String(expected).toLowerCase());

    case 'ends_with':
      return String(actual ?? '').toLowerCase().endsWith(String(expected).toLowerCase());

    case 'greater_than':
      return Number(actual) > Number(expected);

    case 'less_than':
      return Number(actual) < Number(expected);

    case 'greater_equal':
      return Number(actual) >= Number(expected);

    case 'less_equal':
      return Number(actual) <= Number(expected);

    case 'is_empty':
      return actual === undefined || actual === null || actual === '' ||
        (Array.isArray(actual) && actual.length === 0);

    case 'is_not_empty':
      return actual !== undefined && actual !== null && actual !== '' &&
        !(Array.isArray(actual) && actual.length === 0);

    case 'matches_regex': {
      try {
        const regex = new RegExp(String(expected));
        return regex.test(String(actual ?? ''));
      } catch {
        return false;
      }
    }

    default:
      return false;
  }
}
