'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
  TextareaHTMLAttributes,
  InputHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariableAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  stepOutputs?: Record<string, string[]>;
  className?: string;
  disabled?: boolean;
}

interface VariableGroup {
  stepId: string;
  label: string;
  fields: string[];
}

interface DropdownPosition {
  top: number;
  left: number;
}

// ─── Default step outputs ────────────────────────────────────────────────────

const DEFAULT_STEP_OUTPUTS: Record<string, string[]> = {
  trigger: ['email', 'subject', 'body', 'from', 'receivedAt', 'id', 'amount', 'currency', 'status'],
  step_1: ['id', 'status', 'output', 'error', 'durationMs'],
  step_2: ['id', 'status', 'output', 'error', 'durationMs'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGroups(stepOutputs: Record<string, string[]>): VariableGroup[] {
  return Object.entries(stepOutputs).map(([stepId, fields]) => ({
    stepId,
    label:
      stepId === 'trigger'
        ? 'Trigger'
        : stepId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    fields,
  }));
}

function getCaretCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number
): { top: number; left: number } {
  const rect = element.getBoundingClientRect();
  // Approximate: just place below the element for inputs
  return { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX };
}

function findTriggerStart(text: string, cursorPos: number): number {
  // Look back for `{{` or lone `{`
  const before = text.slice(0, cursorPos);
  const doubleBrace = before.lastIndexOf('{{');
  if (doubleBrace !== -1 && doubleBrace >= cursorPos - 30) {
    const between = before.slice(doubleBrace + 2);
    if (!between.includes('}}')) return doubleBrace;
  }
  const singleBrace = before.lastIndexOf('{');
  if (singleBrace !== -1 && singleBrace >= cursorPos - 30) {
    const between = before.slice(singleBrace + 1);
    if (!between.includes('}') && !between.includes('{')) return singleBrace;
  }
  return -1;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VariableAutocomplete({
  value,
  onChange,
  placeholder,
  multiline = false,
  stepOutputs,
  className,
  disabled = false,
}: VariableAutocompleteProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerStart, setTriggerStart] = useState(-1);

  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mergedOutputs = { ...DEFAULT_STEP_OUTPUTS, ...(stepOutputs ?? {}) };
  const groups = buildGroups(mergedOutputs);

  // Flatten groups filtered by search
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter(
        (field) =>
          searchQuery === '' ||
          field.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.stepId.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((g) => g.fields.length > 0);

  // Flat list for keyboard navigation
  const flatItems: { stepId: string; field: string }[] = filteredGroups.flatMap((g) =>
    g.fields.map((f) => ({ stepId: g.stepId, field: f }))
  );

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
    setSearchQuery('');
    setTriggerStart(-1);
    setActiveIndex(0);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [closeDropdown]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPos = e.target.selectionStart ?? newValue.length;
    const start = findTriggerStart(newValue, cursorPos);

    if (start !== -1) {
      // Extract what the user typed after the brace(s)
      const afterBrace = newValue.slice(start + (newValue[start + 1] === '{' ? 2 : 1), cursorPos);
      setSearchQuery(afterBrace.replace(/\s/g, ''));
      setTriggerStart(start);
      setActiveIndex(0);

      // Position dropdown
      const el = inputRef.current;
      if (el) {
        const pos = getCaretCoordinates(el, cursorPos);
        setDropdownPos(pos);
      }
      setDropdownOpen(true);
    } else {
      closeDropdown();
    }
  };

  const insertVariable = (stepId: string, field: string) => {
    if (triggerStart === -1) return;

    const cursorPos = (inputRef.current?.selectionStart ?? value.length);
    const before = value.slice(0, triggerStart);
    const after = value.slice(cursorPos);
    const insertion = `{{ ${stepId}.${field} }}`;

    const newValue = before + insertion + after;
    onChange(newValue);

    // Re-focus and set cursor after insertion
    setTimeout(() => {
      if (inputRef.current) {
        const newCursor = before.length + insertion.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);

    closeDropdown();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!dropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) insertVariable(item.stepId, item.field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    }
  };

  // Shared props
  const sharedProps = {
    ref: inputRef as React.RefObject<HTMLTextAreaElement & HTMLInputElement>,
    value,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    placeholder,
    disabled,
    className: cn(
      'w-full bg-[#1a1a2e] border border-[#2d2d4d] rounded-lg',
      'px-3 py-2 text-sm text-white placeholder-gray-500',
      'focus:outline-none focus:border-[#C9A227]/50 transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className
    ),
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          {...(sharedProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={3}
          className={cn(sharedProps.className, 'resize-y min-h-[72px]')}
        />
      ) : (
        <input
          {...(sharedProps as InputHTMLAttributes<HTMLInputElement>)}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
        />
      )}

      {/* Autocomplete Dropdown */}
      {dropdownOpen && flatItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-64 rounded-xl border border-[#2d2d4d] bg-[#1a1a2e] shadow-xl overflow-hidden"
          style={{ top: '100%', left: 0 }}
        >
          <div className="py-1 max-h-56 overflow-y-auto">
            {filteredGroups.map((group) => {
              const groupFlatStart = flatItems.findIndex((i) => i.stepId === group.stepId);
              return (
                <div key={group.stepId}>
                  {/* Group header */}
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0 bg-[#1a1a2e]">
                    {group.label}
                  </div>
                  {/* Fields */}
                  {group.fields.map((field, fieldIndex) => {
                    const flatIdx = groupFlatStart + fieldIndex;
                    const isActive = flatIdx === activeIndex;
                    return (
                      <button
                        key={`${group.stepId}.${field}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertVariable(group.stepId, field);
                        }}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors',
                          isActive ? 'bg-[#C9A227]/10' : 'hover:bg-white/5'
                        )}
                      >
                        <code
                          className={cn(
                            'text-xs font-mono',
                            isActive ? 'text-[#C9A227]' : 'text-gray-300'
                          )}
                        >
                          {'{{ '}
                          <span className="text-blue-400">{group.stepId}</span>
                          <span className="text-gray-500">.</span>
                          <span className={isActive ? 'text-[#C9A227]' : 'text-green-400'}>
                            {field}
                          </span>
                          {' }}'}
                        </code>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="px-3 py-1.5 border-t border-[#2d2d4d] text-[10px] text-gray-600 flex gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VariableAutocomplete;
