import { describe, it, expect } from 'vitest';
import { executeFilter } from '@/lib/engine/steps/filter';
import type { FilterConfig } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConfig(
  conditions: FilterConfig['conditions'],
  logic: 'and' | 'or' = 'and'
): FilterConfig {
  return { type: 'filter', conditions, logic };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('executeFilter — equals operator', () => {
  it('returns passed=true when field equals expected value', () => {
    const config = makeConfig([{ field: 'status', operator: 'equals', value: 'active' }]);
    const result = executeFilter(config, { status: 'active' });
    expect(result.passed).toBe(true);
    expect(result.evaluations[0].result).toBe(true);
  });

  it('returns passed=false when field does not equal expected value', () => {
    const config = makeConfig([{ field: 'status', operator: 'equals', value: 'active' }]);
    const result = executeFilter(config, { status: 'inactive' });
    expect(result.passed).toBe(false);
    expect(result.evaluations[0].result).toBe(false);
  });

  it('coerces values to string for comparison', () => {
    const config = makeConfig([{ field: 'count', operator: 'equals', value: '42' }]);
    const result = executeFilter(config, { count: 42 });
    expect(result.passed).toBe(true);
  });
});

describe('executeFilter — not_equals operator', () => {
  it('returns passed=true when values are different', () => {
    const config = makeConfig([{ field: 'role', operator: 'not_equals', value: 'admin' }]);
    const result = executeFilter(config, { role: 'user' });
    expect(result.passed).toBe(true);
  });

  it('returns passed=false when values are the same', () => {
    const config = makeConfig([{ field: 'role', operator: 'not_equals', value: 'admin' }]);
    const result = executeFilter(config, { role: 'admin' });
    expect(result.passed).toBe(false);
  });
});

describe('executeFilter — contains operator', () => {
  it('returns true when string contains expected substring', () => {
    const config = makeConfig([{ field: 'email', operator: 'contains', value: '@example.com' }]);
    const result = executeFilter(config, { email: 'user@example.com' });
    expect(result.passed).toBe(true);
  });

  it('returns false when string does not contain expected substring', () => {
    const config = makeConfig([{ field: 'email', operator: 'contains', value: '@other.com' }]);
    const result = executeFilter(config, { email: 'user@example.com' });
    expect(result.passed).toBe(false);
  });

  it('is case-insensitive', () => {
    const config = makeConfig([{ field: 'text', operator: 'contains', value: 'HELLO' }]);
    const result = executeFilter(config, { text: 'say hello world' });
    expect(result.passed).toBe(true);
  });

  it('returns false for null/undefined field value', () => {
    const config = makeConfig([{ field: 'text', operator: 'contains', value: 'hello' }]);
    const result = executeFilter(config, {});
    expect(result.passed).toBe(false);
  });
});

describe('executeFilter — greater_than operator', () => {
  it('returns true when number exceeds threshold', () => {
    const config = makeConfig([{ field: 'price', operator: 'greater_than', value: 10 }]);
    const result = executeFilter(config, { price: 99 });
    expect(result.passed).toBe(true);
  });

  it('returns false when number is below threshold', () => {
    const config = makeConfig([{ field: 'price', operator: 'greater_than', value: 100 }]);
    const result = executeFilter(config, { price: 50 });
    expect(result.passed).toBe(false);
  });

  it('returns false when number equals threshold (strict greater than)', () => {
    const config = makeConfig([{ field: 'age', operator: 'greater_than', value: 18 }]);
    const result = executeFilter(config, { age: 18 });
    expect(result.passed).toBe(false);
  });
});

describe('executeFilter — is_empty / is_not_empty operators', () => {
  it('is_empty returns true for undefined', () => {
    const config = makeConfig([{ field: 'bio', operator: 'is_empty', value: '' }]);
    const result = executeFilter(config, {});
    expect(result.passed).toBe(true);
  });

  it('is_empty returns true for null', () => {
    const config = makeConfig([{ field: 'bio', operator: 'is_empty', value: '' }]);
    const result = executeFilter(config, { bio: null });
    expect(result.passed).toBe(true);
  });

  it('is_empty returns true for empty string', () => {
    const config = makeConfig([{ field: 'bio', operator: 'is_empty', value: '' }]);
    const result = executeFilter(config, { bio: '' });
    expect(result.passed).toBe(true);
  });

  it('is_empty returns true for empty array', () => {
    const config = makeConfig([{ field: 'tags', operator: 'is_empty', value: '' }]);
    const result = executeFilter(config, { tags: [] });
    expect(result.passed).toBe(true);
  });

  it('is_empty returns false for non-empty string', () => {
    const config = makeConfig([{ field: 'bio', operator: 'is_empty', value: '' }]);
    const result = executeFilter(config, { bio: 'Hello' });
    expect(result.passed).toBe(false);
  });

  it('is_not_empty returns true for a non-empty string', () => {
    const config = makeConfig([{ field: 'name', operator: 'is_not_empty', value: '' }]);
    const result = executeFilter(config, { name: 'Alice' });
    expect(result.passed).toBe(true);
  });

  it('is_not_empty returns false for empty string', () => {
    const config = makeConfig([{ field: 'name', operator: 'is_not_empty', value: '' }]);
    const result = executeFilter(config, { name: '' });
    expect(result.passed).toBe(false);
  });

  it('is_not_empty returns false for undefined', () => {
    const config = makeConfig([{ field: 'name', operator: 'is_not_empty', value: '' }]);
    const result = executeFilter(config, {});
    expect(result.passed).toBe(false);
  });
});

describe('executeFilter — AND logic', () => {
  it('passes when all conditions are true (AND)', () => {
    const config = makeConfig(
      [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'age', operator: 'greater_than', value: 18 },
      ],
      'and'
    );
    const result = executeFilter(config, { status: 'active', age: 25 });
    expect(result.passed).toBe(true);
  });

  it('fails when one condition is false (AND)', () => {
    const config = makeConfig(
      [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'age', operator: 'greater_than', value: 18 },
      ],
      'and'
    );
    const result = executeFilter(config, { status: 'active', age: 15 });
    expect(result.passed).toBe(false);
  });
});

