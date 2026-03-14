'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ConnectorManifest } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  communication: 'Communication',
  crm: 'CRM',
  productivity: 'Productivity',
  developer: 'Developer',
  marketing: 'Marketing',
  finance: 'Finance',
  ecommerce: 'E-commerce',
  social: 'Social',
  analytics: 'Analytics',
  ai: 'AI',
  storage: 'Storage',
  utility: 'Utility',
};

interface ConnectorDisplay {
  slug: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  status: 'active' | 'available';
  isPremium: boolean;
  connections: number;
}

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorDisplay[]>([]);
  const [filteredConnectors, setFilteredConnectors] = useState<ConnectorDisplay[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnectors = async () => {
      try {
        const response = await fetch('/api/connectors');
        const data = await response.json();

        const manifests: ConnectorManifest[] = data.connectors || [];

        const displays: ConnectorDisplay[] = manifests.map((m) => ({
          slug: m.slug,
          name: m.name,
          category: m.category,
          icon: m.icon,
          description: m.description,
          status: (m.slug === 'webhook' || m.slug === 'scheduler') ? 'active' : 'available',
          isPremium: m.isPremium,
          connections: 0,
        }));

        setConnectors(displays);
      } catch (error) {
        console.error('Failed to fetch connectors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectors();
  }, []);

  // Filter connectors based on category and search
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
          c.description.toLowerCase().includes(query)
      );
    }

    setFilteredConnectors(filtered);
  }, [connectors, selectedCategory, searchQuery]);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)] as const;
  const activeCount = connectors.filter((c) => c.status === 'active').length;
  const availableCount = connectors.filter((c) => c.status === 'available').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Connectors</h1>
        <p className="text-gray-400 text-sm mt-1">
          {activeCount} active · {availableCount}+ available · 6,000+ via HTTP
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search connectors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A227]"
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              selectedCategory === cat
                ? 'bg-[#C9A227] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Connectors Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          Loading connectors...
        </div>
      ) : filteredConnectors.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No connectors found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredConnectors.map((connector) => (
            <div
              key={connector.slug}
              className={cn(
                'glass rounded-xl p-5 transition-all cursor-pointer group relative',
                connector.status === 'active'
                  ? 'hover:border-[#C9A227] hover:border-opacity-50'
                  : 'opacity-75 hover:opacity-90'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{connector.icon}</span>
                <div className="flex gap-1">
                  {connector.isPremium && (
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-full">
                      Pro
                    </span>
                  )}
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      connector.status === 'active'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-blue-500/10 text-blue-400'
                    )}
                  >
                    {connector.status === 'active' ? 'Active' : 'Available'}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#C9A227] transition-colors">
                {connector.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {CATEGORY_LABELS[connector.category] || connector.category}
              </p>
              <p className="text-xs text-gray-400 line-clamp-2">
                {connector.description}
              </p>
              {connector.connections > 0 && (
                <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">
                  {connector.connections} connection{connector.connections !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-12 p-6 rounded-lg bg-gray-900/50 border border-gray-800">
        <h3 className="text-sm font-semibold text-white mb-2">Need a different app?</h3>
        <p className="text-sm text-gray-400">
          Use the <strong>Custom HTTP / REST API</strong> connector to integrate with any service that has a REST API. This enables support for 6,000+ apps.
        </p>
      </div>
    </div>
  );
}
