import { describe, it, expect } from 'vitest';
import { executeFormatter } from '@/lib/engine/steps/formatter';
import type { FormatterConfig } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConfig(
  operation: FormatterConfig['operation'],
  inputField: string,
  options: Record<string, unknown> = {}
): FormatterConfig {
  return { type: 'formatter', operation, inputField, options };
}

// ─── text_case (uppercase / lowercase) ───────────────────────────────────────

describe('executeFormatter — text_case: uppercase', () => {
  it('converts text to uppercase', () => {
    const config = makeConfig('text_case', 'value', { caseType: 'upper' });
    const result = executeFormatter(config, { value: 'hello world' });
    expect(result.output).toBe('HELLO WORLD');
  });

  it('handles already uppercase string', () => {
    const config = makeConfig('text_case', 'value', { caseType: 'upper' });
    const result = executeFormatter(config, { value: 'HELLO' });
    expect(result.output).toBe('HELLO');
  });
});

describe('executeFormatter — text_case: lowercase', () => {
  it('converts text to lowercase', () => {
    const config = makeConfig('text_case', 'value', { caseType: 'lower' });
    const result = executeFormatter(config, { value: 'HELLO WORLD' });
    expect(result.output).toBe('hello world');
  });

  it('is the default caseType when none specified', () => {
    const config = makeConfig('text_case', 'value', {});
    const result = executeFormatter(config, { value: 'HELLO' });
    expect(result.output).toBe('hello');
  });
});

describe('executeFormatter — text_case: title', () => {
  it('converts to title case', () => {
    const config = makeConfig('text_case', 'value', { caseType: 'title' });
    const result = executeFormatter(config, { value: 'hello world foo' });
    expect(result.output).toBe('Hello World Foo');
  });
});

describe('executeFormatter — text_case: capitalize', () => {
  it('capitalizes only the first character', () => {
    const config = makeConfig('text_case', 'value', { caseType: 'capitalize' });
    const result = executeFormatter(config, { value: 'hello world' });
    expect(result.output).toBe('Hello world');
  });
});

// ─── text_trim ────────────────────────────────────────────────────────────────

describe('executeFormatter — text_trim', () => {
  it('trims leading and trailing whitespace', () => {
    const config = makeConfig('text_trim', 'value');
    const result = executeFormatter(config, { value: '  hello world  ' });
    expect(result.output).toBe('hello world');
  });

  it('leaves non-whitespace content unchanged', () => {
    const config = makeConfig('text_trim', 'value');
    const result = executeFormatter(config, { value: 'no spaces' });
    expect(result.output).toBe('no spaces');
  });

  it('returns empty string for all-whitespace input', () => {
    const config = makeConfig('text_trim', 'value');
    const result = executeFormatter(config, { value: '   ' });
    expect(result.output).toBe('');
  });
});

// ─── text_replace ─────────────────────────────────────────────────────────────

describe('executeFormatter — text_replace', () => {
  it('replaces all occurrences by default', () => {
    const config = makeConfig('text_replace', 'value', {
      search: 'foo',
      replacement: 'bar',
    });
    const result = executeFormatter(config, { value: 'foo and foo again' });
    expect(result.output).toBe('bar and bar again');
  });

  it('replaces with empty string when replacement not specified', () => {
    const config = makeConfig('text_replace', 'value', {
      search: 'remove',
      replacement: '',
    });
    const result = executeFormatter(config, { value: 'please remove this word' });
    expect(result.output).toBe('please  this word');
  });

  it('returns original string when search not found', () => {
    const config = makeConfig('text_replace', 'value', {
      search: 'nothere',
      replacement: 'x',
    });
    const result = executeFormatter(config, { value: 'hello world' });
    expect(result.output).toBe('hello world');
  });

  it('replaces only the first occurrence when replaceAll=false', () => {
    const config = makeConfig('text_replace', 'value', {
      search: 'a',
      replacement: 'X',
      replaceAll: false,
    });
    const result = executeFormatter(config, { value: 'banana' });
    expect(result.output).toBe('bXnana');
  });
});

// ─── text_split ───────────────────────────────────────────────────────────────