describe('executeFilter — OR logic', () => {
  it('passes when at least one condition is true (OR)', () => {
    const config = makeConfig(
      [
        { field: 'role', operator: 'equals', value: 'admin' },
        { field: 'role', operator: 'equals', value: 'superuser' },
      ],
      'or'
    );
    const result = executeFilter(config, { role: 'admin' });
    expect(result.passed).toBe(true);
  });

  it('fails when all conditions are false (OR)', () => {
    const config = makeConfig(
      [
        { field: 'role', operator: 'equals', value: 'admin' },
        { field: 'role', operator: 'equals', value: 'superuser' },
      ],
      'or'
    );
    const result = executeFilter(config, { role: 'viewer' });
    expect(result.passed).toBe(false);
  });
});

describe('executeFilter — empty conditions array', () => {
  it('passes through with AND logic when no conditions', () => {
    const config = makeConfig([], 'and');
    // every() on empty array returns true
    const result = executeFilter(config, { anything: 'data' });
    expect(result.passed).toBe(true);
    expect(result.evaluations).toHaveLength(0);
  });

  it('does not pass through with OR logic when no conditions (some() returns false)', () => {
    const config = makeConfig([], 'or');
    // some() on empty array returns false
    const result = executeFilter(config, { anything: 'data' });
    expect(result.passed).toBe(false);
    expect(result.evaluations).toHaveLength(0);
  });
});

describe('executeFilter — evaluations tracking', () => {
  it('returns evaluation details for each condition', () => {
    const config = makeConfig([
      { field: 'email', operator: 'contains', value: '@example.com' },
      { field: 'verified', operator: 'equals', value: 'true' },
    ]);
    const result = executeFilter(config, { email: 'user@example.com', verified: true });
    expect(result.evaluations).toHaveLength(2);
    expect(result.evaluations[0].field).toBe('email');
    expect(result.evaluations[0].operator).toBe('contains');
    expect(result.evaluations[0].actualValue).toBe('user@example.com');
  });
});
