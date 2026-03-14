// ─── Formatter Step Executor ────────────────────────────────────────────────
// 30+ data transformation operations across text, numbers, dates, and lookup tables.
// FlowForge equivalent of Zapier's Formatter utility.

import type { FormatterConfig, FormatterOperation } from '@/types';

export interface FormatterResult {
  output: unknown;
  operation: FormatterOperation;
  inputValue: unknown;
}

/**
 * Execute a formatter step.
 */
export function executeFormatter(
  config: FormatterConfig,
  inputData: Record<string, unknown>
): FormatterResult {
  const inputValue = inputData[config.inputField] ?? '';
  const output = applyOperation(config.operation, inputValue, config.options);

  return {
    output,
    operation: config.operation,
    inputValue,
  };
}

function applyOperation(
  operation: FormatterOperation,
  input: unknown,
  options: Record<string, unknown>
): unknown {
  const str = String(input ?? '');
  const num = Number(input);

  switch (operation) {
    // ── Text Operations ───────────────────────────────────────────────────
    case 'text_split': {
      const delimiter = String(options.delimiter ?? ',');
      const index = options.index !== undefined ? Number(options.index) : undefined;
      const parts = str.split(delimiter);
      return index !== undefined ? (parts[index] ?? '') : parts;
    }

    case 'text_replace': {
      const search = String(options.search ?? '');
      const replacement = String(options.replacement ?? '');
      const replaceAll = options.replaceAll !== false;
      if (replaceAll) {
        return str.split(search).join(replacement);
      }
      return str.replace(search, replacement);
    }

    case 'text_extract': {
      const pattern = String(options.pattern ?? '');
      try {
        const regex = new RegExp(pattern, 'g');
        const matches = str.match(regex);
        return matches ?? [];
      } catch {
        return [];
      }
    }

    case 'text_case': {
      const caseType = String(options.caseType ?? 'lower');
      switch (caseType) {
        case 'upper': return str.toUpperCase();
        case 'lower': return str.toLowerCase();
        case 'title': return str.replace(/\b\w/g, (c) => c.toUpperCase());
        case 'capitalize': return str.charAt(0).toUpperCase() + str.slice(1);
        default: return str;
      }
    }

    case 'text_trim':
      return str.trim();

    case 'text_encode': {
      const encoding = String(options.encoding ?? 'url');
      switch (encoding) {
        case 'url': return encodeURIComponent(str);
        case 'url_decode': return decodeURIComponent(str);
        case 'base64': return Buffer.from(str).toString('base64');
        case 'base64_decode': return Buffer.from(str, 'base64').toString('utf8');
        case 'html': return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        default: return str;
      }
    }

    case 'text_truncate': {
      const maxLength = Number(options.maxLength ?? 100);
      const suffix = String(options.suffix ?? '...');
      if (str.length <= maxLength) return str;
      return str.slice(0, maxLength) + suffix;
    }

    case 'text_default': {
      const defaultValue = String(options.defaultValue ?? '');
      return (str === '' || str === 'undefined' || str === 'null') ? defaultValue : str;
    }

    // ── Number Operations ─────────────────────────────────────────────────
    case 'number_format': {
      const decimals = Number(options.decimals ?? 2);
      const locale = String(options.locale ?? 'en-US');
      if (isNaN(num)) return str;
      return num.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    case 'number_math': {
      const operator = String(options.operator ?? '+');
      const operand = Number(options.operand ?? 0);
      if (isNaN(num)) return 0;
      switch (operator) {
        case '+': return num + operand;
        case '-': return num - operand;
        case '*': return num * operand;
        case '/': return operand !== 0 ? num / operand : 0;
        case '%': return operand !== 0 ? num % operand : 0;
        case '**': return Math.pow(num, operand);
        default: return num;
      }
    }

    case 'number_random': {
      const min = Number(options.min ?? 0);
      const max = Number(options.max ?? 100);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    case 'number_round': {
      const mode = String(options.mode ?? 'round');
      const precision = Number(options.precision ?? 0);
      if (isNaN(num)) return 0;
      const factor = Math.pow(10, precision);
      switch (mode) {
        case 'floor': return Math.floor(num * factor) / factor;
        case 'ceil': return Math.ceil(num * factor) / factor;
        case 'round': return Math.round(num * factor) / factor;
        default: return num;
      }
    }

    case 'number_currency': {
      const currency = String(options.currency ?? 'USD');
      const locale = String(options.locale ?? 'en-US');
      if (isNaN(num)) return str;
      return num.toLocaleString(locale, {
        style: 'currency',
        currency,
      });
    }

    // ── Date Operations ───────────────────────────────────────────────────
    case 'date_format': {
      const date = new Date(str);
      if (isNaN(date.getTime())) return str;
      const formatStr = String(options.format ?? 'iso');
      switch (formatStr) {
        case 'iso': return date.toISOString();
        case 'date': return date.toLocaleDateString();
        case 'time': return date.toLocaleTimeString();
        case 'datetime': return date.toLocaleString();
        case 'unix': return Math.floor(date.getTime() / 1000).toString();
        default: return date.toISOString();
      }
    }

    case 'date_add': {
      const date = new Date(str);
      if (isNaN(date.getTime())) return str;
      const amount = Number(options.amount ?? 0);
      const unit = String(options.unit ?? 'days');
      const newDate = new Date(date);
      switch (unit) {
        case 'seconds': newDate.setSeconds(newDate.getSeconds() + amount); break;
        case 'minutes': newDate.setMinutes(newDate.getMinutes() + amount); break;
        case 'hours': newDate.setHours(newDate.getHours() + amount); break;
        case 'days': newDate.setDate(newDate.getDate() + amount); break;
        case 'weeks': newDate.setDate(newDate.getDate() + amount * 7); break;
        case 'months': newDate.setMonth(newDate.getMonth() + amount); break;
        case 'years': newDate.setFullYear(newDate.getFullYear() + amount); break;
      }
      return newDate.toISOString();
    }

    case 'date_compare': {
      const date1 = new Date(str);
      const date2Str = String(options.compareTo ?? '');
      const date2 = new Date(date2Str);
      if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return { error: 'Invalid dates' };
      const diffMs = date1.getTime() - date2.getTime();
      return {
        diffMs,
        diffSeconds: Math.floor(diffMs / 1000),
        diffMinutes: Math.floor(diffMs / 60000),
        diffHours: Math.floor(diffMs / 3600000),
        diffDays: Math.floor(diffMs / 86400000),
        isBefore: diffMs < 0,
        isAfter: diffMs > 0,
        isEqual: diffMs === 0,
      };
    }

    case 'date_timezone': {
      const date = new Date(str);
      if (isNaN(date.getTime())) return str;
      const tz = String(options.timezone ?? 'UTC');
      return date.toLocaleString('en-US', { timeZone: tz });
    }

    case 'date_to_timestamp': {
      const date = new Date(str);
      if (isNaN(date.getTime())) return 0;
      return Math.floor(date.getTime() / 1000);
    }

    case 'timestamp_to_date': {
      const ts = Number(input);
      if (isNaN(ts)) return str;
      return new Date(ts * 1000).toISOString();
    }

    // ── Lookup Table ──────────────────────────────────────────────────────
    case 'lookup_table': {
      const table = (options.table ?? {}) as Record<string, string>;
      const defaultVal = String(options.defaultValue ?? str);
      return table[str] ?? defaultVal;
    }

    // ── Line Items / Arrays ───────────────────────────────────────────────
    case 'line_items_create': {
      const fields = (options.fields ?? []) as string[];
      const items: Record<string, unknown>[] = [];
      const data = input as Record<string, unknown[]>;
      if (data && typeof data === 'object') {
        const maxLen = Math.max(
          ...fields.map((f) => Array.isArray(data[f]) ? data[f].length : 0)
        );
        for (let i = 0; i < maxLen; i++) {
          const item: Record<string, unknown> = {};
          for (const field of fields) {
            item[field] = Array.isArray(data[field]) ? data[field][i] : undefined;
          }
          items.push(item);
        }
      }
      return items;
    }

    case 'line_items_convert': {
      const items = input as Record<string, unknown>[];
      if (!Array.isArray(items)) return {};
      const result: Record<string, unknown[]> = {};
      for (const item of items) {
        for (const [key, value] of Object.entries(item)) {
          if (!result[key]) result[key] = [];
          result[key].push(value);
        }
      }
      return result;
    }

    case 'csv_parse': {
      const delimiter = String(options.delimiter ?? ',');
      const hasHeader = options.hasHeader !== false;
      const lines = str.split('\n').filter((l) => l.trim());
      if (lines.length === 0) return [];
      if (hasHeader) {
        const headers = lines[0].split(delimiter).map((h) => h.trim());
        return lines.slice(1).map((line) => {
          const values = line.split(delimiter);
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim(); });
          return row;
        });
      }
      return lines.map((line) => line.split(delimiter).map((v) => v.trim()));
    }

    default:
      return input;
  }
}
