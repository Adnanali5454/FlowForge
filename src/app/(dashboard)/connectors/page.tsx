'use client';

import { cn } from '@/lib/utils';

const CONNECTORS = [
  { slug: 'webhook', name: 'Webhooks', category: 'Utility', icon: '🔗', status: 'active', connections: 0 },
  { slug: 'scheduler', name: 'Schedule', category: 'Utility', icon: '⏰', status: 'active', connections: 0 },
  { slug: 'gmail', name: 'Gmail', category: 'Communication', icon: '📧', status: 'coming_soon', connections: 0 },
  { slug: 'slack', name: 'Slack', category: 'Communication', icon: '💬', status: 'coming_soon', connections: 0 },
  { slug: 'google-sheets', name: 'Google Sheets', category: 'Productivity', icon: '📊', status: 'coming_soon', connections: 0 },
  { slug: 'stripe', name: 'Stripe', category: 'Finance', icon: '💳', status: 'coming_soon', connections: 0 },
  { slug: 'hubspot', name: 'HubSpot', category: 'CRM', icon: '🎯', status: 'coming_soon', connections: 0 },
  { slug: 'notion', name: 'Notion', category: 'Productivity', icon: '📝', status: 'coming_soon', connections: 0 },
  { slug: 'airtable', name: 'Airtable', category: 'Productivity', icon: '🗃️', status: 'coming_soon', connections: 0 },
  { slug: 'openai', name: 'OpenAI', category: 'AI', icon: '🤖', status: 'coming_soon', connections: 0 },
  { slug: 'anthropic', name: 'Anthropic Claude', category: 'AI', icon: '🧠', status: 'coming_soon', connections: 0 },
  { slug: 'shopify', name: 'Shopify', category: 'E-commerce', icon: '🛍️', status: 'coming_soon', connections: 0 },
];

export default function ConnectorsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Connectors</h1>
        <p className="text-gray-400 text-sm mt-1">
          {CONNECTORS.length} connectors available · Connect your apps and services
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CONNECTORS.map((connector) => (
          <div
            key={connector.slug}
            className={cn(
              'glass rounded-xl p-5 transition-all cursor-pointer group',
              connector.status === 'active'
                ? 'hover:border-[#C9A227] hover:border-opacity-50'
                : 'opacity-60 hover:opacity-80'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{connector.icon}</span>
              {connector.status === 'active' ? (
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full">
                  Coming Soon
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#C9A227] transition-colors">
              {connector.name}
            </h3>
            <p className="text-xs text-gray-500">{connector.category}</p>
            {connector.connections > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {connector.connections} connection{connector.connections !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
