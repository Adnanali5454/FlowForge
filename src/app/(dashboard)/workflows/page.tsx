'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { WorkflowStatus, WorkflowDefinition } from '@/types';
import { cn, timeAgo } from '@/lib/utils';

interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: string[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<WorkflowStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
  paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  archived: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' },
};

export default function WorkflowsPage() {
  const [filter, setFilter] = useState<WorkflowStatus | 'all'>('all');
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/workflows');

        if (!response.ok) {
          throw new Error('Failed to fetch workflows');
        }

        const data = await response.json();
        setWorkflows(data.workflows || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching workflows:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  const filteredWorkflows = filter === 'all'
    ? workflows
    : workflows.filter((w) => w.status === filter);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-gray-400 text-sm mt-1">
            {workflows.length} workflows · {workflows.filter((w) => w.status === 'active').length} active
          </p>
        </div>
        <Link
          href="/editor/new"
          className="px-5 py-2.5 bg-[#C9A227] text-[#0C2340] font-semibold rounded-lg hover:bg-[#D4AF37] transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          New Workflow
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'draft', 'paused', 'error'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
              filter === status
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-2/3 mb-4" />
              <div className="flex gap-6">
                <div className="h-3 bg-gray-700 rounded w-12" />
                <div className="h-3 bg-gray-700 rounded w-12" />
                <div className="h-3 bg-gray-700 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Workflow List */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {filteredWorkflows.map((workflow) => {
            const style = STATUS_STYLES[workflow.status];
            return (
              <Link
                key={workflow.id}
                href={`/editor/${workflow.id}`}
                className="block glass rounded-xl p-5 hover:border-gray-600 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-white group-hover:text-[#C9A227] transition-colors">
                        {workflow.name}
                      </h3>
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', style.bg, style.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{workflow.description}</p>
                  </div>

                  <div className="flex items-center gap-6 ml-6 text-sm text-gray-400">
                    <div className="text-center">
                      <p className="text-white font-medium">{workflow.steps.length}</p>
                      <p className="text-xs">steps</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">—</p>
                      <p className="text-xs">today</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p className="text-white font-medium">—</p>
                      <p className="text-xs">last run</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!isLoading && !error && filteredWorkflows.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium mb-2">No workflows found</p>
          <p className="text-sm">Try a different filter or create a new workflow.</p>
        </div>
      )}
    </div>
  );
}
