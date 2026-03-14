'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  type: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  constraints: Record<string, unknown>;
  isActive: boolean;
}

interface AgentRun {
  id: string;
  trigger: string;
  status: string;
  steps: Array<{ action: string; reasoning: string; timestamp: string }>;
  startedAt: string;
  completedAt: string | null;
}

const TABS = ['Config', 'Tools', 'Runs', 'Test'] as const;
type Tab = typeof TABS[number];

export default function AgentEditPage() {
  const params = useParams();
  const agentId = params?.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Config');
  const [isSaving, setIsSaving] = useState(false);
  const [testGoal, setTestGoal] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ steps: AgentRun['steps']; output: string } | null>(null);

  useEffect(() => {
    fetch(`/api/agents/${agentId}`).then(r => r.json()).then(d => {
      if (d.agent) setAgent(d.agent);
      if (d.runs) setRuns(d.runs);
    });
  }, [agentId]);

  const save = useCallback(async () => {
    if (!agent) return;
    setIsSaving(true);
    try {
      await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
    } finally {
      setIsSaving(false);
    }
  }, [agent, agentId]);

  const runAgent = async () => {
    if (!testGoal.trim() || isRunning) return;
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: testGoal }),
      });
      const data = await res.json() as { steps: AgentRun['steps']; output: string };
      setRunResult(data);
      // Refresh runs
      fetch(`/api/agents/${agentId}`).then(r => r.json()).then(d => { if (d.runs) setRuns(d.runs); });
    } finally {
      setIsRunning(false);
    }
  };

  if (!agent) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-4">
        <h1 className="text-white font-semibold">{agent.name}</h1>
        <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
        <nav className="flex gap-1 ml-4">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-lg ${activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex gap-3">
          <button onClick={() => setAgent(prev => prev ? { ...prev, isActive: !prev.isActive } : prev)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium ${agent.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
            {agent.isActive ? 'Active' : 'Inactive'}
          </button>
          <button onClick={save} disabled={isSaving} className="px-4 py-1.5 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'Config' && (
          <div className="max-w-xl space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              <input value={agent.name} onChange={e => setAgent(prev => prev ? { ...prev, name: e.target.value } : prev)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <select value={agent.type} onChange={e => setAgent(prev => prev ? { ...prev, type: e.target.value } : prev)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]">
                {['task', 'research', 'assistant', 'monitor', 'orchestrator'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Model</label>
              <select value={agent.model} onChange={e => setAgent(prev => prev ? { ...prev, model: e.target.value } : prev)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]">
                {['claude-sonnet', 'claude-opus', 'gpt-4o'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">System Prompt</label>
              <textarea value={agent.systemPrompt} onChange={e => setAgent(prev => prev ? { ...prev, systemPrompt: e.target.value } : prev)}
                rows={6} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] resize-none" />
            </div>
          </div>
        )}

        {activeTab === 'Tools' && (
          <div className="max-w-xl">
            <p className="text-gray-400 text-sm mb-4">Select which tools this agent can use:</p>
            {['gmail', 'slack', 'stripe', 'notion', 'github', 'openai', 'anthropic', 'http'].map(tool => (
              <label key={tool} className="flex items-center gap-3 py-2 cursor-pointer">
                <input type="checkbox" checked={agent.tools.includes(tool)}
                  onChange={e => setAgent(prev => prev ? {
                    ...prev,
                    tools: e.target.checked ? [...prev.tools, tool] : prev.tools.filter(t => t !== tool)
                  } : prev)} className="w-4 h-4" />
                <span className="text-white text-sm capitalize">{tool}</span>
              </label>
            ))}
          </div>
        )}

        {activeTab === 'Runs' && (
          <div className="max-w-2xl">
            <h3 className="text-white font-semibold mb-4">Run History ({runs.length})</h3>
            {runs.length === 0 ? (
              <p className="text-gray-500 text-sm">No runs yet. Use the Test tab to run the agent.</p>
            ) : (
              <div className="space-y-3">
                {runs.map(run => (
                  <div key={run.id} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${run.status === 'completed' ? 'bg-green-500/20 text-green-400' : run.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {run.status}
                      </span>
                      <span className="text-gray-500 text-xs">{new Date(run.startedAt).toLocaleString()}</span>
                    </div>
                    {(run.steps as AgentRun['steps']).map((step, i) => (
                      <div key={i} className="text-sm text-gray-400 mt-2 pl-3 border-l border-gray-700">
                        <span className="text-gray-500 text-xs">{step.action}: </span>
                        {step.reasoning?.slice(0, 200)}...
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Test' && (
          <div className="max-w-xl">
            <h3 className="text-white font-semibold mb-4">Test Agent</h3>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Goal</label>
              <textarea value={testGoal} onChange={e => setTestGoal(e.target.value)} rows={4}
                placeholder="e.g. Summarize the latest emails and draft responses to any urgent ones"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] resize-none" />
            </div>
            <button onClick={runAgent} disabled={isRunning || !testGoal.trim()}
              className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50 mb-6">
              {isRunning ? '🧠 Agent is thinking...' : 'Run Agent'}
            </button>

            {runResult && (
              <div className="glass rounded-xl p-4">
                <h4 className="text-white font-medium mb-3">Result</h4>
                {runResult.steps.map((step, i) => (
                  <div key={i} className="mb-3 p-3 bg-gray-900 rounded-lg">
                    <div className="text-xs text-[#C9A227] mb-1">{step.action}</div>
                    <p className="text-gray-300 text-sm">{step.reasoning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
