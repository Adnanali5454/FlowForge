'use client';

import { useState } from 'react';
import {
  Check,
  X,
  UserPlus,
  Trash2,
  ShieldOff,
  ChevronDown,
  Search,
  Filter,
  Key,
  Monitor,
  MapPin,
  Clock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = 'owner' | 'admin' | 'editor' | 'viewer';
type MemberStatus = 'active' | 'invited' | 'suspended';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  avatar: string;
  joinedAt: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ip: string;
  status: 'success' | 'failed';
}

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@acme.com', role: 'owner', status: 'active', avatar: 'AJ', joinedAt: 'Jan 2024' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@acme.com', role: 'admin', status: 'active', avatar: 'SC', joinedAt: 'Feb 2024' },
  { id: '3', name: 'Marcus Rivera', email: 'marcus@acme.com', role: 'editor', status: 'active', avatar: 'MR', joinedAt: 'Mar 2024' },
  { id: '4', name: 'Priya Patel', email: 'priya@acme.com', role: 'viewer', status: 'invited', avatar: 'PP', joinedAt: 'Mar 2026' },
  { id: '5', name: 'Tom Wilson', email: 'tom@acme.com', role: 'editor', status: 'suspended', avatar: 'TW', joinedAt: 'Nov 2023' },
];

const MOCK_AUDIT: AuditEntry[] = [
  { id: '1', timestamp: '2026-03-14 09:42:11', user: 'alex@acme.com', action: 'User Logged In', resource: 'Auth', ip: '192.168.1.1', status: 'success' },
  { id: '2', timestamp: '2026-03-14 09:38:05', user: 'sarah@acme.com', action: 'Workflow Created', resource: 'workflows/payment-sync', ip: '10.0.0.42', status: 'success' },
  { id: '3', timestamp: '2026-03-14 09:15:30', user: 'alex@acme.com', action: 'Member Invited', resource: 'members/priya@acme.com', ip: '192.168.1.1', status: 'success' },
  { id: '4', timestamp: '2026-03-14 08:55:00', user: 'marcus@acme.com', action: 'Connection Updated', resource: 'connections/stripe-prod', ip: '172.16.0.5', status: 'success' },
  { id: '5', timestamp: '2026-03-14 08:30:22', user: 'tom@acme.com', action: 'Workflow Deleted', resource: 'workflows/old-sync', ip: '203.0.113.9', status: 'success' },
  { id: '6', timestamp: '2026-03-13 17:12:44', user: 'sarah@acme.com', action: 'API Key Created', resource: 'api-keys/ci-deploy', ip: '10.0.0.42', status: 'success' },
  { id: '7', timestamp: '2026-03-13 16:48:19', user: 'unknown@attacker.com', action: 'User Login Attempt', resource: 'Auth', ip: '198.51.100.0', status: 'failed' },
  { id: '8', timestamp: '2026-03-13 15:05:33', user: 'alex@acme.com', action: 'Role Changed', resource: 'members/tom@acme.com', ip: '192.168.1.1', status: 'success' },
  { id: '9', timestamp: '2026-03-13 12:22:01', user: 'marcus@acme.com', action: 'Workflow Executed', resource: 'workflows/invoice-gen', ip: '172.16.0.5', status: 'success' },
  { id: '10', timestamp: '2026-03-13 10:00:00', user: 'sarah@acme.com', action: 'Billing Updated', resource: 'billing/plan', ip: '10.0.0.42', status: 'success' },
];

const MOCK_SESSIONS: Session[] = [
  { id: '1', device: 'Chrome / macOS', location: 'San Francisco, US', lastActive: '2 minutes ago', current: true },
  { id: '2', device: 'Safari / iPhone', location: 'San Francisco, US', lastActive: '1 hour ago', current: false },
  { id: '3', device: 'Firefox / Windows', location: 'New York, US', lastActive: '3 days ago', current: false },
];

