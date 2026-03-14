'use client';

import { useState, useEffect } from 'react';

interface Transfer {
  id: string;
  name: string;
  sourceConnectorId: string;
  destConnectorId: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  createdAt: string;
}

export default function TransferPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [newTransfer, setNewTransfer] = useState({ name: '', sourceConnectorId: '', destConnectorId: '' });

  useEffect(() => {
    fetch('/api/transfers').then(r => r.json()).then(d => setTransfers(d.transfers ?? [])).finally(() => setIsLoading(false));
  }, []);

  const create = async () => {
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTransfer),
    });
    const data = await res.json();
    setTransfers(prev => [data.transfer, ...prev]);
    setShowCreate(false);
    setStep(1);
    setNewTransfer({ name: '', sourceConnectorId: '', destConnectorId: '' });
  };

  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-700 text-gray-400',
    running: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
  };

  const CONNECTORS = ['gmail', 'google-sheets', 'hubspot', 'salesforce', 'notion', 'airtable', 'stripe'];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transfer</h1>
          <p className="text-gray-400 text-sm mt-1">Migrate data between apps in bulk</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37]">
          + New Transfer
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-48 items-center"><div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" /></div>
      ) : transfers.length === 0 ? (
        <div className="text-center py-24 glass rounded-xl">
          <div className="text-5xl mb-4">↔️</div>
          <h3 className="text-white font-semibold text-lg mb-2">No transfers yet</h3>
          <p className="text-gray-400 text-sm mb-6">Bulk migrate data between your apps without writing code</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg">New Transfer</button>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map(t => (
            <div key={t.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-white font-medium">{t.name}</h3>
                <p className="text-gray-500 text-sm">{t.sourceConnectorId} → {t.destConnectorId}</p>
              </div>
              <div className="text-right">
                {t.status === 'running' && (
                  <div className="mb-1">
                    <div className="h-1.5 w-32 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C9A227] rounded-full" style={{ width: `${t.totalRecords > 0 ? (t.processedRecords / t.totalRecords) * 100 : 0}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{t.processedRecords}/{t.totalRecords} records</p>
                  </div>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] || STATUS_COLORS.draft}`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0C2340] border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-6">
              {[1,2,3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-[#C9A227]' : 'bg-gray-700'}`} />
              ))}
            </div>

            {step === 1 && (
              <>
                <h2 className="text-white font-bold mb-4">Step 1: Name your transfer</h2>
                <input value={newTransfer.name} onChange={e => setNewTransfer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Transfer name" autoFocus className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-4" />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                  <button onClick={() => setStep(2)} disabled={!newTransfer.name} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">Next →</button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-white font-bold mb-4">Step 2: Select source</h2>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {CONNECTORS.map(c => (
                    <button key={c} onClick={() => setNewTransfer(prev => ({ ...prev, sourceConnectorId: c }))}
                      className={`p-3 rounded-lg text-sm text-center ${newTransfer.sourceConnectorId === c ? 'bg-[#C9A227]/20 border border-[#C9A227] text-[#C9A227]' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">← Back</button>
                  <button onClick={() => setStep(3)} disabled={!newTransfer.sourceConnectorId} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">Next →</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-white font-bold mb-4">Step 3: Select destination</h2>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {CONNECTORS.filter(c => c !== newTransfer.sourceConnectorId).map(c => (
                    <button key={c} onClick={() => setNewTransfer(prev => ({ ...prev, destConnectorId: c }))}
                      className={`p-3 rounded-lg text-sm text-center ${newTransfer.destConnectorId === c ? 'bg-[#C9A227]/20 border border-[#C9A227] text-[#C9A227]' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">← Back</button>
                  <button onClick={create} disabled={!newTransfer.destConnectorId} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">Create Transfer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
