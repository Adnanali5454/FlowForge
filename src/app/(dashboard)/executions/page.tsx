'use client';

import type { ExecutionStatus } from '@/types';
import { cn, formatDuration, timeAgo } from '@/lib/utils';

const MOCK_EXECUTIONS = [
  { id: 'ex_001', workflowName: 'New Lead → Slack + CRM', status: 'success' as ExecutionStatus, steps: 4, duration: 2340, startedAt: new Date(Date.now() - 600000) },
  { id: 'ex_002', workflowName: 'New Lead → Slack + CRM', status: 'success' as ExecutionStatus, steps: 4, duration: 1890, startedAt: new Date(Date.now() - 1200000) },
  { id: 'ex_003', workflowName: 'Daily Report Generator', status: 'success' as ExecutionStatus, steps: 6, duration: 14500, startedAt: new Date(Date.now() - 7200000) },
  { id: 'ex_004', workflowName: 'Invoice Processing', status: 'error' as ExecutionStatus, steps: 3, duration: 5200, startedAt: new Date(Date.now() - 14400000), error: 'API rate limit exceeded' },
  { id: 'ex_005', workflowName: 'New Lead → Slack + CRM', status: 'running' as ExecutionStatus, steps: 2, duration: 0, startedAt: new Date() },
];

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
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Execution History</h1>
        <p className="text-gray-400 text-sm mt-1">
          Real-time log of all workflow executions across your workspace
        </p>
      </div>

      {/* Execution Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workflow</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Steps</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {MOCK_EXECUTIONS.map((exec) => {
              const statusConf = STATUS_CONFIG[exec.status];
              return (
                <tr key={exec.id} className="hover:bg-gray-800/30 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{exec.workflowName}</p>
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
                  <td className="px-5 py-4 text-sm text-gray-300">{exec.steps}</td>
                  <td className="px-5 py-4 text-sm text-gray-300 font-mono">
                    {exec.duration > 0 ? formatDuration(exec.duration) : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">{timeAgo(exec.startedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
