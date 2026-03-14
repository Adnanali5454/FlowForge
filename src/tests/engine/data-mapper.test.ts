import { describe, it, expect } from 'vitest';
import { resolveMapping, resolveInputMappings } from '@/lib/engine/data-mapper';
import type { ExecutionContext } from '@/lib/engine/data-mapper';
import type { DataMapping } from '@/types';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    trigger: {
      email: 'user@example.com',
      name: 'Alice',
      amount: 42,
    },
    steps: {
      step_1: {
        input: { query: 'hello' },
        output: { result: 'found', count: 3 },
        status: 'success',
      },
      step_2: {
        input: {},
        output: { nested: { deep: { value: 'buried' } } },
        status: 'success',
      },
    },
    variables: { myVar: 'custom-value' },
    system: {
      workflowId: 'wf_test',
      workflowName: 'Test Workflow',
      executionId: 'exec_test',
      stepIndex: 0,
      timestamp: '2024-01-01T00:00:00.000Z',
      workspaceId: 'ws_test',
    },
    ...overrides,
  };
}

function staticMapping(value: string): DataMapping {
  return { type: 'static', value, sourceStepId: null, sourceField: null };
}

function referenceMapping(path: string): DataMapping {
  return { type: 'reference', value: path, sourceStepId: null, sourceField: null };
}

function templateMapping(template: string): DataMapping {
  return { type: 'template', value: template, sourceStepId: null, sourceField: null };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('resolveMapping', () => {
  describe('static type', () => {
    it('returns the literal value as-is', () => {
      const ctx = makeContext();
      const result = resolveMapping(staticMapping('hello world'), ctx);
      expect(result).toBe('hello world');
    });

    it('returns an empty string static value', () => {
      const ctx = makeContext();
      const result = resolveMapping(staticMapping(''), ctx);
      expect(result).toBe('');
    });

    it('returns numeric strings without coercion', () => {
      const ctx = makeContext();
      const result = resolveMapping(staticMapping('123'), ctx);
      expect(result).toBe('123');
    });
  });

  describe('reference type — trigger fields', () => {
    it('resolves trigger.email', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('trigger.email'), ctx);
      expect(result).toBe('user@example.com');
    });

    it('resolves trigger.name', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('trigger.name'), ctx);
      expect(result).toBe('Alice');
    });

    it('resolves trigger numeric field', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('trigger.amount'), ctx);
      expect(result).toBe(42);
    });
  });

  describe('reference type — step outputs', () => {
    it('resolves steps.step_1.output.result', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('steps.step_1.output.result'), ctx);
      expect(result).toBe('found');
    });

    it('resolves steps.step_1.output.count (numeric)', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('steps.step_1.output.count'), ctx);
      expect(result).toBe(3);
    });

    it('resolves deeply nested step output', () => {
      const ctx = makeContext();
      const result = resolveMapping(
        referenceMapping('steps.step_2.output.nested.deep.value'),
        ctx
      );
      expect(result).toBe('buried');
    });

    it('resolves step status', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('steps.step_1.status'), ctx);
      expect(result).toBe('success');
    });
  });

  describe('reference type — missing paths', () => {
    it('returns undefined for a missing trigger field', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('trigger.nonexistent'), ctx);
      expect(result).toBeUndefined();
    });

    it('returns undefined for a missing step', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('steps.step_99.output.foo'), ctx);
      expect(result).toBeUndefined();
    });

    it('returns undefined for a partially valid path', () => {
      const ctx = makeContext();
      const result = resolveMapping(referenceMapping('steps.step_1.output.missing_key'), ctx);
      expect(result).toBeUndefined();
    });
  });

  describe('template type — {{ }} syntax', () => {
    it('resolves {{ trigger.email }} template', () => {
      const ctx = makeContext();
      const result = resolveMapping(
        templateMapping('Hello, {{ trigger.email }}!'),
        ctx
      );
      expect(result).toBe('Hello, user@example.com!');
    });

    it('resolves {{ step_1.output }} style shorthand (without "steps." prefix)', () => {
      // Note: template resolves against flatContext which has "steps" at top-level
      const ctx = makeContext();
      const result = resolveMapping(
        templateMapping('Result: {{ steps.step_1.output.result }}'),
        ctx
      );
      expect(result).toBe('Result: found');
    });

    it('replaces missing template references with empty string', () => {
      const ctx = makeContext();
      const result = resolveMapping(
        templateMapping('Value: {{ trigger.missing }}'),
        ctx
      );
      expect(result).toBe('Value: ');
    });

    it('resolves multiple placeholders in one template', () => {
      const ctx = makeContext();
      const result = resolveMapping(
        templateMapping('{{ trigger.name }} — {{ trigger.email }}'),
        ctx
      );
      expect(result).toBe('Alice — user@example.com');
    });
  });
});

describe('resolveInputMappings', () => {
  it('resolves multiple field mappings at once', () => {
    const ctx = makeContext();
    const mappings: Record<string, DataMapping> = {
      toEmail: referenceMapping('trigger.email'),
      label: staticMapping('Fixed Label'),
      stepResult: referenceMapping('steps.step_1.output.result'),
    };

    const result = resolveInputMappings(mappings, ctx);

    expect(result.toEmail).toBe('user@example.com');
    expect(result.label).toBe('Fixed Label');
    expect(result.stepResult).toBe('found');
  });

  it('returns empty object for empty mappings', () => {
    const ctx = makeContext();
    const result = resolveInputMappings({}, ctx);
    expect(result).toEqual({});
  });

  it('includes undefined for unresolvable references', () => {
    const ctx = makeContext();
    const mappings: Record<string, DataMapping> = {
      missing: referenceMapping('trigger.nonexistent'),
    };
    const result = resolveInputMappings(mappings, ctx);
    expect(result.missing).toBeUndefined();
  });
});
