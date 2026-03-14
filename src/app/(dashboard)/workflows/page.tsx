'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { WorkflowStatus } from '@/types';
import { cn, timeAgo } from '@/lib/utils';

// Mock data for initial build — replaced by API calls in production
const MOCK_WORKFLOWS = [
  {
    id: 'wf_001',
    name: 'New Lead → Slack + CRM',
    description: 'When a new lead comes in, notify Slack and create CRM record',
    status: 'active' as WorkflowStatus,
    steps: 4,
    lastRun: new Date(Date.now() - 3600000),
    runsToday: 23,
    createdAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'wf_002',
    name: 'Daily Report Generator',
    description: 'Compile daily metrics from multiple sources into a report',
    status: 'active' as WorkflowStatus,
    steps: 6,
    lastRun: new Date(Date.now() - 7200000),
    runsToday: 1,
    createdAt: new Date(Date.now() - 86400000 * 14),
  },
  {
    id: 'wf_003',
    name: 'Invoice Processing Pipeline',
    description: 'Extract data from invoices and update accounting system',
    status: 'draft' as WorkflowStatus,
    steps: 8,
    lastRun: null,
    runsToday: 0,
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
];

const STATUS_STYLES: Record<WorkflowStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
  paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  archived: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' },
};

export default function WorkflowsPage() {
  const [filter, setFilter] = useState<WorkflowStatus | 'all'>('all');

  const filteredWorkflows = filter === 'all'
    ? MOCK_WORKFLOWS
    : MOCK_WORKFLOWS.filter((w) => w.status === filter);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-gray-400 text-sm mt-1">
            {MOCK_WORKFLOWS.length} workflows · {MOCK_WORKFLOWS.filter((w) => w.status === 'active').length} active
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

      {/* Workflow List */}
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
                    <p className="text-white font-medium">{workflow.steps}</p>
                    <p className="text-xs">steps</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{workflow.runsToday}</p>
                    <p className="text-xs">today</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="text-white font-medium">
                      {workflow.lastRun ? timeAgo(workflow.lastRun) : '—'}
                    </p>
                    <p className="text-xs">last run</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium mb-2">No workflows found</p>
          <p className="text-sm">Try a different filter or create a new workflow.</p>
        </div>
      )}
    </div>
  );
}
