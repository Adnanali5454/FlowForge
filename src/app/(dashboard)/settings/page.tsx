'use client';

export default function SettingsPage() {
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
              defaultValue="My Workspace"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Default Error Notification Email</label>
            <input
              type="email"
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
            <select className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]">
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
                defaultValue={100}
                className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
              />
              <span className="text-sm text-gray-400">max tasks per</span>
              <input
                type="number"
                defaultValue={10}
                className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
              />
              <span className="text-sm text-gray-400">minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Plan */}
      <section className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Plan & Usage</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-medium">Free Plan</p>
            <p className="text-sm text-gray-400">500 tasks / month</p>
          </div>
          <button className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37] transition-colors">
            Upgrade
          </button>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-[#C9A227] rounded-full transition-all" style={{ width: '0%' }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">0 of 500 tasks used this month</p>
      </section>
    </div>
  );
}
