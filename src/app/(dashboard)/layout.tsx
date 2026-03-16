'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckSquare,
  Zap,
  Table2,
  FormInput,
  Bot,
  PenSquare,
  Brain,
  ArrowLeftRight,
  BarChart2,
  Link2,
  Settings,
  Server,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/workflows',  label: 'Workflows',    icon: <Zap size={16} /> },
  { href: '/tables',     label: 'Tables',        icon: <Table2 size={16} /> },
  { href: '/interfaces', label: 'Interfaces',    icon: <FormInput size={16} /> },
  { href: '/chatbots',   label: 'Chatbots',      icon: <Bot size={16} /> },
  { href: '/canvas',     label: 'Canvas',        icon: <PenSquare size={16} /> },
  { href: '/agents',     label: 'Agents',        icon: <Brain size={16} /> },
  { href: '/transfer',   label: 'Transfer',      icon: <ArrowLeftRight size={16} /> },
  { href: '/executions', label: 'Executions',    icon: <BarChart2 size={16} /> },
  { href: '/connections',label: 'Connections',   icon: <Link2 size={16} /> },
  { href: '/approvals',  label: 'Approvals',     icon: <CheckSquare size={16} />, badge: '4' },
  { href: '/admin',      label: 'Admin Center',  icon: <ShieldCheck size={16} /> },
  { href: '/mcp',        label: 'MCP Servers',   icon: <Server size={16} /> },
  { href: '/settings',   label: 'Settings',      icon: <Settings size={16} /> },
];

interface WorkspaceInfo {
  usedTasksThisMonth: number;
  tasksLimit: number;
  planName: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo>({
    usedTasksThisMonth: 0,
    tasksLimit: 500,
    planName: 'Free',
  });

  useEffect(() => {
    const fetchWorkspaceInfo = async () => {
      try {
        const response = await fetch('/api/workspace');
        if (response.ok) {
          const data = await response.json();
          const ws = data.workspace;
          const plan: string = ws.plan ?? 'free';
          setWorkspaceInfo({
            usedTasksThisMonth: ws.usedTasksThisMonth ?? 0,
            tasksLimit: ws.maxTasksPerMonth ?? 500,
            planName: plan.charAt(0).toUpperCase() + plan.slice(1),
          });
        }
      } catch {
        // keep defaults
      }
    };
    fetchWorkspaceInfo();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  const usagePct = workspaceInfo.tasksLimit > 0
    ? Math.min(100, Math.round((workspaceInfo.usedTasksThisMonth / workspaceInfo.tasksLimit) * 100))
    : 0;

  const usageColor =
    usagePct >= 90 ? 'bg-red-500' :
    usagePct >= 75 ? 'bg-amber-400' :
    'bg-[#C9A227]';

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f1a]">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#111827] border-r border-white/[0.06]">

        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#0C2340" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight leading-none">
              Flow<span className="text-[#C9A227]">Forge</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                )}
              >
                <span className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-[#C9A227]' : 'text-gray-500 group-hover:text-gray-300'
                )}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold leading-none">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight size={12} className="text-[#C9A227]/60 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Task Usage / Plan Footer ──────────────────────────────────── */}
        <div className="flex-shrink-0 p-3 border-t border-white/[0.06] space-y-2">

          {/* Usage card */}
          <div className="rounded-lg bg-[#1a1f2e] border border-white/[0.06] p-3 space-y-2">

            {/* Plan label + badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {workspaceInfo.planName} Plan
              </span>
              {usagePct >= 75 && (
                <Link
                  href="/billing"
                  className="text-[10px] font-semibold text-[#C9A227] hover:text-[#D4AF37] transition-colors"
                >
                  Upgrade ↗
                </Link>
              )}
            </div>

            {/* Task count */}
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-white">
                {workspaceInfo.usedTasksThisMonth.toLocaleString()}
              </span>
              <span className="text-[11px] text-gray-500">
                / {workspaceInfo.tasksLimit.toLocaleString()} tasks
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-[#2a2f3f] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', usageColor)}
                  style={{ width: `${Math.max(usagePct, usagePct > 0 ? 2 : 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-[10px] font-medium',
                  usagePct >= 90 ? 'text-red-400' :
                  usagePct >= 75 ? 'text-amber-400' :
                  'text-gray-500'
                )}>
                  {usagePct}% used
                </span>
                <span className="text-[10px] text-gray-600">
                  {(workspaceInfo.tasksLimit - workspaceInfo.usedTasksThisMonth).toLocaleString()} left
                </span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
          >
            <LogOut size={14} className="flex-shrink-0" />
            <span>Sign out</span>
          </button>

        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

    </div>
  );
}
