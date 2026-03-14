'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { StepConfig, TriggerConfig, StepType } from '@/types';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/hooks/use-workflow-store';

// ─── Step Type Visual Config ────────────────────────────────────────────────

const STEP_VISUALS: Record<StepType, { icon: string; color: string; label: string }> = {
  trigger: { icon: '⚡', color: 'border-yellow-500', label: 'Trigger' },
  action: { icon: '▶️', color: 'border-blue-500', label: 'Action' },
  filter: { icon: '🔍', color: 'border-purple-500', label: 'Filter' },
  path: { icon: '🔀', color: 'border-indigo-500', label: 'Path' },
  delay: { icon: '⏳', color: 'border-orange-500', label: 'Delay' },
  loop: { icon: '🔄', color: 'border-cyan-500', label: 'Loop' },
  formatter: { icon: '🔧', color: 'border-teal-500', label: 'Formatter' },
  code: { icon: '💻', color: 'border-emerald-500', label: 'Code' },
  http: { icon: '🌐', color: 'border-sky-500', label: 'HTTP' },
  ai: { icon: '🧠', color: 'border-violet-500', label: 'AI' },
  'human-in-the-loop': { icon: '👤', color: 'border-amber-500', label: 'Approval' },
  'sub-workflow': { icon: '📦', color: 'border-pink-500', label: 'Sub-Workflow' },
  digest: { icon: '📋', color: 'border-lime-500', label: 'Digest' },
  storage: { icon: '💾', color: 'border-rose-500', label: 'Storage' },
  'error-handler': { icon: '🛡️', color: 'border-red-500', label: 'Error Handler' },
};

// ─── Trigger Node ───────────────────────────────────────────────────────────

export const TriggerNode = memo(function TriggerNode({ data, selected }: NodeProps) {
  const trigger = data as TriggerConfig;
  const visual = STEP_VISUALS.trigger;

  return (
    <div
      className={cn(
        'bg-canvas-node rounded-xl border-2 shadow-lg transition-all min-w-[280px]',
        selected ? 'border-[#C9A227] shadow-[#C9A227]/20' : 'border-dashed border-gray-600 hover:border-gray-500',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/50">
        <span className="text-xl">{visual.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
            Trigger
          </p>
          <p className="text-sm text-white font-medium truncate">
            {trigger.eventKey === 'manual_trigger'
              ? 'Manual Trigger'
              : trigger.eventKey || 'Select a trigger...'}
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">
          {trigger.type}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-xs text-gray-400">
          {trigger.type === 'manual' && 'Click "Run" to trigger this workflow'}
          {trigger.type === 'webhook' && 'Listening for incoming webhook data'}
          {trigger.type === 'schedule' && 'Runs on a recurring schedule'}
          {trigger.type === 'polling' && 'Polling for new data'}
          {trigger.type === 'app-event' && 'Triggered by app event'}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#C9A227] !w-3 !h-3 !border-2 !border-canvas-bg" />
    </div>
  );
});

// ─── Step Node ──────────────────────────────────────────────────────────────

export const StepNode = memo(function StepNode({ data, selected }: NodeProps) {
  const step = data as StepConfig;
  const visual = STEP_VISUALS[step.type] ?? STEP_VISUALS.action;
  const isConfigured = step.actionKey || step.name !== visual.label;

  return (
    <div
      className={cn(
        'bg-canvas-node rounded-xl border-2 shadow-lg transition-all min-w-[280px]',
        selected
          ? 'border-[#C9A227] shadow-[#C9A227]/20'
          : isConfigured
            ? `border-solid ${visual.color} border-opacity-50 hover:border-opacity-100`
            : 'border-dashed border-gray-600 hover:border-gray-500',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-500 !w-3 !h-3 !border-2 !border-canvas-bg" />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/50">
        <span className="text-xl">{visual.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {visual.label}
          </p>
          <p className="text-sm text-white font-medium truncate">
            {step.name || `Configure ${visual.label}...`}
          </p>
        </div>
      </div>

      {/* Body */}
      {step.description && (
        <div className="px-4 py-2">
          <p className="text-xs text-gray-400 truncate">{step.description}</p>
        </div>
      )}

      {/* Error handling indicator */}
      {step.errorHandling.maxRetries > 0 && (
        <div className="px-4 py-2 border-t border-gray-700/50">
          <p className="text-[10px] text-gray-500">
            🔄 {step.errorHandling.maxRetries} retries · {step.errorHandling.retryBackoff}
          </p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#C9A227] !w-3 !h-3 !border-2 !border-canvas-bg" />
    </div>
  );
});

// ─── Add Step Button Node ───────────────────────────────────────────────────

export const AddStepNode = memo(function AddStepNode({ data }: NodeProps) {
  const afterStepId = (data as { afterStepId: string }).afterStepId ?? null;
  const { openStepPicker } = useWorkflowStore();

  return (
    <div className="flex justify-center">
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <button
        onClick={() => openStepPicker(afterStepId)}
        className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:bg-[#C9A227] hover:text-[#0C2340] hover:border-[#C9A227] transition-all"
        title="Add step"
      >
        <span className="text-lg font-light">+</span>
      </button>
    </div>
  );
});

// ─── Node Types Export ──────────────────────────────────────────────────────

export const nodeTypes = {
  trigger: TriggerNode,
  step: StepNode,
  addStep: AddStepNode,
};
