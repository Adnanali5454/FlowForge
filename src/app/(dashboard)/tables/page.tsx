'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Table {
  id: string;
  name: string;
  description: string;
  icon: string;
  rowCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📊');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetch('/api/tables')
      .then(r => r.json())
      .then(d => setTables(d.tables ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const createTable = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, icon: newIcon }),
      });
      const data = await res.json();
      setTables(prev => [data.table, ...prev]);
      setShowCreate(false);
      setNewName('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const ICONS = ['📊', '📋', '📝', '🗂️', '📁', '🧮', '📈', '📉', '🗃️', '📌'];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Tables</h1>
          <p className="text-gray-400 text-sm mt-1">Build databases and manage data without writing SQL</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37] transition-colors"
        >
          + New Table
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-24 glass rounded-xl">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-white font-semibold text-lg mb-2">No tables yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first table to start managing data</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37]"
          >
            Create Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map(table => (
            <Link key={table.id} href={`/tables/${table.id}`}>
              <div className="glass rounded-xl p-5 hover:border-[#C9A227]/50 border border-gray-800 transition-colors cursor-pointer group">
                <div className="text-3xl mb-3">{table.icon}</div>
                <h3 className="text-white font-semibold group-hover:text-[#C9A227] transition-colors">{table.name}</h3>
                {table.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{table.description}</p>}
                <p className="text-gray-500 text-xs mt-3">{table.rowCount ?? 0} rows</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0C2340] border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-4">New Table</h2>
            <div className="flex gap-2 mb-4">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewIcon(icon)}
                  className={`text-2xl p-1 rounded ${newIcon === icon ? 'bg-[#C9A227]/20 ring-1 ring-[#C9A227]' : 'hover:bg-gray-800'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createTable()}
              placeholder="Table name"
              autoFocus
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button
                onClick={createTable}
                disabled={isCreating || !newName.trim()}
                className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Table'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
