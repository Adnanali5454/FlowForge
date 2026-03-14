'use client';

import { useEffect, useState } from 'react';
import type { MCPServer, MCPTool } from '@/lib/mcp';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MCPServer['status'] }) {
  const map = {
    connected: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    disconnected: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

// ─── Transport Badge ──────────────────────────────────────────────────────────

function TransportBadge({ transport }: { transport: MCPServer['transport'] }) {
  const map = {
    stdio: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    sse: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    http: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${map[transport]}`}>
      {transport}
    </span>
  );
}

// ─── Server Card ─────────────────────────────────────────────────────────────

function ServerCard({ server }: { server: MCPServer }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#16162a] border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-white font-semibold text-base leading-tight">{server.name}</h3>
            <StatusBadge status={server.status} />
            <TransportBadge transport={server.transport} />
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">{server.description}</p>
        </div>
      </div>

      {/* Connection info */}
      {(server.url || server.command) && (
        <div className="text-xs font-mono text-gray-500 bg-gray-900/50 rounded px-3 py-1.5 truncate">
          {server.url ?? `${server.command}${server.args?.length ? ' ' + server.args.join(' ') : ''}`}
        </div>
      )}

      {/* Tools section */}
      <div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full text-left"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="font-medium">
            {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''}
          </span>
        </button>

        {expanded && (
          <div className="mt-3 flex flex-col gap-2">
            {server.tools.map((tool: MCPTool) => (
              <div
                key={tool.name}
                className="bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2.5"
              >
                <p className="text-sm font-mono text-[#C9A227] font-medium mb-0.5">{tool.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{tool.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Server Form ──────────────────────────────────────────────────────────

interface AddServerFormProps {
  onAdd: (server: MCPServer) => void;
  onCancel: () => void;
}

function AddServerForm({ onAdd, onCancel }: AddServerFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [transport, setTransport] = useState<MCPServer['transport']>('http');
  const [url, setUrl] = useState('');
  const [command, setCommand] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (transport !== 'stdio' && !url.trim()) {
      setError('URL is required for SSE and HTTP transports');
      return;
    }
    if (transport === 'stdio' && !command.trim()) {
      setError('Command is required for stdio transport');
      return;
    }

    setSubmitting(true);
    setError('');

    const server: MCPServer = {
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: name.trim(),
      description: description.trim(),
      transport,
      url: transport !== 'stdio' ? url.trim() : undefined,
      command: transport === 'stdio' ? command.trim() : undefined,
      tools: [],
      status: 'disconnected',
    };

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', server }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to register server');
        return;
      }
      onAdd(server);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#16162a] border border-gray-700 rounded-xl p-6">
      <h3 className="text-white font-semibold text-base mb-4">Add MCP Server</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My MCP Server"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A227] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Transport *</label>
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value as MCPServer['transport'])}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
            >
              <option value="http">HTTP</option>
              <option value="sse">SSE</option>
              <option value="stdio">stdio</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this server do?"
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A227] transition-colors"
          />
        </div>

        {transport !== 'stdio' ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">
              URL * {transport === 'sse' ? '(SSE endpoint)' : '(HTTP endpoint)'}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={transport === 'sse' ? 'http://localhost:3200/sse' : 'http://localhost:3100'}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A227] transition-colors"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Command *</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="mcp-server-my-tool --arg1 value1"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#C9A227] transition-colors"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[#C9A227] hover:bg-[#b8921e] text-[#0C2340] text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding...' : 'Add Server'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">No MCP Servers</h3>
      <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
        Connect MCP servers to give your AI agents additional tools and capabilities
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-[#C9A227] hover:bg-[#b8921e] text-[#0C2340] text-sm font-semibold rounded-lg transition-colors"
      >
        Add Server
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MCPPage() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/mcp')
      .then((r) => r.json())
      .then((data) => {
        setServers(data.servers ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = (server: MCPServer) => {
    setServers((prev) => {
      const exists = prev.findIndex((s) => s.id === server.id);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = server;
        return next;
      }
      return [...prev, server];
    });
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">MCP Servers</h1>
          <p className="text-gray-400 text-sm mt-1">
            Model Context Protocol servers extend your AI agents with additional tools
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A227] hover:bg-[#b8921e] text-[#0C2340] text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add Server
          </button>
        )}
      </div>

      {/* Add Server Form */}
      {showForm && (
        <div className="mb-6">
          <AddServerForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#16162a] border border-gray-800 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-full mb-2" />
              <div className="h-3 bg-gray-800 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : servers.length === 0 && !showForm ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!loading && servers.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-800 flex items-center gap-6 text-sm text-gray-500">
          <span>
            {servers.filter((s) => s.status === 'connected').length} connected
          </span>
          <span>
            {servers.reduce((acc, s) => acc + s.tools.length, 0)} total tools
          </span>
        </div>
      )}
    </div>
  );
}
