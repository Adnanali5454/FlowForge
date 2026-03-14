'use client';

import { useState } from 'react';
import { useWorkflowStore } from '@/hooks/use-workflow-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function EditorToolbar() {
  const {
    workflow,
    isDirty,
    isSaving,
    undo,
    redo,
    undoStack,
    redoStack,
    openStepPicker,
  } = useWorkflowStore();
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  if (!workflow) return null;

  const handleTestRun = async () => {
    try {
      setIsTestRunning(true);
      const response = await fetch('/api/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.id,
          triggerData: {},
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run workflow');
      }

      const data = await response.json();
      toast.success(`Execution started: ${data.execution?.id || 'unknown'}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to run test';
      toast.error(errorMsg);
      console.error('Test run error:', error);
    } finally {
      setIsTestRunning(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish workflow');
      }

      toast.success('Workflow published successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to publish workflow';
      toast.error(errorMsg);
      console.error('Publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-10 h-14 bg-sidebar-bg/90 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4">
      {/* Left: Workflow info */}
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="h-6 w-px bg-gray-700" />
        <div>
          <h2 className="text-sm font-semibold text-white">{workflow.name}</h2>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded font-medium',
              workflow.status === 'draft' ? 'bg-gray-700 text-gray-300' :
              workflow.status === 'active' ? 'bg-green-500/10 text-green-400' :
              'bg-gray-700 text-gray-400'
            )}>
              {workflow.status}
            </span>
            {isDirty && <span className="text-xs text-yellow-500">Unsaved</span>}
          </div>
        </div>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openStepPicker(null)}
          className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
        >
          + Add Step
        </button>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Undo */}
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6M3 13a9 9 0 1 0 2.12-5.88" />
          </svg>
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6M21 13a9 9 0 1 1-2.12-5.88" />
          </svg>
        </button>

        <div className="h-6 w-px bg-gray-700 mx-1" />

        {/* Test Run */}
        <button
          onClick={handleTestRun}
          disabled={isTestRunning}
          className="px-4 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTestRunning ? 'Running...' : 'Test Run'}
        </button>

        {/* Publish */}
        <button
          onClick={handlePublish}
          disabled={isPublishing || isSaving}
          className="px-4 py-1.5 text-sm bg-[#C9A227] text-[#0C2340] font-semibold rounded-lg hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing || isSaving ? 'Saving...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
