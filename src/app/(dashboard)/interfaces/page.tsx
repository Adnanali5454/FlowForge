'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Interface {
  id: string;
  name: string;
  type: string;
  isPublished: boolean;
  createdAt: string;
}

export default function InterfacesPage() {
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetch('/api/interfaces')
      .then(r => r.json())
      .then(d => setInterfaces(d.interfaces ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const createInterface = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/interfaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, type: 'form' }),
      });
      const data = await res.json();
      setInterfaces(prev => [data.interface, ...prev]);
      setShowCreate(false);
      setNewName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Interfaces</h1>
          <p className="text-gray-400 text-sm mt-1">Build forms and pages that trigger workflows</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37]"
        >
          + New Interface
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-48 items-center">
          <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : interfaces.length === 0 ? (
        <div className="text-center py-24 glass rounded-xl">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-white font-semibold text-lg mb-2">No interfaces yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create forms and pages to collect data and trigger workflows</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg">
            Create Interface
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interfaces.map(iface => (
            <Link key={iface.id} href={`/interfaces/${iface.id}/edit`}>
              <div className="glass rounded-xl p-5 hover:border-[#C9A227]/50 border border-gray-800 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📝</span>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold group-hover:text-[#C9A227] transition-colors">{iface.name}</h3>
                    <span className="text-xs text-gray-500 capitalize">{iface.type}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${iface.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {iface.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0C2340] border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold mb-4">New Interface</h2>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createInterface()}
              placeholder="Form name"
              autoFocus
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button
                onClick={createInterface}
                disabled={isCreating || !newName.trim()}
                className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
