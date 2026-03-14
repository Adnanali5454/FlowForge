'use client';

import { useState } from 'react';
import { useWorkflowStore } from '@/hooks/use-workflow-store';
import type { StepType } from '@/types';
import { cn } from '@/lib/utils';

interface StepOption {
  type: StepType;
  label: string;
  description: string;
  icon: string;
  category: 'flow' | 'utility' | 'ai' | 'connector';
}

const STEP_OPTIONS: StepOption[] = [
  { type: 'action', label: 'Action', description: 'Execute an app action', icon: '▶️', category: 'connector' },
  { type: 'filter', label: 'Filter', description: 'Continue only when conditions are met', icon: '🔍', category: 'flow' },
  { type: 'path', label: 'Path', description: 'Branch into different paths by rules', icon: '🔀', category: 'flow' },
  { type: 'delay', label: 'Delay', description: 'Pause workflow for a set duration', icon: '⏳', category: 'flow' },
  { type: 'loop', label: 'Loop', description: 'Repeat steps for each item in a list', icon: '🔄', category: 'flow' },
  { type: 'formatter', label: 'Formatter', description: 'Transform text, numbers, or dates', icon: '🔧', category: 'utility' },
  { type: 'code', label: 'Code', description: 'Run JavaScript or Python code', icon: '💻', category: 'utility' },
  { type: 'http', label: 'HTTP Request', description: 'Make a GET, POST, PUT, or DELETE request', icon: '🌐', category: 'utility' },
  { type: 'ai', label: 'AI', description: 'Generate, classify, extract, or transform with AI', icon: '🧠', category: 'ai' },
  { type: 'human-in-the-loop', label: 'Approval', description: 'Pause for human review and approval', icon: '👤', category: 'flow' },
  { type: 'sub-workflow', label: 'Sub-Workflow', description: 'Call another workflow as a reusable component', icon: '📦', category: 'flow' },
  { type: 'digest', label: 'Digest', description: 'Batch data from multiple runs into one', icon: '📋', category: 'utility' },
  { type: 'storage', label: 'Storage', description: 'Store or retrieve a value across runs', icon: '💾', category: 'utility' },
  { type: 'error-handler', label: 'Error Handler', description: 'Define error recovery behavior', icon: '🛡️', category: 'flow' },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'flow', label: 'Flow Control' },
  { key: 'utility', label: 'Utilities' },
  { key: 'ai', label: 'AI' },
  { key: 'connector', label: 'Apps' },
] as const;

export default function StepPicker() {
  const { stepPickerOpen, stepPickerInsertAfter, closeStepPicker, addStep } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  if (!stepPickerOpen) return null;

  const filtered = STEP_OPTIONS.filter((opt) => {
    const matchesSearch = search === '' ||
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || opt.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={closeStepPicker} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[520px] max-h-[600px] bg-sidebar-bg border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Add Step</h3>
          <input
            type="text"
            placeholder="Search steps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#C9A227] transition-colors"
          />

          {/* Category tabs */}
          <div className="flex gap-1 mt-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  category === cat.key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step list */}
        <div className="overflow-y-auto max-h-[400px] p-2">
          {filtered.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                addStep(opt.type, stepPickerInsertAfter);
                setSearch('');
                setCategory('all');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left group"
            >
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-[#C9A227] transition-colors">
                  {opt.label}
                </p>
                <p className="text-xs text-gray-400 truncate">{opt.description}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8 text-sm">No steps match your search</p>
          )}
        </div>
      </div>
    </>
  );
}