describe('executeFormatter — text_split', () => {
  it('splits a comma-delimited string into an array', () => {
    const config = makeConfig('text_split', 'value', { delimiter: ',' });
    const result = executeFormatter(config, { value: 'a,b,c' });
    expect(result.output).toEqual(['a', 'b', 'c']);
  });

  it('splits on custom delimiter', () => {
    const config = makeConfig('text_split', 'value', { delimiter: ' | ' });
    const result = executeFormatter(config, { value: 'one | two | three' });
    expect(result.output).toEqual(['one', 'two', 'three']);
  });

  it('returns a specific index when index option is set', () => {
    const config = makeConfig('text_split', 'value', { delimiter: ',', index: 1 });
    const result = executeFormatter(config, { value: 'a,b,c' });
    expect(result.output).toBe('b');
  });

  it('returns empty string for out-of-range index', () => {
    const config = makeConfig('text_split', 'value', { delimiter: ',', index: 99 });
    const result = executeFormatter(config, { value: 'a,b,c' });
    expect(result.output).toBe('');
  });
});

// ─── number_format ────────────────────────────────────────────────────────────

describe('executeFormatter — number_format', () => {
  it('formats a number with 2 decimal places by default', () => {
    const config = makeConfig('number_format', 'value', { decimals: 2, locale: 'en-US' });
    const result = executeFormatter(config, { value: 1234.5 });
    expect(String(result.output)).toMatch(/1,234\.50/);
  });

  it('formats a whole number with zero decimals', () => {
    const config = makeConfig('number_format', 'value', { decimals: 0, locale: 'en-US' });
    const result = executeFormatter(config, { value: 1234 });
    expect(String(result.output)).toMatch(/1,234/);
  });

  it('returns original string if input is not a number', () => {
    const config = makeConfig('number_format', 'value', {});
    const result = executeFormatter(config, { value: 'not-a-number' });
    expect(result.output).toBe('not-a-number');
  });
});

// ─── date_format ─────────────────────────────────────────────────────────────

describe('executeFormatter — date_format', () => {
  it('formats a date string to ISO by default', () => {
    const config = makeConfig('date_format', 'value', { format: 'iso' });
    const result = executeFormatter(config, { value: '2024-06-15T10:30:00.000Z' });
    expect(result.output).toBe('2024-06-15T10:30:00.000Z');
  });

  it('formats a date string to unix timestamp', () => {
    const config = makeConfig('date_format', 'value', { format: 'unix' });
    const result = executeFormatter(config, { value: '2024-01-01T00:00:00.000Z' });
    expect(Number(result.output)).toBe(1704067200);
  });

  it('returns original string for invalid date', () => {
    const config = makeConfig('date_format', 'value', { format: 'iso' });
    const result = executeFormatter(config, { value: 'not-a-date' });
    expect(result.output).toBe('not-a-date');
  });
});

// ─── number_math ─────────────────────────────────────────────────────────────

describe('executeFormatter — number_math', () => {
  it('adds an operand to the input', () => {
    const config = makeConfig('number_math', 'value', { operator: '+', operand: 10 });
    const result = executeFormatter(config, { value: 5 });
    expect(result.output).toBe(15);
  });

  it('subtracts an operand from the input', () => {
    const config = makeConfig('number_math', 'value', { operator: '-', operand: 3 });
    const result = executeFormatter(config, { value: 10 });
    expect(result.output).toBe(7);
  });

  it('multiplies the input', () => {
    const config = makeConfig('number_math', 'value', { operator: '*', operand: 4 });
    const result = executeFormatter(config, { value: 5 });
    expect(result.output).toBe(20);
  });

  it('divides the input', () => {
    const config = makeConfig('number_math', 'value', { operator: '/', operand: 2 });
    const result = executeFormatter(config, { value: 10 });
    expect(result.output).toBe(5);
  });

  it('returns 0 for division by zero', () => {
    const config = makeConfig('number_math', 'value', { operator: '/', operand: 0 });
    const result = executeFormatter(config, { value: 10 });
    expect(result.output).toBe(0);
  });
});

// ─── metadata checks ─────────────────────────────────────────────────────────

describe('executeFormatter — result metadata', () => {
  it('returns the operation and inputValue in the result', () => {
    const config = makeConfig('text_trim', 'value');
    const result = executeFormatter(config, { value: '  hello  ' });
    expect(result.operation).toBe('text_trim');
    expect(result.inputValue).toBe('  hello  ');
  });

  it('uses empty string when inputField is missing from inputData', () => {
    const config = makeConfig('text_trim', 'missing_field');
    const result = executeFormatter(config, {});
    expect(result.inputValue).toBe('');
    expect(result.output).toBe('');
  });
});
