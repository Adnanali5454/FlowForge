'use client';

import { useState, useEffect } from 'react';
import type { ExecutionStatus } from '@/types';
import { cn, formatDuration, timeAgo } from '@/lib/utils';

interface Execution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  stepsExecuted: number;
  stepsTotal: number;
  durationMs: number | null;
  startedAt: string;
  error: string | null;
}

const STATUS_CONFIG: Record<ExecutionStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  running: { label: 'Running', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  success: { label: 'Success', color: 'text-green-400', bg: 'bg-green-500/10' },
  error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/10' },
  waiting: { label: 'Awaiting Approval', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  cancelled: { label: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  retrying: { label: 'Retrying', color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/executions');

        if (!response.ok) {
          throw new Error('Failed to fetch executions');
        }

        const data = await response.json();
        setExecutions(data.executions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching executions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExecutions();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Execution History</h1>
        <p className="text-gray-400 text-sm mt-1">
          Real-time log of all workflow executions across your workspace
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/50 bg-red-500/10 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Execution Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workflow ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Steps</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-4">
                    <div className="h-3 bg-gray-700 rounded w-24" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-3 bg-gray-700 rounded w-20" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-3 bg-gray-700 rounded w-12" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-3 bg-gray-700 rounded w-16" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-3 bg-gray-700 rounded w-20" />
                  </td>
                </tr>
              ))
            ) : executions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                  <p className="text-sm font-medium mb-1">No executions yet</p>
                  <p className="text-xs">Run a workflow to see execution history</p>
                </td>
              </tr>
            ) : (
              executions.map((exec) => {
                const statusConf = STATUS_CONFIG[exec.status];
                return (
                  <tr key={exec.id} className="hover:bg-gray-800/30 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{exec.workflowId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{exec.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConf.bg, statusConf.color)}>
                        {exec.status === 'running' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        )}
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300">{exec.stepsExecuted}/{exec.stepsTotal}</td>
                    <td className="px-5 py-4 text-sm text-gray-300 font-mono">
                      {exec.durationMs ? formatDuration(exec.durationMs) : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{timeAgo(new Date(exec.startedAt))}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
