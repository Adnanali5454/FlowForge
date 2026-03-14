'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: string | React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/workflows', label: 'Workflows', icon: '⚡' },
  { href: '/tables', label: 'Tables', icon: '📊' },
  { href: '/interfaces', label: 'Interfaces', icon: '📝' },
  { href: '/chatbots', label: 'Chatbots', icon: '🤖' },
  { href: '/canvas', label: 'Canvas', icon: '🎨' },
  { href: '/agents', label: 'Agents', icon: '🧠' },
  { href: '/transfer', label: 'Transfer', icon: '↔️' },
  { href: '/executions', label: 'Executions', icon: '📈' },
  { href: '/connections', label: 'Connections', icon: '🔗' },
  { href: '/approvals', label: 'Approvals', icon: <CheckSquare size={18} />, badge: '4' },
  { href: '/admin', label: 'Admin Center', icon: <ShieldCheck size={18} /> },
  { href: '/mcp', label: 'MCP Servers', icon: '🖥️' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

interface WorkspaceInfo {
  usedTasksThisMonth: number;
  tasksLimit: number;
  planName: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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
      } catch (error) {
        console.error('Error fetching workspace info:', error);
      }
    };
    fetchWorkspaceInfo();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar-bg border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#0C2340" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Flow<span className="text-[#C9A227]">Forge</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors',
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                )}
              >
                <span className={typeof item.icon === 'string' ? 'text-lg' : 'flex-shrink-0'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Plan info */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">{workspaceInfo.planName} Plan</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">{workspaceInfo.usedTasksThisMonth} / {workspaceInfo.tasksLimit} tasks</span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9A227] rounded-full transition-all"
                style={{ width: `${(workspaceInfo.usedTasksThisMonth / workspaceInfo.tasksLimit) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#0f0f1a]">
        {children}
      </main>
    </div>
  );
}
