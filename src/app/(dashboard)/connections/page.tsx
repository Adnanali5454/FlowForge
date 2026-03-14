'use client';

import { useState, useEffect } from 'react';

interface Connection {
  id: string;
  name: string;
  connectorId: string;
  isValid: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  connector?: {
    name: string;
    slug: string;
    icon: string;
    authType: string;
  };
}

const CONNECTORS_FOR_CONNECT = [
  { slug: 'gmail', name: 'Gmail', icon: '📧', authType: 'oauth2' },
  { slug: 'slack', name: 'Slack', icon: '💬', authType: 'oauth2' },
  { slug: 'google-sheets', name: 'Google Sheets', icon: '📊', authType: 'oauth2' },
  { slug: 'notion', name: 'Notion', icon: '📝', authType: 'oauth2' },
  { slug: 'github', name: 'GitHub', icon: '🐙', authType: 'oauth2' },
  { slug: 'stripe', name: 'Stripe', icon: '💳', authType: 'api_key' },
  { slug: 'openai', name: 'OpenAI', icon: '🤖', authType: 'api_key' },
  { slug: 'anthropic', name: 'Anthropic', icon: '✨', authType: 'api_key' },
];

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<typeof CONNECTORS_FOR_CONNECT[0] | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [connName, setConnName] = useState('');

  useEffect(() => {
    fetch('/api/connections').then(r => r.json()).then(d => setConnections(d.connections ?? [])).finally(() => setIsLoading(false));
  }, []);

  const connectOAuth = (slug: string) => {
    window.location.href = `/api/oauth/authorize?connectorId=${slug}`;
  };

  const connectApiKey = async () => {
    if (!selectedConnector || !apiKey) return;
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectorSlug: selectedConnector.slug,
        name: connName || `${selectedConnector.name} Connection`,
        credentials: { apiKey },
      }),
    });
    const data = await res.json();
    if (data.connection) {
      setConnections(prev => [data.connection, ...prev]);
    }
    setShowAdd(false);
    setApiKey('');
    setConnName('');
    setSelectedConnector(null);
  };

  const testConnection = async (id: string) => {
    const res = await fetch('/api/connections/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: id }),
    });
    const data = await res.json() as { success: boolean };
    setConnections(prev => prev.map(c => c.id === id ? { ...c, isValid: data.success, lastTestedAt: new Date().toISOString() } : c));
  };

  const deleteConnection = async (id: string) => {
    await fetch(`/api/connections/${id}`, { method: 'DELETE' });
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Connections</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your connected apps and credentials</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37]">
          + Add Connection
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-48 items-center"><div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" /></div>
      ) : connections.length === 0 ? (
        <div className="text-center py-24 glass rounded-xl">
          <div className="text-5xl mb-4">🔗</div>
          <h3 className="text-white font-semibold text-lg mb-2">No connections yet</h3>
          <p className="text-gray-400 text-sm mb-6">Connect your apps to use them in workflows and agents</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg">Add Connection</button>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map(conn => (
            <div key={conn.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl">
                {conn.connector?.icon || '🔌'}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{conn.name}</h3>
                <p className="text-gray-500 text-sm">{conn.connector?.name || conn.connectorId}</p>
                {conn.lastTestedAt && <p className="text-gray-600 text-xs">Last tested {new Date(conn.lastTestedAt).toLocaleString()}</p>}
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${conn.isValid ? 'bg-green-400' : 'bg-red-400'}`} />
              <div className="flex gap-2">
                <button onClick={() => testConnection(conn.id)} className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">Test</button>
                <button onClick={() => deleteConnection(conn.id)} className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0C2340] border border-gray-700 rounded-xl p-6 w-full max-w-lg">
            {!selectedConnector ? (
              <>
                <h2 className="text-white font-bold mb-4">Select an App to Connect</h2>
                <div className="grid grid-cols-3 gap-3">
                  {CONNECTORS_FOR_CONNECT.map(c => (
                    <button key={c.slug} onClick={() => setSelectedConnector(c)}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-center transition-colors">
                      <span className="text-2xl block mb-1">{c.icon}</span>
                      <span className="text-white text-sm">{c.name}</span>
                      <span className="text-gray-500 text-xs block mt-0.5">{c.authType === 'oauth2' ? 'OAuth' : 'API Key'}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                </div>
              </>
            ) : selectedConnector.authType === 'oauth2' ? (
              <>
                <h2 className="text-white font-bold mb-4">Connect {selectedConnector.icon} {selectedConnector.name}</h2>
                <p className="text-gray-400 text-sm mb-6">You'll be redirected to {selectedConnector.name} to authorize FlowForge access.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setSelectedConnector(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">← Back</button>
                  <button onClick={() => connectOAuth(selectedConnector.slug)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg">
                    Connect with {selectedConnector.name}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-white font-bold mb-4">Connect {selectedConnector.icon} {selectedConnector.name}</h2>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Connection Name</label>
                    <input value={connName} onChange={e => setConnName(e.target.value)}
                      placeholder={`${selectedConnector.name} Connection`}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">API Key</label>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setSelectedConnector(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">← Back</button>
                  <button onClick={connectApiKey} disabled={!apiKey} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">Save Connection</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
