'use client';

import { useCallback } from 'react';
import { useWorkflowStore } from '@/hooks/use-workflow-store';
import type {
  StepConfig,
  TriggerConfig,
  FilterConfig,
  FilterCondition,
  FilterOperator,
  DelayConfig,
  HttpConfig,
  HttpAuthConfig,
  AiConfig,
  CodeConfig,
  ActionConfig,
  FormatterConfig,
  FormatterOperation,
  StorageConfig,
  DigestConfig,
  SubWorkflowConfig,
  HitlConfig,
  ErrorHandlerConfig,
  PathConfig,
  PathBranch,
  LoopConfig,
  StepType,
  TriggerType,
} from '@/types';
import { generateId } from '@/lib/utils';

// ─── Step Type Icon Map ──────────────────────────────────────────────────────

const STEP_ICONS: Record<StepType | 'trigger', string> = {
  filter: '🔍',
  delay: '⏱',
  http: '🌐',
  ai: '✨',
  code: '💻',
  action: '⚡',
  formatter: '🔄',
  storage: '💾',
  digest: '📦',
  'sub-workflow': '🔀',
  'human-in-the-loop': '👤',
  'error-handler': '⚠️',
  trigger: '🎯',
  path: '🔀',
  loop: '🔁',
};

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-400 mb-1">{children}</label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] ${className}`}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] resize-none ${className}`}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-[#C9A227]' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-1'
          }`}
        />
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
}

function SectionDivider() {
  return <div className="border-t border-gray-700 my-4" />;
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-[#C9A227] hover:text-yellow-300 flex items-center gap-1 mt-2"
    >
      <span className="text-base leading-none">+</span> {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-gray-500 hover:text-red-400 text-xs px-1"
      title="Remove"
    >
      ✕
    </button>
  );
}

// ─── FilterConfigForm ────────────────────────────────────────────────────────

const FILTER_OPERATORS: { label: string; value: FilterOperator }[] = [
  { label: 'equals', value: 'equals' },
  { label: 'not equals', value: 'not_equals' },
  { label: 'contains', value: 'contains' },
  { label: 'not contains', value: 'not_contains' },
  { label: 'starts with', value: 'starts_with' },
  { label: 'ends with', value: 'ends_with' },
  { label: 'greater than', value: 'greater_than' },
  { label: 'less than', value: 'less_than' },
  { label: 'greater equal', value: 'greater_equal' },
  { label: 'less equal', value: 'less_equal' },
  { label: 'is empty', value: 'is_empty' },
  { label: 'is not empty', value: 'is_not_empty' },
  { label: 'matches regex', value: 'matches_regex' },
];

const NO_VALUE_OPS: FilterOperator[] = ['is_empty', 'is_not_empty'];

function FilterConfigForm({
  config,
  onChange,
}: {
  config: FilterConfig;
  onChange: (c: FilterConfig) => void;
}) {
  const updateCondition = (i: number, partial: Partial<FilterCondition>) => {
    const conditions = config.conditions.map((c, idx) =>
      idx === i ? { ...c, ...partial } : c
    );
    onChange({ ...config, conditions });
  };

  const addCondition = () => {
    onChange({
      ...config,
      conditions: [
        ...config.conditions,
        { field: '', operator: 'equals', value: '' },
      ],
    });
  };

  const removeCondition = (i: number) => {
    onChange({
      ...config,
      conditions: config.conditions.filter((_, idx) => idx !== i),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>Logic</Label>
        <div className="flex rounded-md overflow-hidden border border-gray-700">
          {(['and', 'or'] as const).map((l) => (
            <button
              key={l}
              onClick={() => onChange({ ...config, logic: l })}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                config.logic === l
                  ? 'bg-[#C9A227] text-black'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {config.conditions.map((cond, i) => (
        <div key={i} className="space-y-1.5 bg-gray-900/50 rounded-md p-2 border border-gray-700">
          <div className="flex gap-1 items-start">
            <div className="flex-1 space-y-1.5">
              <Input
                value={cond.field}
                onChange={(v) => updateCondition(i, { field: v })}
                placeholder="Field (e.g. lead.source)"
              />
              <Select
                value={cond.operator}
                onChange={(v) => updateCondition(i, { operator: v as FilterOperator })}
                options={FILTER_OPERATORS}
              />
              {!NO_VALUE_OPS.includes(cond.operator) && (
                <Input
                  value={String(cond.value)}
                  onChange={(v) => updateCondition(i, { value: v })}
                  placeholder="Value"
                />
              )}
            </div>
            <RemoveButton onClick={() => removeCondition(i)} />
          </div>
        </div>
      ))}

      <AddButton onClick={addCondition} label="Add condition" />
    </div>
  );
}

// ─── DelayConfigForm ─────────────────────────────────────────────────────────

function DelayConfigForm({
  config,
  onChange,
}: {
  config: DelayConfig;
  onChange: (c: DelayConfig) => void;
}) {
  const mode = config.untilTime ? 'until' : 'duration';

  const setMode = (m: 'duration' | 'until') => {
    onChange({ ...config, untilTime: m === 'until' ? '' : null });
  };

  return (
    <div className="space-y-3">
      <div className="flex rounded-md overflow-hidden border border-gray-700">
        {(['duration', 'until'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-[#C9A227] text-black'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {m === 'duration' ? 'Duration' : 'Until Time'}
          </button>
        ))}
      </div>

      {mode === 'duration' ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Amount</Label>
            <Input
              type="number"
              value={config.duration}
              onChange={(v) => onChange({ ...config, duration: Number(v) })}
              placeholder="e.g. 5"
            />
          </div>
          <div className="flex-1">
            <Label>Unit</Label>
            <Select
              value={config.unit}
              onChange={(v) => onChange({ ...config, unit: v as DelayConfig['unit'] })}
              options={[
                { label: 'Seconds', value: 'seconds' },
                { label: 'Minutes', value: 'minutes' },
                { label: 'Hours', value: 'hours' },
                { label: 'Days', value: 'days' },
              ]}
            />
          </div>
        </div>
      ) : (
        <div>
          <Label>Until Date/Time</Label>
          <Input
            type="datetime-local"
            value={config.untilTime ?? ''}
            onChange={(v) => onChange({ ...config, untilTime: v })}
          />
        </div>
      )}
    </div>
  );
}

// ─── HttpConfigForm ──────────────────────────────────────────────────────────

type HeaderEntry = { key: string; value: string };

function HttpConfigForm({
  config,
  onChange,
}: {
  config: HttpConfig;
  onChange: (c: HttpConfig) => void;
}) {
  const headerEntries: HeaderEntry[] = Object.entries(config.headers).map(([key, value]) => ({
    key,
    value,
  }));

  const updateHeaders = (entries: HeaderEntry[]) => {
    const headers: Record<string, string> = {};
    entries.forEach((e) => {
      if (e.key) headers[e.key] = e.value;
    });
    onChange({ ...config, headers });
  };

  const addHeader = () => {
    updateHeaders([...headerEntries, { key: '', value: '' }]);
  };

  const updateHeader = (i: number, partial: Partial<HeaderEntry>) => {
    const updated = headerEntries.map((h, idx) => (idx === i ? { ...h, ...partial } : h));
    updateHeaders(updated);
  };

  const removeHeader = (i: number) => {
    updateHeaders(headerEntries.filter((_, idx) => idx !== i));
  };

  const authType = config.auth?.type ?? 'none';

  const setAuthType = (t: string) => {
    if (t === 'none') {
      onChange({ ...config, auth: null });
    } else {
      onChange({
        ...config,
        auth: { type: t as HttpAuthConfig['type'], credentials: {} },
      });
    }
  };

  const updateAuthCred = (key: string, value: string) => {
    if (!config.auth) return;
    onChange({
      ...config,
      auth: { ...config.auth, credentials: { ...config.auth.credentials, [key]: value } },
    });
  };

  const showBody = ['POST', 'PUT', 'PATCH'].includes(config.method);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="w-28 shrink-0">
          <Label>Method</Label>
          <Select
            value={config.method}
            onChange={(v) => onChange({ ...config, method: v as HttpConfig['method'] })}
            options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({
              label: m,
              value: m,
            }))}
          />
        </div>
        <div className="flex-1">
          <Label>URL</Label>
          <Input
            value={config.url}
            onChange={(v) => onChange({ ...config, url: v })}
            placeholder="https://api.example.com/endpoint"
          />
        </div>
      </div>

      <SectionDivider />

      <div>
        <Label>Authentication</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {(['none', 'bearer', 'basic', 'api_key'] as const).map((t) => (
            <label key={t} className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="auth-type"
                value={t}
                checked={authType === t}
                onChange={() => setAuthType(t)}
                className="accent-[#C9A227]"
              />
              {t === 'api_key' ? 'API Key' : t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>
        {authType === 'bearer' && (
          <div className="mt-2">
            <Label>Token</Label>
            <Input
              value={config.auth?.credentials?.token ?? ''}
              onChange={(v) => updateAuthCred('token', v)}
              placeholder="Bearer token"
            />
          </div>
        )}
        {authType === 'basic' && (
          <div className="mt-2 space-y-2">
            <div>
              <Label>Username</Label>
              <Input
                value={config.auth?.credentials?.username ?? ''}
                onChange={(v) => updateAuthCred('username', v)}
                placeholder="Username"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={config.auth?.credentials?.password ?? ''}
                onChange={(v) => updateAuthCred('password', v)}
                placeholder="Password"
              />
            </div>
          </div>
        )}
        {authType === 'api_key' && (
          <div className="mt-2 space-y-2">
            <div>
              <Label>Key Name</Label>
              <Input
                value={config.auth?.credentials?.keyName ?? ''}
                onChange={(v) => updateAuthCred('keyName', v)}
                placeholder="e.g. X-API-Key"
              />
            </div>
            <div>
              <Label>Key Value</Label>
              <Input
                value={config.auth?.credentials?.keyValue ?? ''}
                onChange={(v) => updateAuthCred('keyValue', v)}
                placeholder="Your API key"
              />
            </div>
          </div>
        )}
      </div>

      <SectionDivider />

      <div>
        <Label>Headers</Label>
        <div className="space-y-1.5 mt-1">
          {headerEntries.map((h, i) => (
            <div key={i} className="flex gap-1">
              <Input
                value={h.key}
                onChange={(v) => updateHeader(i, { key: v })}
                placeholder="Header name"
              />
              <Input
                value={h.value}
                onChange={(v) => updateHeader(i, { value: v })}
                placeholder="Value"
              />
              <RemoveButton onClick={() => removeHeader(i)} />
            </div>
          ))}
        </div>
        <AddButton onClick={addHeader} label="Add header" />
      </div>

      {showBody && (
        <>
          <SectionDivider />
          <div>
            <Label>Request Body (JSON)</Label>
            <Textarea
              value={typeof config.body === 'string' ? config.body : JSON.stringify(config.body ?? '', null, 2)}
              onChange={(v) => onChange({ ...config, body: v })}
              placeholder='{"key": "value"}'
              rows={5}
              className="font-mono text-xs"
            />
          </div>
        </>
      )}

      <SectionDivider />

      <div>
        <Label>Timeout (ms)</Label>
        <Input
          type="number"
          value={config.timeout}
          onChange={(v) => onChange({ ...config, timeout: Number(v) })}
          placeholder="30000"
        />
      </div>
    </div>
  );
}

// ─── AiConfigForm ────────────────────────────────────────────────────────────

function AiConfigForm({
  config,
  onChange,
}: {
  config: AiConfig;
  onChange: (c: AiConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Model</Label>
        <Select
          value={config.model}
          onChange={(v) => onChange({ ...config, model: v as AiConfig['model'] })}
          options={[
            { label: 'Claude Sonnet', value: 'claude-sonnet-4-5-20250514' },
            { label: 'Claude Opus', value: 'claude-opus-4-5-20250414' },
            { label: 'GPT-4o', value: 'gpt-4o' },
            { label: 'Gemini Pro', value: 'gemini-pro' },
          ]}
        />
      </div>

      <div>
        <Label>System Prompt</Label>
        <Textarea
          value={config.systemPrompt}
          onChange={(v) => onChange({ ...config, systemPrompt: v })}
          placeholder="You are a helpful assistant..."
          rows={3}
        />
      </div>

      <div>
        <Label>User Prompt</Label>
        <Textarea
          value={config.prompt}
          onChange={(v) => onChange({ ...config, prompt: v })}
          placeholder="Use {{steps.stepId.output.field}} for variables"
          rows={4}
        />
      </div>

      <div>
        <Label>Temperature: {config.temperature.toFixed(1)}</Label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={config.temperature}
          onChange={(e) => onChange({ ...config, temperature: Number(e.target.value) })}
          className="w-full accent-[#C9A227] mt-1"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-0.5">
          <span>Precise (0)</span>
          <span>Creative (1)</span>
        </div>
      </div>

      <div>
        <Label>Max Tokens</Label>
        <Input
          type="number"
          value={config.maxTokens}
          onChange={(v) => onChange({ ...config, maxTokens: Number(v) })}
          placeholder="2048"
        />
      </div>

      <div>
        <Label>Output Format</Label>
        <div className="flex gap-3 mt-1">
          {(['text', 'json', 'structured'] as const).map((f) => (
            <label key={f} className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="output-format"
                value={f}
                checked={config.outputFormat === f}
                onChange={() => onChange({ ...config, outputFormat: f })}
                className="accent-[#C9A227]"
              />
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CodeConfigForm ──────────────────────────────────────────────────────────

function CodeConfigForm({
  config,
  onChange,
}: {
  config: CodeConfig;
  onChange: (c: CodeConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Language</Label>
        <Select
          value={config.language}
          onChange={(v) => onChange({ ...config, language: v as CodeConfig['language'] })}
          options={[
            { label: 'JavaScript', value: 'javascript' },
            { label: 'TypeScript', value: 'typescript' },
            { label: 'Python', value: 'python' },
          ]}
        />
      </div>

      <div>
        <Label>Code</Label>
        <Textarea
          value={config.source}
          onChange={(v) => onChange({ ...config, source: v })}
          placeholder={`// Return a value from your function\nexport default async function(input) {\n  return { result: input };\n}`}
          rows={10}
          className="font-mono text-xs bg-gray-950"
        />
      </div>

      <div>
        <Label>Timeout (ms)</Label>
        <Input
          type="number"
          value={config.timeout}
          onChange={(v) => onChange({ ...config, timeout: Number(v) })}
          placeholder="10000"
        />
      </div>
    </div>
  );
}

