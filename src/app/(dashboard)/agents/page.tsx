'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  type: string;
  model: string;
  isActive: boolean;
  createdAt: string;
}

const AGENT_TYPES = ['task', 'research', 'assistant', 'monitor', 'orchestrator'];
const MODELS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'gpt-4o'];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('task');
  const [newModel, setNewModel] = useState('claude-sonnet-4-6');

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents ?? [])).finally(() => setIsLoading(false));
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, type: newType, model: newModel }),
    });
    const data = await res.json();
    setAgents(prev => [data.agent, ...prev]);
    setShowCreate(false);
    setNewName('');
  };

  const TYPE_ICONS: Record<string, string> = {
    task: '⚡', research: '🔍', assistant: '💬', monitor: '👁️', orchestrator: '🎭',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-gray-400 text-sm mt-1">Autonomous AI agents that reason and act to complete goals</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg hover:bg-[#D4AF37]">
          + New Agent
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-48 items-center"><div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" /></div>
      ) : agents.length === 0 ? (
        <div className="text-center py-24 glass rounded-xl">
          <div className="text-5xl mb-4">🧠</div>
          <h3 className="text-white font-semibold text-lg mb-2">No agents yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create AI agents that autonomously plan and execute complex tasks</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg">Create Agent</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <Link key={agent.id} href={`/agents/${agent.id}/edit`}>
              <div className="glass rounded-xl p-5 hover:border-[#C9A227]/50 border border-gray-800 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{TYPE_ICONS[agent.type] || '🤖'}</span>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold group-hover:text-[#C9A227]">{agent.name}</h3>
                    <span className="text-xs text-gray-500 capitalize">{agent.type} · {agent.model}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0C2340] border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold mb-4">New Agent</h2>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Agent name" autoFocus
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-3" />
            <select value={newType} onChange={e => setNewType(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-3">
              {AGENT_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select value={newModel} onChange={e => setNewModel(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-4">
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={create} className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
