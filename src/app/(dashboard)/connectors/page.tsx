'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ConnectorManifest } from '@/types';

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'crm', label: 'CRM' },
  { key: 'communication', label: 'Communication' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'developer', label: 'Developer' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'ecommerce', label: 'eCommerce' },
  { key: 'finance', label: 'Finance' },
  { key: 'ai', label: 'AI' },
  { key: 'storage', label: 'Storage' },
  { key: 'payments', label: 'Payments' },
] as const;

const AUTH_TYPE_LABELS: Record<string, string> = {
  oauth2: 'OAuth 2.0',
  api_key: 'API Key',
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
  custom: 'Custom',
};

const AUTH_TYPE_COLORS: Record<string, string> = {
  oauth2: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  api_key: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  bearer: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  basic: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  custom: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
};

const CATEGORY_COLORS: Record<string, string> = {
  crm: 'bg-orange-500/15 text-orange-400',
  communication: 'bg-sky-500/15 text-sky-400',
  productivity: 'bg-green-500/15 text-green-400',
  developer: 'bg-violet-500/15 text-violet-400',
  marketing: 'bg-pink-500/15 text-pink-400',
  ecommerce: 'bg-teal-500/15 text-teal-400',
  finance: 'bg-emerald-500/15 text-emerald-400',
  ai: 'bg-cyan-500/15 text-cyan-400',
  storage: 'bg-indigo-500/15 text-indigo-400',
  payments: 'bg-yellow-500/15 text-yellow-400',
  email: 'bg-red-500/15 text-red-400',
  analytics: 'bg-lime-500/15 text-lime-400',
  social: 'bg-fuchsia-500/15 text-fuchsia-400',
  utility: 'bg-slate-500/15 text-slate-400',
};

function getCategoryLabel(cat: string): string {
  return CATEGORY_TABS.find(t => t.key === cat)?.label ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function ConnectorsMarketplacePage() {
  const router = useRouter();
  const [connectors, setConnectors] = useState<ConnectorManifest[]>([]);
  const [filteredConnectors, setFilteredConnectors] = useState<ConnectorManifest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnectors = async () => {
      try {
        const response = await fetch('/api/connectors');
        const data = await response.json();
        const manifests: ConnectorManifest[] = data.connectors || [];
        setConnectors(manifests);
      } catch (error) {
        console.error('Failed to fetch connectors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConnectors();
  }, []);

  useEffect(() => {
    let filtered = connectors;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query)
      );
    }
    setFilteredConnectors(filtered);
  }, [connectors, selectedCategory, searchQuery]);

  const categoryCounts = connectors.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0f0f1a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Integration Marketplace
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {loading ? (
              'Loading integrations...'
            ) : (
              <>
                <span className="text-[#C9A227] font-semibold">{connectors.length}</span>
                {' integrations available · 6,000+ via Custom HTTP'}
              </>
            )}
          </p>
        </div>
        <a
          href="mailto:support@flowforge.io?subject=Integration Request"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C9A227]/40 text-[#C9A227] text-sm font-medium hover:bg-[#C9A227]/10 transition-all whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Integration
        </a>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search integrations by name, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/30 transition-all text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORY_TABS.map((tab) => {
          const count = tab.key === 'all' ? connectors.length : (categoryCounts[tab.key] || 0);
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0',
                selectedCategory === tab.key
                  ? 'bg-[#C9A227] text-black shadow-lg shadow-[#C9A227]/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-white/10'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                    selectedCategory === tab.key
                      ? 'bg-black/20 text-black'
                      : 'bg-white/10 text-gray-400'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Connectors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-5 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/10" />
                <div className="w-16 h-5 rounded-full bg-white/10" />
              </div>
              <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
              <div className="h-3 bg-white/10 rounded mb-1 w-full" />
              <div className="h-3 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredConnectors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-1">No integrations found</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Try adjusting your search or filter, or{' '}
            <a href="mailto:support@flowforge.io?subject=Integration Request" className="text-[#C9A227] hover:underline">
              request a new integration
            </a>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredConnectors.map((connector) => (
            <ConnectorCard
              key={connector.slug}
              connector={connector}
              onConnect={() => router.push('/connections')}
            />
          ))}
        </div>
      )}

      {/* Footer Banner */}
      <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-[#C9A227]/10 to-transparent border border-[#C9A227]/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#C9A227]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#C9A227]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Need a different app?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Use the{' '}
              <strong className="text-white">Custom HTTP / REST API</strong>{' '}
              connector to integrate with any service that has a REST API. This unlocks support for 6,000+ apps with full authentication, headers, and body configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConnectorCardProps {
  connector: ConnectorManifest;
  onConnect: () => void;
}

function ConnectorCard({ connector, onConnect }: ConnectorCardProps) {
  const [imgError, setImgError] = useState(false);
  const categoryColor = CATEGORY_COLORS[connector.category] || 'bg-gray-500/15 text-gray-400';
  const authColor = AUTH_TYPE_COLORS[connector.authType] || AUTH_TYPE_COLORS.custom;

  return (
    <div className="group relative rounded-xl bg-white/5 border border-white/10 hover:border-[#C9A227]/40 hover:bg-white/[0.07] transition-all duration-200 p-5 flex flex-col">
      {/* Top: Icon + Badges */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
          {!imgError && connector.icon ? (
            <img
              src={connector.icon}
              alt={`${connector.name} icon`}
              className="w-8 h-8 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-2xl font-bold text-white/60">
              {connector.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {connector.isPremium && (
            <span className="px-2 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs font-medium rounded-full">
              Pro
            </span>
          )}
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', authColor)}>
            {AUTH_TYPE_LABELS[connector.authType] || connector.authType}
          </span>
        </div>
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#C9A227] transition-colors">
        {connector.name}
      </h3>

      {/* Category Badge */}
      <span className={cn('inline-flex w-fit px-2 py-0.5 text-xs font-medium rounded-full mb-2', categoryColor)}>
        {getCategoryLabel(connector.category)}
      </span>

      {/* Description */}
      <p className="text-xs text-gray-500 line-clamp-2 flex-1 mb-4 leading-relaxed">
        {connector.description}
      </p>

      {/* Trigger/Action Counts */}
      <div className="flex items-center gap-3 mb-4 text-xs text-gray-600">
        {connector.triggers.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {connector.triggers.length} trigger{connector.triggers.length !== 1 ? 's' : ''}
          </span>
        )}
        {connector.actions.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {connector.actions.length} action{connector.actions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Connect Button */}
      <button
        onClick={onConnect}
        className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-medium hover:bg-[#C9A227]/15 hover:border-[#C9A227]/40 hover:text-[#C9A227] transition-all duration-200"
      >
        Connect
      </button>
    </div>
  );
}