// ─── ActionConfigForm ────────────────────────────────────────────────────────

function ActionConfigForm({
  config,
  onChange,
}: {
  config: ActionConfig;
  onChange: (c: ActionConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Connector ID</Label>
        <Input
          value={config.connectorId}
          onChange={(v) => onChange({ ...config, connectorId: v })}
          placeholder="e.g. slack, hubspot, gmail"
        />
      </div>
      <div>
        <Label>Action Key</Label>
        <Input
          value={config.actionKey}
          onChange={(v) => onChange({ ...config, actionKey: v })}
          placeholder="e.g. send_message, create_contact"
        />
      </div>
      <p className="text-xs text-gray-500 bg-gray-900/50 rounded-md p-2 border border-gray-700">
        Select a connector and action to configure parameters. Parameters will appear here once an
        action is selected.
      </p>
    </div>
  );
}

// ─── FormatterConfigForm ─────────────────────────────────────────────────────

const FORMATTER_OPERATIONS: { group: string; options: { label: string; value: FormatterOperation }[] }[] = [
  {
    group: 'Text',
    options: [
      { label: 'Split', value: 'text_split' },
      { label: 'Replace', value: 'text_replace' },
      { label: 'Extract', value: 'text_extract' },
      { label: 'Change Case', value: 'text_case' },
      { label: 'Trim', value: 'text_trim' },
      { label: 'Encode/Decode', value: 'text_encode' },
      { label: 'Truncate', value: 'text_truncate' },
      { label: 'Default Value', value: 'text_default' },
    ],
  },
  {
    group: 'Number',
    options: [
      { label: 'Format Number', value: 'number_format' },
      { label: 'Math', value: 'number_math' },
      { label: 'Random', value: 'number_random' },
      { label: 'Round', value: 'number_round' },
      { label: 'Currency', value: 'number_currency' },
    ],
  },
  {
    group: 'Date',
    options: [
      { label: 'Format Date', value: 'date_format' },
      { label: 'Add Time', value: 'date_add' },
      { label: 'Compare Dates', value: 'date_compare' },
      { label: 'Timezone Convert', value: 'date_timezone' },
      { label: 'To Timestamp', value: 'date_to_timestamp' },
      { label: 'From Timestamp', value: 'timestamp_to_date' },
    ],
  },
  {
    group: 'Utility',
    options: [
      { label: 'Lookup Table', value: 'lookup_table' },
      { label: 'Create Line Items', value: 'line_items_create' },
      { label: 'Convert Line Items', value: 'line_items_convert' },
      { label: 'Parse CSV', value: 'csv_parse' },
    ],
  },
];

function FormatterConfigForm({
  config,
  onChange,
}: {
  config: FormatterConfig;
  onChange: (c: FormatterConfig) => void;
}) {
  const updateOption = (key: string, value: unknown) => {
    onChange({ ...config, options: { ...config.options, [key]: value } });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Operation</Label>
        <select
          value={config.operation}
          onChange={(e) => onChange({ ...config, operation: e.target.value as FormatterOperation })}
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
        >
          {FORMATTER_OPERATIONS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <Label>Input Field</Label>
        <Input
          value={config.inputField}
          onChange={(v) => onChange({ ...config, inputField: v })}
          placeholder="e.g. {{steps.step1.output.text}}"
        />
      </div>

      {config.operation === 'text_replace' && (
        <>
          <div>
            <Label>Find</Label>
            <Input
              value={String(config.options.find ?? '')}
              onChange={(v) => updateOption('find', v)}
              placeholder="Text to find"
            />
          </div>
          <div>
            <Label>Replace With</Label>
            <Input
              value={String(config.options.replace ?? '')}
              onChange={(v) => updateOption('replace', v)}
              placeholder="Replacement text"
            />
          </div>
        </>
      )}

      {config.operation === 'text_split' && (
        <div>
          <Label>Separator</Label>
          <Input
            value={String(config.options.separator ?? ',')}
            onChange={(v) => updateOption('separator', v)}
            placeholder=","
          />
        </div>
      )}

      {config.operation === 'text_truncate' && (
        <div>
          <Label>Max Length</Label>
          <Input
            type="number"
            value={String(config.options.maxLength ?? 100)}
            onChange={(v) => updateOption('maxLength', Number(v))}
            placeholder="100"
          />
        </div>
      )}

      {config.operation === 'text_case' && (
        <div>
          <Label>Case</Label>
          <Select
            value={String(config.options.case ?? 'lower')}
            onChange={(v) => updateOption('case', v)}
            options={[
              { label: 'Lowercase', value: 'lower' },
              { label: 'Uppercase', value: 'upper' },
              { label: 'Title Case', value: 'title' },
              { label: 'Capitalize', value: 'capitalize' },
            ]}
          />
        </div>
      )}

      {config.operation === 'date_format' && (
        <div>
          <Label>Format</Label>
          <Input
            value={String(config.options.format ?? 'YYYY-MM-DD')}
            onChange={(v) => updateOption('format', v)}
            placeholder="YYYY-MM-DD"
          />
        </div>
      )}

      {config.operation === 'number_round' && (
        <div>
          <Label>Decimal Places</Label>
          <Input
            type="number"
            value={String(config.options.decimals ?? 2)}
            onChange={(v) => updateOption('decimals', Number(v))}
            placeholder="2"
          />
        </div>
      )}
    </div>
  );
}

// ─── StorageConfigForm ───────────────────────────────────────────────────────

function StorageConfigForm({
  config,
  onChange,
}: {
  config: StorageConfig;
  onChange: (c: StorageConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Action</Label>
        <Select
          value={config.action}
          onChange={(v) => onChange({ ...config, action: v as StorageConfig['action'] })}
          options={[
            { label: 'Set', value: 'set' },
            { label: 'Get', value: 'get' },
            { label: 'Increment', value: 'increment' },
            { label: 'Decrement', value: 'decrement' },
            { label: 'Delete', value: 'delete' },
            { label: 'List', value: 'list' },
          ]}
        />
      </div>
      <div>
        <Label>Namespace</Label>
        <Input
          value={config.namespace}
          onChange={(v) => onChange({ ...config, namespace: v })}
          placeholder="e.g. user-data"
        />
      </div>
      <div>
        <Label>Key</Label>
        <Input
          value={config.key}
          onChange={(v) => onChange({ ...config, key: v })}
          placeholder="e.g. counter"
        />
      </div>
      {config.action === 'set' && (
        <div>
          <Label>Value</Label>
          <Input
            value={config.value ?? ''}
            onChange={(v) => onChange({ ...config, value: v })}
            placeholder="Value to store"
          />
        </div>
      )}
    </div>
  );
}

// ─── DigestConfigForm ────────────────────────────────────────────────────────

function DigestConfigForm({
  config,
  onChange,
}: {
  config: DigestConfig;
  onChange: (c: DigestConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Action</Label>
        <Select
          value={config.action}
          onChange={(v) => onChange({ ...config, action: v as DigestConfig['action'] })}
          options={[
            { label: 'Append', value: 'append' },
            { label: 'Release', value: 'release' },
          ]}
        />
      </div>
      <div>
        <Label>Digest Key</Label>
        <Input
          value={config.digestKey}
          onChange={(v) => onChange({ ...config, digestKey: v })}
          placeholder="e.g. daily-digest"
        />
      </div>
      <div>
        <Label>Release Schedule (cron)</Label>
        <Input
          value={config.releaseSchedule ?? ''}
          onChange={(v) => onChange({ ...config, releaseSchedule: v || null })}
          placeholder="0 9 * * * (daily at 9am)"
        />
      </div>
      <div>
        <Label>Release Threshold (count)</Label>
        <Input
          type="number"
          value={config.releaseThreshold ?? ''}
          onChange={(v) => onChange({ ...config, releaseThreshold: v ? Number(v) : null })}
          placeholder="e.g. 10"
        />
      </div>
      <div>
        <Label>Template</Label>
        <Textarea
          value={config.template}
          onChange={(v) => onChange({ ...config, template: v })}
          placeholder="Use {{items}} to reference collected items"
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── SubWorkflowConfigForm ───────────────────────────────────────────────────

function SubWorkflowConfigForm({
  config,
  onChange,
}: {
  config: SubWorkflowConfig;
  onChange: (c: SubWorkflowConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Target Workflow ID</Label>
        <Input
          value={config.targetWorkflowId}
          onChange={(v) => onChange({ ...config, targetWorkflowId: v })}
          placeholder="wf_abc123"
        />
      </div>
      <div>
        <Toggle
          checked={config.waitForCompletion}
          onChange={(v) => onChange({ ...config, waitForCompletion: v })}
          label="Wait for completion"
        />
      </div>
    </div>
  );
}

// ─── HitlConfigForm ──────────────────────────────────────────────────────────

function HitlConfigForm({
  config,
  onChange,
}: {
  config: HitlConfig;
  onChange: (c: HitlConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Assignee Email</Label>
        <Input
          type="email"
          value={config.assigneeEmail}
          onChange={(v) => onChange({ ...config, assigneeEmail: v })}
          placeholder="approver@example.com"
        />
      </div>
      <div>
        <Label>Instructions</Label>
        <Textarea
          value={config.instructions}
          onChange={(v) => onChange({ ...config, instructions: v })}
          placeholder="Please review and approve this request..."
          rows={3}
        />
      </div>
      <div>
        <Label>Deadline (hours)</Label>
        <Input
          type="number"
          value={config.deadline}
          onChange={(v) => onChange({ ...config, deadline: Number(v) })}
          placeholder="24"
        />
      </div>
      <div>
        <Label>Deadline Action</Label>
        <Select
          value={config.deadlineAction}
          onChange={(v) => onChange({ ...config, deadlineAction: v as HitlConfig['deadlineAction'] })}
          options={[
            { label: 'Auto Approve', value: 'approve' },
            { label: 'Auto Reject', value: 'reject' },
            { label: 'Escalate', value: 'escalate' },
          ]}
        />
      </div>
      {config.deadlineAction === 'escalate' && (
        <div>
          <Label>Escalate To (email)</Label>
          <Input
            type="email"
            value={config.escalateTo ?? ''}
            onChange={(v) => onChange({ ...config, escalateTo: v || null })}
            placeholder="manager@example.com"
          />
        </div>
      )}
    </div>
  );
}

// ─── ErrorHandlerConfigForm ──────────────────────────────────────────────────

function ErrorHandlerConfigForm({
  config,
  onChange,
}: {
  config: ErrorHandlerConfig;
  onChange: (c: ErrorHandlerConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Action on Error</Label>
        <Select
          value={config.action}
          onChange={(v) => onChange({ ...config, action: v as ErrorHandlerConfig['action'] })}
          options={[
            { label: 'Retry', value: 'retry' },
            { label: 'Skip', value: 'skip' },
            { label: 'Halt', value: 'halt' },
            { label: 'Route to step', value: 'route' },
          ]}
        />
      </div>
      {config.action === 'retry' && (
        <>
          <div>
            <Label>Max Retries</Label>
            <Input
              type="number"
              value={config.maxRetries}
              onChange={(v) => onChange({ ...config, maxRetries: Number(v) })}
              placeholder="3"
            />
          </div>
          <div>
            <Label>Retry Delay (ms)</Label>
            <Input
              type="number"
              value={config.retryDelayMs}
              onChange={(v) => onChange({ ...config, retryDelayMs: Number(v) })}
              placeholder="1000"
            />
          </div>
          <div>
            <Label>Backoff Strategy</Label>
            <Select
              value={config.retryBackoff}
              onChange={(v) => onChange({ ...config, retryBackoff: v as ErrorHandlerConfig['retryBackoff'] })}
              options={[
                { label: 'Fixed', value: 'fixed' },
                { label: 'Exponential', value: 'exponential' },
              ]}
            />
          </div>
        </>
      )}
      {config.action === 'route' && (
        <div>
          <Label>Route to Step ID</Label>
          <Input
            value={config.routeToStepId ?? ''}
            onChange={(v) => onChange({ ...config, routeToStepId: v || null })}
            placeholder="step_abc123"
          />
        </div>
      )}
    </div>
  );
}

// ─── PathConfigForm ──────────────────────────────────────────────────────────

function PathConfigForm({
  config,
  onChange,
}: {
  config: PathConfig;
  onChange: (c: PathConfig) => void;
}) {
  const addBranch = () => {
    const newBranch: PathBranch = {
      id: generateId('branch'),
      name: `Branch ${config.branches.length + 1}`,
      conditions: [],
      logic: 'and',
      nextStepIds: [],
    };
    onChange({ ...config, branches: [...config.branches, newBranch] });
  };

  const updateBranch = (i: number, partial: Partial<PathBranch>) => {
    const branches = config.branches.map((b, idx) =>
      idx === i ? { ...b, ...partial } : b
    );
    onChange({ ...config, branches });
  };

  const removeBranch = (i: number) => {
    onChange({ ...config, branches: config.branches.filter((_, idx) => idx !== i) });
  };

  const addConditionToBranch = (branchIdx: number) => {
    const branch = config.branches[branchIdx];
    updateBranch(branchIdx, {
      conditions: [...branch.conditions, { field: '', operator: 'equals', value: '' }],
    });
  };

  const updateBranchCondition = (branchIdx: number, condIdx: number, partial: Partial<FilterCondition>) => {
    const branch = config.branches[branchIdx];
    const conditions = branch.conditions.map((c, i) => (i === condIdx ? { ...c, ...partial } : c));
    updateBranch(branchIdx, { conditions });
  };

  const removeBranchCondition = (branchIdx: number, condIdx: number) => {
    const branch = config.branches[branchIdx];
    updateBranch(branchIdx, {
      conditions: branch.conditions.filter((_, i) => i !== condIdx),
    });
  };

  return (
    <div className="space-y-3">
      {config.branches.map((branch, bi) => (
        <div key={branch.id} className="bg-gray-900/50 rounded-md p-3 border border-gray-700 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={branch.name}
              onChange={(v) => updateBranch(bi, { name: v })}
              placeholder="Branch name"
              className="flex-1"
            />
            <RemoveButton onClick={() => removeBranch(bi)} />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Logic:</span>
            <div className="flex rounded overflow-hidden border border-gray-700">
              {(['and', 'or'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => updateBranch(bi, { logic: l })}
                  className={`px-2 py-0.5 text-xs transition-colors ${
                    branch.logic === l
                      ? 'bg-[#C9A227] text-black'
                      : 'bg-gray-900 text-gray-400'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {branch.conditions.map((cond, ci) => (
            <div key={ci} className="space-y-1 pl-2 border-l border-gray-700">
              <div className="flex gap-1 items-start">
                <div className="flex-1 space-y-1">
                  <Input
                    value={cond.field}
                    onChange={(v) => updateBranchCondition(bi, ci, { field: v })}
                    placeholder="Field"
                  />
                  <Select
                    value={cond.operator}
                    onChange={(v) => updateBranchCondition(bi, ci, { operator: v as FilterOperator })}
                    options={FILTER_OPERATORS}
                  />
                  {!NO_VALUE_OPS.includes(cond.operator) && (
                    <Input
                      value={String(cond.value)}
                      onChange={(v) => updateBranchCondition(bi, ci, { value: v })}
                      placeholder="Value"
                    />
                  )}
                </div>
                <RemoveButton onClick={() => removeBranchCondition(bi, ci)} />
              </div>
            </div>
          ))}

          <AddButton onClick={() => addConditionToBranch(bi)} label="Add condition" />
        </div>
      ))}
      <AddButton onClick={addBranch} label="Add branch" />
    </div>
  );
}

// ─── LoopConfigForm ──────────────────────────────────────────────────────────

function LoopConfigForm({
  config,
  onChange,
}: {
  config: LoopConfig;
  onChange: (c: LoopConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Source Field (array)</Label>
        <Input
          value={config.sourceField}
          onChange={(v) => onChange({ ...config, sourceField: v })}
          placeholder="e.g. {{steps.step1.output.items}}"
        />
      </div>
      <div>
        <Label>Max Iterations</Label>
        <Input
          type="number"
          value={config.maxIterations}
          onChange={(v) => onChange({ ...config, maxIterations: Number(v) })}
          placeholder="100"
        />
      </div>
      <Toggle
        checked={config.parallel}
        onChange={(v) => onChange({ ...config, parallel: v })}
        label="Run iterations in parallel"
      />
    </div>
  );
}

// ─── TriggerConfigForm ───────────────────────────────────────────────────────

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
];

function TriggerConfigForm({
  trigger,
  onChange,
}: {
  trigger: TriggerConfig;
  onChange: (updates: Partial<TriggerConfig>) => void;
}) {
  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/${trigger.id}`
      : `/api/webhooks/${trigger.id}`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl).catch(() => {});
  };

  const config = trigger.config as Record<string, unknown>;
  const updateConfig = (key: string, value: unknown) => {
    onChange({ config: { ...trigger.config, [key]: value } });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Trigger Type</Label>
        <Select
          value={trigger.type}
          onChange={(v) => onChange({ type: v as TriggerType })}
          options={[
            { label: 'Manual', value: 'manual' },
            { label: 'Webhook', value: 'webhook' },
            { label: 'Schedule', value: 'schedule' },
            { label: 'Polling', value: 'polling' },
            { label: 'App Event', value: 'app-event' },
            { label: 'Sub-workflow', value: 'sub-workflow' },
          ]}
        />
      </div>

      {trigger.type === 'manual' && (
        <div className="bg-gray-900/50 rounded-md p-3 border border-gray-700">
          <p className="text-xs text-gray-400">
            This workflow will run manually from the dashboard or via API. No additional configuration needed.
          </p>
        </div>
      )}

      {trigger.type === 'webhook' && (
        <div className="space-y-3">
          <div>
            <Label>Webhook URL</Label>
            <div className="flex gap-2 mt-1">
              <input
                readOnly
                value={webhookUrl}
                className="flex-1 bg-gray-950 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-gray-300 font-mono"
              />
              <button
                onClick={copyWebhookUrl}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded-md transition-colors shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Send a POST request to this URL to trigger the workflow.
          </p>
        </div>
      )}

      {trigger.type === 'schedule' && (
        <div className="space-y-3">
          <div>
            <Label>Cron Expression</Label>
            <Input
              value={String(config.cron ?? '0 9 * * *')}
              onChange={(v) => updateConfig('cron', v)}
              placeholder="0 9 * * * (every day at 9am)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: minute hour day month weekday
            </p>
          </div>
          <div>
            <Label>Timezone</Label>
            <Select
              value={String(config.timezone ?? 'UTC')}
              onChange={(v) => updateConfig('timezone', v)}
              options={TIMEZONES.map((tz) => ({ label: tz, value: tz }))}
            />
          </div>
        </div>
      )}

      {trigger.type === 'polling' && (
        <div className="space-y-3">
          <div>
            <Label>Poll Interval (minutes)</Label>
            <Input
              type="number"
              value={String(config.intervalMinutes ?? 15)}
              onChange={(v) => updateConfig('intervalMinutes', Number(v))}
              placeholder="15"
            />
          </div>
        </div>
      )}

      {trigger.type === 'app-event' && (
        <div>
          <Label>Event Key</Label>
          <Input
            value={trigger.eventKey}
            onChange={(v) => onChange({ eventKey: v })}
            placeholder="e.g. new_email, new_row"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main StepConfigPanel ────────────────────────────────────────────────────

export default function StepConfigPanel() {
  const {
    selectedNodeId,
    sidebarPanel,
    workflow,
    setSidebarPanel,
    updateStep,
    updateTrigger,
    removeStep,
  } = useWorkflowStore();

  const isOpen = sidebarPanel === 'step-config' && selectedNodeId !== null;

  // Find selected node data
  const isTrigger = workflow?.trigger?.id === selectedNodeId;
  const trigger: TriggerConfig | null = isTrigger ? workflow!.trigger : null;
  const step: StepConfig | null =
    !isTrigger && workflow
      ? workflow.steps.find((s) => s.id === selectedNodeId) ?? null
      : null;

  const node = trigger ?? step;

  // Step name / description update handlers
  const handleNameChange = useCallback(
    (value: string) => {
      if (!selectedNodeId) return;
      if (isTrigger) {
        // TriggerConfig has no name field; store it in config
        updateTrigger({ config: { ...(trigger?.config ?? {}), _name: value } });
      } else if (step) {
        updateStep(selectedNodeId, { name: value });
      }
    },
    [selectedNodeId, isTrigger, step, trigger, updateStep, updateTrigger]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      if (!selectedNodeId) return;
      if (!isTrigger && step) {
        updateStep(selectedNodeId, { description: value });
      }
    },
    [selectedNodeId, isTrigger, step, updateStep]
  );

  const handleDelete = useCallback(() => {
    if (!selectedNodeId || isTrigger) return;
    removeStep(selectedNodeId);
  }, [selectedNodeId, isTrigger, removeStep]);

  const handleClose = useCallback(() => {
    setSidebarPanel('none');
  }, [setSidebarPanel]);

  // Config change handler for steps
  const handleStepConfigChange = useCallback(
    (newConfig: StepConfig['config']) => {
      if (!selectedNodeId || !step) return;
      updateStep(selectedNodeId, { config: newConfig });
    },
    [selectedNodeId, step, updateStep]
  );

  // Derive display name
  const displayName = step
    ? step.name
    : isTrigger && trigger
    ? String(trigger.config._name ?? 'Trigger')
    : '';

  const nodeType: StepType | 'trigger' = step
    ? step.type
    : 'trigger';

  const icon = STEP_ICONS[nodeType] ?? '⚙️';

  if (!isOpen || !node) return null;

  return (
    <div
      className="h-full w-[420px] shrink-0 flex flex-col bg-gray-800 border-l border-gray-700 overflow-hidden"
      style={{ minWidth: 420, maxWidth: 420 }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{icon}</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="flex-1 bg-transparent text-white font-semibold text-base focus:outline-none focus:border-b focus:border-[#C9A227] placeholder-gray-500 truncate"
            placeholder="Step name"
          />
          <button
            onClick={handleClose}
            className="shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
            title="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step && (
          <textarea
            value={step.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="mt-2 w-full bg-transparent text-sm text-gray-400 placeholder-gray-600 focus:outline-none resize-none"
          />
        )}
      </div>

      {/* ── Config Form ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Trigger */}
        {isTrigger && trigger && (
          <TriggerConfigForm
            trigger={trigger}
            onChange={(updates) => updateTrigger(updates)}
          />
        )}

        {/* Step forms */}
        {step && step.config.type === 'filter' && (
          <FilterConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'delay' && (
          <DelayConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'http' && (
          <HttpConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'ai' && (
          <AiConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'code' && (
          <CodeConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'action' && (
          <ActionConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'formatter' && (
          <FormatterConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'storage' && (
          <StorageConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'digest' && (
          <DigestConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'sub-workflow' && (
          <SubWorkflowConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'human-in-the-loop' && (
          <HitlConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'error-handler' && (
          <ErrorHandlerConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'path' && (
          <PathConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
        {step && step.config.type === 'loop' && (
          <LoopConfigForm
            config={step.config}
            onChange={handleStepConfigChange}
          />
        )}
      </div>

      {/* ── Footer ── */}
      {!isTrigger && step && (
        <div className="px-4 py-3 border-t border-gray-700 shrink-0 flex gap-2">
          <button
            onClick={handleDelete}
            className="flex-1 py-2 text-sm font-medium rounded-md bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50 hover:text-red-300 transition-colors"
          >
            Delete Step
          </button>
        </div>
      )}
    </div>
  );
}
