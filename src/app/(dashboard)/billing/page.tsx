'use client';

import { useState } from 'react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    tasks: 100,
    workflows: 3,
    connectors: 3,
    features: ['100 tasks/month', '3 active workflows', '3 connectors', 'Community support'],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    tasks: 5000,
    workflows: 25,
    connectors: 20,
    features: ['5,000 tasks/month', '25 active workflows', '20 connectors', 'Email support', '2-min polling'],
    cta: 'Upgrade to Starter',
    highlighted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    tasks: 50000,
    workflows: 200,
    connectors: 100,
    features: ['50,000 tasks/month', '200 active workflows', '100+ connectors', 'Priority support', '1-min polling', 'Custom domains', 'Version history'],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    tasks: null,
    workflows: null,
    connectors: null,
    features: ['Unlimited tasks', 'Unlimited workflows', 'All connectors', 'Dedicated support', 'Custom SLA', 'SSO/SAML', 'Audit logs', 'On-premise option'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const INVOICES = [
  { id: 'INV-001', date: 'Mar 1, 2026', amount: '$99.00', status: 'Paid', plan: 'Professional' },
  { id: 'INV-002', date: 'Feb 1, 2026', amount: '$99.00', status: 'Paid', plan: 'Professional' },
  { id: 'INV-003', date: 'Jan 1, 2026', amount: '$29.00', status: 'Paid', plan: 'Starter' },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const currentPlan = 'free';
  const usedTasks = 47;
  const maxTasks = 100;
  const usagePct = (usedTasks / maxTasks) * 100;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Billing & Plans</h1>
        <p className="text-gray-400 text-sm">Manage your subscription and usage</p>
      </div>

      {/* Current Usage */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
          <p className="text-xl font-bold text-white">Free</p>
          <p className="text-xs text-gray-400 mt-1">Resets Apr 1, 2026</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tasks Used</p>
          <p className="text-xl font-bold text-white">{usedTasks} <span className="text-gray-500 text-sm font-normal">/ {maxTasks}</span></p>
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usagePct}%`,
                background: usagePct > 80 ? '#ef4444' : '#C9A227',
              }}
            />
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Workflows</p>
          <p className="text-xl font-bold text-white">0 <span className="text-gray-500 text-sm font-normal">/ 3</span></p>
          <p className="text-xs text-gray-400 mt-1">0 running now</p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Choose a Plan</h2>
        <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-[#C9A227] text-[#0C2340]' : 'text-gray-400'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${billing === 'annual' ? 'bg-[#C9A227] text-[#0C2340]' : 'text-gray-400'}`}
          >
            Annual <span className="text-xs opacity-75">save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-4 gap-4 mb-12">
        {PLANS.map((plan) => {
          const price = billing === 'annual' && plan.price ? Math.round(plan.price * 0.8) : plan.price;
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`rounded-xl p-5 border transition-all relative ${
                plan.highlighted
                  ? 'border-[#C9A227] bg-[#C9A227]/5'
                  : 'glass border-white/10'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A227] text-[#0C2340] text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </div>
              )}
              <h3 className="text-white font-bold mb-1">{plan.name}</h3>
              <div className="mb-4">
                {price !== null ? (
                  <span className="text-3xl font-bold text-white">
                    ${price}
                    <span className="text-sm text-gray-500 font-normal">/mo</span>
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-white">Custom</span>
                )}
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-[#C9A227] mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                  isCurrent
                    ? 'bg-gray-700 text-gray-400 cursor-default'
                    : plan.highlighted
                    ? 'bg-[#C9A227] text-[#0C2340] hover:bg-[#D4AF37]'
                    : plan.id === 'enterprise'
                    ? 'border border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227]/10'
                    : 'border border-gray-600 text-white hover:border-gray-400'
                }`}
                disabled={isCurrent}
              >
                {isCurrent ? 'Current Plan' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Invoice History</h2>
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Invoice</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Plan</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-sm text-white font-medium">{inv.id}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{inv.date}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{inv.plan}</td>
                  <td className="px-5 py-3 text-sm text-white">{inv.amount}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs text-[#C9A227] hover:underline">Download PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {INVOICES.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-sm">No invoices yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
