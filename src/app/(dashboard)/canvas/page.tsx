'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Canvas {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function CanvasListPage() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetch('/api/canvases').then(r => r.json()).then(d => setCanvases(d.canvases ?? [])).finally(() => setIsLoading(false));
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/canvases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    setCanvases(prev => [data.canvas, ...prev]);
    setShowCreate(false);
    setNewName('');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Canvas</h1>
          <p className="text-gray-400 text-sm mt-1">Visual diagramming and brainstorming boards</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37]">
          + New Canvas
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-48 items-center"><div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" /></div>
      ) : canvases.length === 0 ? (
        <div className="text-center py-24 glass rounded-xl">
          <div className="text-5xl mb-4">🎨</div>
          <h3 className="text-white font-semibold text-lg mb-2">No canvases yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create visual diagrams, process maps, and brainstorming boards</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg">Create Canvas</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canvases.map(canvas => (
            <Link key={canvas.id} href={`/canvas/${canvas.id}`}>
              <div className="glass rounded-xl p-5 hover:border-[#C9A227]/50 border border-gray-800 transition-colors cursor-pointer group h-40 flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-semibold group-hover:text-[#C9A227]">{canvas.name}</h3>
                  {canvas.description && <p className="text-gray-400 text-sm mt-1">{canvas.description}</p>}
                </div>
                <p className="text-gray-600 text-xs">Updated {new Date(canvas.updatedAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0C2340] border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold mb-4">New Canvas</h2>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()}
              placeholder="Canvas name" autoFocus className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={create} disabled={!newName.trim()} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
