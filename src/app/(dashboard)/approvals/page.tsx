'use client';

import { useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  User,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContextData {
  key: string;
  value: string;
}

interface PendingApproval {
  id: string;
  workflowName: string;
  stepName: string;
  requestor: {
    name: string;
    avatar: string;
    email: string;
  };
  requestedAt: string;
  context: ContextData[];
  priority: 'high' | 'medium' | 'low';
}

interface HistoryEntry {
  id: string;
  workflowName: string;
  stepName: string;
  requestor: string;
  decidedBy: string;
  decidedAt: string;
  status: 'approved' | 'rejected';
  comment?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PENDING_APPROVALS: PendingApproval[] = [
  {
    id: 'appr-001',
    workflowName: 'Finance Automation',
    stepName: 'Approve Payment Transfer',
    requestor: { name: 'Sarah Chen', avatar: 'SC', email: 'sarah@acme.com' },
    requestedAt: '12 minutes ago',
    priority: 'high',
    context: [
      { key: 'Amount', value: '$4,200.00' },
      { key: 'Recipient', value: 'Acme Corp' },
      { key: 'Account', value: '****4892' },
      { key: 'Reference', value: 'INV-2026-0441' },
    ],
  },
  {
    id: 'appr-002',
    workflowName: 'User Offboarding',
    stepName: 'Confirm User Deletion',
    requestor: { name: 'Alex Johnson', avatar: 'AJ', email: 'alex@acme.com' },
    requestedAt: '34 minutes ago',
    priority: 'high',
    context: [
      { key: 'User', value: 'john.doe@acme.com' },
      { key: 'Department', value: 'Engineering' },
      { key: 'Data Retention', value: '90 days' },
      { key: 'Access Revoked', value: 'Pending' },
    ],
  },
  {
    id: 'appr-003',
    workflowName: 'Marketing Campaign',
    stepName: 'Authorize Bulk Email Send',
    requestor: { name: 'Marcus Rivera', avatar: 'MR', email: 'marcus@acme.com' },
    requestedAt: '1 hour ago',
    priority: 'medium',
    context: [
      { key: 'Recipients', value: '42,300 contacts' },
      { key: 'Campaign', value: 'Spring Product Launch' },
      { key: 'Scheduled', value: 'Mar 15, 2026 09:00 AM' },
      { key: 'Subject', value: 'Introducing FlowForge 2.0' },
    ],
  },
  {
    id: 'appr-004',
    workflowName: 'Legal Workflow',
    stepName: 'Sign Contract',
    requestor: { name: 'Priya Patel', avatar: 'PP', email: 'priya@acme.com' },
    requestedAt: '2 hours ago',
    priority: 'medium',
    context: [
      { key: 'Contract', value: 'Vendor Agreement v3.pdf' },
      { key: 'Value', value: '$120,000/yr' },
      { key: 'Counterparty', value: 'TechVendor Inc.' },
      { key: 'Expires', value: 'Mar 20, 2026' },
    ],
  },
];

const HISTORY_ENTRIES: HistoryEntry[] = [
  { id: 'h1', workflowName: 'Finance Automation', stepName: 'Approve Refund', requestor: 'sarah@acme.com', decidedBy: 'alex@acme.com', decidedAt: 'Mar 13, 2026 15:30', status: 'approved', comment: 'Verified invoice matches.' },
  { id: 'h2', workflowName: 'User Offboarding', stepName: 'Confirm Deletion', requestor: 'alex@acme.com', decidedBy: 'alex@acme.com', decidedAt: 'Mar 13, 2026 11:05', status: 'approved' },
  { id: 'h3', workflowName: 'Marketing Campaign', stepName: 'Authorize Email Send', requestor: 'marcus@acme.com', decidedBy: 'sarah@acme.com', decidedAt: 'Mar 12, 2026 09:15', status: 'rejected', comment: 'Too many recipients, needs review.' },
  { id: 'h4', workflowName: 'Legal Workflow', stepName: 'Sign NDA', requestor: 'priya@acme.com', decidedBy: 'alex@acme.com', decidedAt: 'Mar 11, 2026 14:00', status: 'approved' },
  { id: 'h5', workflowName: 'Finance Automation', stepName: 'Approve Payment', requestor: 'sarah@acme.com', decidedBy: 'sarah@acme.com', decidedAt: 'Mar 11, 2026 10:22', status: 'rejected', comment: 'Duplicate payment detected.' },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div className={`rounded-xl border ${color} bg-[#0a0a12] p-5 flex items-center gap-4`}>
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// ─── Approval Card ────────────────────────────────────────────────────────────

interface ApprovalCardProps {
  approval: PendingApproval;
  onDecision: (id: string, action: 'approve' | 'reject', comment: string) => void;
}

function ApprovalCard({ approval, onDecision }: ApprovalCardProps) {
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null);

  const handleDecide = (action: 'approve' | 'reject') => {
    setDeciding(action);
    onDecision(approval.id, action, comment);
  };

  const PRIORITY_COLORS = {
    high: 'border-red-500/40',
    medium: 'border-yellow-500/40',
    low: 'border-blue-500/40',
  };

  const PRIORITY_LABEL = {
    high: 'text-red-400 bg-red-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    low: 'text-blue-400 bg-blue-500/10',
  };

  return (
    <div className={`rounded-xl border ${PRIORITY_COLORS[approval.priority]} bg-[#0a0a12] overflow-hidden`}>
      {/* Top section */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_LABEL[approval.priority]}`}>
                {approval.priority} priority
              </span>
            </div>
            <h3 className="text-white font-semibold text-base">{approval.workflowName}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ChevronRight size={12} className="text-gray-500" />
              <p className="text-sm text-gray-400">{approval.stepName}</p>
            </div>
          </div>
          <a
            href={`/workflows`}
            className="flex items-center gap-1.5 text-xs text-[#C9A227] hover:underline"
          >
            <ExternalLink size={12} />
            View Workflow
          </a>
        </div>

        {/* Requestor */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-xs font-bold text-[#C9A227]">
            {approval.requestor.avatar}
          </div>
          <div>
            <span className="text-sm text-white">{approval.requestor.name}</span>
            <span className="text-xs text-gray-500 ml-2">requested {approval.requestedAt}</span>
          </div>
        </div>

        {/* Context data */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#0f0f1a] border border-[#1f1f35]">
          {approval.context.map((item) => (
            <div key={item.key} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500">{item.key}</span>
              <span className="text-sm text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5">
        {showComment && (
          <div className="mb-3">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              placeholder="Add a comment (optional)..."
              className="w-full px-3 py-2 bg-[#0f0f1a] border border-[#1f1f35] rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] transition-colors resize-none"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDecide('approve')}
            disabled={deciding !== null}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle size={15} />
            {deciding === 'approve' ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => handleDecide('reject')}
            disabled={deciding !== null}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600/80 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle size={15} />
            {deciding === 'reject' ? 'Rejecting...' : 'Reject'}
          </button>
          <button
            onClick={() => setShowComment(v => !v)}
            className="p-2 text-gray-500 hover:text-[#C9A227] transition-colors border border-[#1f1f35] rounded-lg"
            title="Add comment"
          >
            <MessageSquare size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'mine';

export default function ApprovalsPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(PENDING_APPROVALS);
  const [history, setHistory] = useState<HistoryEntry[]>(HISTORY_ENTRIES);

  const approvedToday = history.filter(h => h.status === 'approved' && h.decidedAt.startsWith('Mar 14')).length;
  const rejectedToday = history.filter(h => h.status === 'rejected' && h.decidedAt.startsWith('Mar 14')).length;

  const handleDecision = async (id: string, action: 'approve' | 'reject', comment: string) => {
    const approval = pendingApprovals.find(a => a.id === id);
    if (!approval) return;

    try {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId: id, action, comment }),
      });
    } catch {
      // optimistic UI regardless
    }

    const newHistoryEntry: HistoryEntry = {
      id: `h${Date.now()}`,
      workflowName: approval.workflowName,
      stepName: approval.stepName,
      requestor: approval.requestor.email,
      decidedBy: 'alex@acme.com',
      decidedAt: 'Mar 14, 2026 (just now)',
      status: action === 'approve' ? 'approved' : 'rejected',
      comment: comment || undefined,
    };

    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    setHistory(prev => [newHistoryEntry, ...prev]);
  };

  const displayed = filterTab === 'all'
    ? pendingApprovals
    : pendingApprovals.filter(a => a.requestor.email === 'alex@acme.com');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Approvals</h1>
          {pendingApprovals.length > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
              {pendingApprovals.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-[#0a0a12] border border-[#1f1f35] rounded-lg p-1">
          {(['all', 'mine'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterTab === tab
                  ? 'bg-[#C9A227] text-[#0C2340]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Approvals' : 'Assigned to Me'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending"
          value={pendingApprovals.length}
          color="border-orange-500/30"
          icon={<Clock size={22} className="text-orange-400" />}
        />
        <StatCard
          label="Approved Today"
          value={approvedToday}
          color="border-green-500/30"
          icon={<CheckCircle size={22} className="text-green-400" />}
        />
        <StatCard
          label="Rejected Today"
          value={rejectedToday}
          color="border-red-500/30"
          icon={<XCircle size={22} className="text-red-400" />}
        />
        <StatCard
          label="Avg Response"
          value="18 min"
          color="border-blue-500/30"
          icon={<Clock size={22} className="text-blue-400" />}
        />
      </div>

      {/* Approval queue */}
      {displayed.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 mb-10 md:grid-cols-2">
          {displayed.map(approval => (
            <ApprovalCard key={approval.id} approval={approval} onDecision={handleDecision} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#1f1f35] bg-[#0a0a12] py-16 flex flex-col items-center justify-center mb-10">
          <CheckCircle size={40} className="text-green-500 mb-3 opacity-60" />
          <p className="text-white font-medium">All caught up!</p>
          <p className="text-sm text-gray-500 mt-1">No pending approvals{filterTab === 'mine' ? ' assigned to you' : ''}.</p>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Approval History</h2>
        <div className="rounded-xl border border-[#1f1f35] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f35] bg-[#0a0a12]">
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Workflow / Step</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Requestor</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Decided By</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Comment</th>
              </tr>
            </thead>
            <tbody>
              {history.map(entry => (
                <tr key={entry.id} className="border-b border-[#1f1f35]/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-white">{entry.workflowName}</p>
                    <p className="text-xs text-gray-500">{entry.stepName}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-gray-500" />
                      <span className="text-sm text-gray-400">{entry.requestor}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{entry.decidedBy}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{entry.decidedAt}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      entry.status === 'approved'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {entry.status === 'approved'
                        ? <CheckCircle size={10} />
                        : <XCircle size={10} />
                      }
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[200px] truncate">
                    {entry.comment ?? <span className="text-gray-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
