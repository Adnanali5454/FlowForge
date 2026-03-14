'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SettingsForm {
  workspaceName: string;
  errorNotificationEmail: string;
  autoReplay: 'never' | 'always' | 'on_transient';
  floodProtectionMaxTasks: number;
  floodProtectionWindowMinutes: number;
}

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  usedTasksThisMonth: number;
  maxTasksPerMonth: number;
  taskResetDate: string | null;
  settings: {
    errorNotificationEmail?: string | null;
    autoReplay?: 'never' | 'always' | 'on_transient';
    floodProtection?: {
      maxTasksPerWindow?: number;
      windowMinutes?: number;
    };
  };
  createdAt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsForm>({
    workspaceName: '',
    errorNotificationEmail: '',
    autoReplay: 'never',
    floodProtectionMaxTasks: 100,
    floodProtectionWindowMinutes: 10,
  });
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await fetch('/api/workspace');
        if (!response.ok) throw new Error('Failed to fetch workspace');
        const data = await response.json();
        const ws: WorkspaceData = data.workspace;
        setWorkspaceData(ws);
        setSettings({
          workspaceName: ws.name,
          errorNotificationEmail: ws.settings?.errorNotificationEmail ?? '',
          autoReplay: ws.settings?.autoReplay ?? 'never',
          floodProtectionMaxTasks: ws.settings?.floodProtection?.maxTasksPerWindow ?? 100,
          floodProtectionWindowMinutes: ws.settings?.floodProtection?.windowMinutes ?? 10,
        });
      } catch (error) {
        console.error('Error fetching workspace:', error);
        toast.error('Failed to load workspace settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspace();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.currentTarget;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Failed to save settings');
      }
      const data = await response.json();
      setWorkspaceData(data.workspace);
      toast.success('Settings saved successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save settings';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const planName = workspaceData
    ? workspaceData.plan.charAt(0).toUpperCase() + workspaceData.plan.slice(1)
    : 'Free';
  const usedTasks = workspaceData?.usedTasksThisMonth ?? 0;
  const maxTasks = workspaceData?.maxTasksPerMonth ?? 500;
  const usagePercent = maxTasks > 0 ? Math.min((usedTasks / maxTasks) * 100, 100) : 0;

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Workspace configuration and account settings</p>
        </div>
        <div className="text-gray-400 text-sm">Loading workspace settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Workspace configuration and account settings</p>
      </div>

      {/* Workspace Settings */}
      <section className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Workspace</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Workspace Name</label>
            <input
              type="text"
              name="workspaceName"
              value={settings.workspaceName}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Default Error Notification Email</label>
            <input
              type="email"
              name="errorNotificationEmail"
              value={settings.errorNotificationEmail}
              onChange={handleInputChange}
              placeholder="alerts@yourcompany.com"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Error Handling */}
      <section className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Error Handling</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Auto-Replay</label>
            <select
              name="autoReplay"
              value={settings.autoReplay}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
            >
              <option value="never">Never replay</option>
              <option value="always">Always replay</option>
              <option value="on_transient">Replay on transient errors only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Flood Protection</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="floodProtectionMaxTasks"
                value={settings.floodProtectionMaxTasks}
                onChange={handleInputChange}
                className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
              />
              <span className="text-sm text-gray-400">max tasks per</span>
              <input
                type="number"
                name="floodProtectionWindowMinutes"
                value={settings.floodProtectionWindowMinutes}
                onChange={handleInputChange}
                className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
              />
              <span className="text-sm text-gray-400">minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Plan */}
      <section className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Plan & Usage</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-medium">{planName} Plan</p>
            <p className="text-sm text-gray-400">{maxTasks.toLocaleString()} tasks / month</p>
          </div>
          <button className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37] transition-colors">
            Upgrade
          </button>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C9A227] rounded-full transition-all"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {usedTasks.toLocaleString()} of {maxTasks.toLocaleString()} tasks used this month
        </p>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#C9A227] text-[#0C2340] font-semibold rounded-lg hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