const MOCK_API_KEYS: ApiKey[] = [
  { id: '1', name: 'CI/CD Pipeline', prefix: 'ff_live_k8xP...', created: 'Mar 13, 2026', lastUsed: '2 hours ago' },
  { id: '2', name: 'Webhook Receiver', prefix: 'ff_live_9mNq...', created: 'Feb 20, 2026', lastUsed: '1 day ago' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<Role, string> = {
  owner: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  admin: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  editor: 'bg-green-500/20 text-green-300 border border-green-500/30',
  viewer: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  active: 'bg-green-500/20 text-green-400',
  invited: 'bg-yellow-500/20 text-yellow-400',
  suspended: 'bg-red-500/20 text-red-400',
};

const ROLE_LABELS: Role[] = ['owner', 'admin', 'editor', 'viewer'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[role]}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: MemberStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}

// ─── Tab: Members ─────────────────────────────────────────────────────────────

function MembersTab() {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('viewer');

  const changeRole = (id: string, role: Role) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const toggleSuspend = (id: string) => {
    setMembers(prev => prev.map(m =>
      m.id === id
        ? { ...m, status: m.status === 'suspended' ? 'active' : 'suspended' as MemberStatus }
        : m
    ));
  };

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    const newMember: Member = {
      id: String(Date.now()),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'invited',
      avatar: inviteEmail.slice(0, 2).toUpperCase(),
      joinedAt: 'Mar 2026',
    };
    setMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    setInviteRole('viewer');
    setShowInvite(false);
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">{members.length} members</p>
        <button
          onClick={() => setShowInvite(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A227] text-[#0C2340] text-sm font-semibold rounded-lg hover:bg-[#D4AF37] transition-colors"
        >
          <UserPlus size={15} />
          Invite Member
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="mb-5 p-4 rounded-xl border border-[#1f1f35] bg-[#0a0a12]">
          <p className="text-sm font-medium text-white mb-3">Invite a new member</p>
          <div className="flex items-center gap-3">
            <input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#0f0f1a] border border-[#1f1f35] rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] transition-colors"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as Role)}
              className="px-3 py-2 bg-[#0f0f1a] border border-[#1f1f35] rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
            >
              {ROLE_LABELS.map(r => (
                <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={sendInvite}
              className="px-4 py-2 bg-[#C9A227] text-[#0C2340] text-sm font-semibold rounded-lg hover:bg-[#D4AF37] transition-colors"
            >
              Send Invite
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#1f1f35] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1f1f35] bg-[#0a0a12]">
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Member</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Email</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Role</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-[#1f1f35]/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-xs font-bold text-[#C9A227]">
                      {member.avatar}
                    </div>
                    <span className="text-sm font-medium text-white">{member.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-400">{member.email}</td>
                <td className="px-5 py-3.5">
                  {member.role === 'owner' ? (
                    <RoleBadge role={member.role} />
                  ) : (
                    <div className="relative inline-block">
                      <select
                        value={member.role}
                        onChange={e => changeRole(member.id, e.target.value as Role)}
                        className={`appearance-none pr-6 pl-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer bg-transparent focus:outline-none ${ROLE_COLORS[member.role]}`}
                      >
                        {ROLE_LABELS.filter(r => r !== 'owner').map(r => (
                          <option key={r} value={r} className="bg-[#0a0a12] capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={member.status} />
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{member.joinedAt}</td>
                <td className="px-5 py-3.5">
                  {member.role !== 'owner' && (
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleSuspend(member.id)}
                        title={member.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors"
                      >
                        <ShieldOff size={14} />
                      </button>
                      <button
                        onClick={() => removeMember(member.id)}
                        title="Remove"
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Roles & Permissions ─────────────────────────────────────────────────

const ROLE_CARDS = [
  {
    role: 'Owner' as const,
    color: 'border-purple-500/40 bg-purple-500/5',
    headerColor: 'text-purple-300',
    permissions: [
      { label: 'Manage billing', granted: true },
      { label: 'Delete workspace', granted: true },
      { label: 'Manage members', granted: true },
      { label: 'Edit workflows', granted: true },
      { label: 'View executions', granted: true },
    ],
  },
  {
    role: 'Admin' as const,
    color: 'border-blue-500/40 bg-blue-500/5',
    headerColor: 'text-blue-300',
    permissions: [
      { label: 'Manage billing', granted: false },
      { label: 'Delete workspace', granted: false },
      { label: 'Manage members', granted: true },
      { label: 'Edit workflows', granted: true },
      { label: 'View executions', granted: true },
    ],
  },
  {
    role: 'Editor' as const,
    color: 'border-green-500/40 bg-green-500/5',
    headerColor: 'text-green-300',
    permissions: [
      { label: 'Manage billing', granted: false },
      { label: 'Manage members', granted: false },
      { label: 'Edit workflows', granted: true },
      { label: 'View executions', granted: true },
      { label: 'Manage connections', granted: false },
    ],
  },
  {
    role: 'Viewer' as const,
    color: 'border-gray-500/40 bg-gray-500/5',
    headerColor: 'text-gray-300',
    permissions: [
      { label: 'Manage billing', granted: false },
      { label: 'Manage members', granted: false },
      { label: 'Edit workflows', granted: false },
      { label: 'View workflows', granted: true },
      { label: 'View executions', granted: true },
    ],
  },
];

function RolesTab() {
  return (
    <div>
      <p className="text-sm text-gray-400 mb-5">
        Role-based access control defines what each member can do within the workspace.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ROLE_CARDS.map((card) => (
          <div key={card.role} className={`rounded-xl border p-5 ${card.color}`}>
            <h3 className={`text-base font-bold mb-4 ${card.headerColor}`}>{card.role}</h3>
            <ul className="space-y-2.5">
              {card.permissions.map((perm) => (
                <li key={perm.label} className="flex items-center gap-2.5 text-sm">
                  {perm.granted ? (
                    <Check size={14} className="text-green-400 flex-shrink-0" />
                  ) : (
                    <X size={14} className="text-red-400 flex-shrink-0" />
                  )}
                  <span className={perm.granted ? 'text-gray-200' : 'text-gray-500'}>{perm.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Audit Log ────────────────────────────────────────────────────────────

function AuditTab() {
  const [fromDate, setFromDate] = useState('2026-03-13');
  const [toDate, setToDate] = useState('2026-03-14');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');

  const filtered = MOCK_AUDIT.filter(entry => {
    if (actionFilter !== 'all' && !entry.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (userFilter && !entry.user.toLowerCase().includes(userFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-[#0a0a12] border border-[#1f1f35] rounded-lg px-3 py-2">
          <span className="text-xs text-gray-500">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none w-32"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#0a0a12] border border-[#1f1f35] rounded-lg px-3 py-2">
          <span className="text-xs text-gray-500">To</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none w-32"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#0a0a12] border border-[#1f1f35] rounded-lg px-3 py-2">
          <Filter size={14} className="text-gray-500" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="workflow">Workflow</option>
            <option value="member">Member</option>
            <option value="api">API Key</option>
            <option value="billing">Billing</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0a12] border border-[#1f1f35] rounded-lg px-3 py-2 flex-1 min-w-[160px]">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Filter by user..."
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1f1f35] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1f1f35] bg-[#0a0a12]">
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Timestamp</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">User</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Action</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Resource</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">IP Address</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-b border-[#1f1f35]/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">{entry.timestamp}</td>
                <td className="px-5 py-3 text-sm text-gray-300">{entry.user}</td>
                <td className="px-5 py-3 text-sm text-white">{entry.action}</td>
                <td className="px-5 py-3 text-xs text-gray-500 font-mono">{entry.resource}</td>
                <td className="px-5 py-3 text-xs text-gray-500 font-mono">{entry.ip}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    entry.status === 'success'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>Showing 1–{filtered.length} of 234 events</span>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded border border-[#1f1f35] hover:border-[#C9A227] hover:text-[#C9A227] transition-colors text-xs">
            Previous
          </button>
          <button className="px-3 py-1 rounded border border-[#1f1f35] hover:border-[#C9A227] hover:text-[#C9A227] transition-colors text-xs">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Security ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [ipAllowlist, setIpAllowlist] = useState('');
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);

  const revokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const createApiKey = () => {
    const newKey: ApiKey = {
      id: String(Date.now()),
      name: 'New Key',
      prefix: 'ff_live_newk...',
      created: 'Mar 14, 2026',
      lastUsed: 'Never',
    };
    setApiKeys(prev => [...prev, newKey]);
  };

  return (
    <div className="space-y-6">
      {/* 2FA */}
      <div className="rounded-xl border border-[#1f1f35] bg-[#0a0a12] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold mb-1">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-400">Add an extra layer of security to your account with TOTP authenticator apps.</p>
          </div>
          <button
            onClick={() => setTwoFaEnabled(v => !v)}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
              twoFaEnabled ? 'bg-[#C9A227]' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 rounded-full bg-white transition-transform ${
                twoFaEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {twoFaEnabled && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400">2FA is enabled. Your account is protected with an authenticator app.</p>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="rounded-xl border border-[#1f1f35] bg-[#0a0a12] p-5">
        <h3 className="text-white font-semibold mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f1a] border border-[#1f1f35]">
              <div className="flex items-center gap-4">
                <Monitor size={18} className="text-gray-400 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{session.device}</span>
                    {session.current && (
                      <span className="text-xs px-1.5 py-0.5 bg-[#C9A227]/20 text-[#C9A227] rounded font-medium">Current</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={10} />
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={10} />
                      {session.lastActive}
                    </span>
                  </div>
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => revokeSession(session.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors border border-red-500/30 px-3 py-1 rounded"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* IP Allowlist */}
      <div className="rounded-xl border border-[#1f1f35] bg-[#0a0a12] p-5">
        <h3 className="text-white font-semibold mb-1">IP Allowlist</h3>
        <p className="text-sm text-gray-400 mb-3">Restrict access to specific IP addresses. Enter one IP or CIDR range per line.</p>
        <textarea
          value={ipAllowlist}
          onChange={e => setIpAllowlist(e.target.value)}
          rows={4}
          placeholder={'192.168.1.0/24\n10.0.0.1\n203.0.113.42'}
          className="w-full px-3 py-2.5 bg-[#0f0f1a] border border-[#1f1f35] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#C9A227] transition-colors resize-none"
        />
        <button className="mt-3 px-4 py-2 bg-[#C9A227] text-[#0C2340] text-sm font-semibold rounded-lg hover:bg-[#D4AF37] transition-colors">
          Save Allowlist
        </button>
      </div>

      {/* API Keys */}
      <div className="rounded-xl border border-[#1f1f35] bg-[#0a0a12] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">API Keys</h3>
          <button
            onClick={createApiKey}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[#C9A227] text-[#C9A227] rounded-lg hover:bg-[#C9A227]/10 transition-colors"
          >
            <Key size={14} />
            Create API Key
          </button>
        </div>
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div key={key.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f1a] border border-[#1f1f35]">
              <div className="flex items-center gap-3">
                <Key size={16} className="text-[#C9A227]" />
                <div>
                  <p className="text-sm font-medium text-white">{key.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{key.prefix}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-xs text-gray-300">{key.created}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last used</p>
                  <p className="text-xs text-gray-300">{key.lastUsed}</p>
                </div>
                <button
                  onClick={() => deleteApiKey(key.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {apiKeys.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">No API keys yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'members' | 'roles' | 'audit' | 'security';

const TABS: { id: Tab; label: string }[] = [
  { id: 'members', label: 'Members' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'security', label: 'Security' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('members');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white mb-1">Admin Center</h1>
        <p className="text-gray-400 text-sm">Manage workspace members, roles, security, and audit logs.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1f1f35] mb-7">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[#C9A227]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A227] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'audit' && <AuditTab />}
      {activeTab === 'security' && <SecurityTab />}
    </div>
  );
}
