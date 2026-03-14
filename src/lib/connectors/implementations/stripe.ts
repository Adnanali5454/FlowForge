import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.stripe.com/v1';

function stripeHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' };
}

function toFormData(obj: Record<string, unknown>): string {
  return Object.entries(obj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

const stripeConnector: ConnectorPlugin = {
  manifest: {
    id: 'stripe',
    slug: 'stripe',
    name: 'Stripe',
    description: 'Process payments and manage customers with Stripe',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    category: 'payments',
    version: '1.0.0',
    isBuiltIn: false,
    isPremium: false,
    authType: 'api_key',
    authConfig: { apiKeyField: 'apiKey', apiKeyLabel: 'Secret Key (sk_...)' },
    triggers: [
      { key: 'new_payment', name: 'New Payment', description: 'Triggers when a payment succeeds', type: 'polling', outputSchema: { type: 'object', properties: { id: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' }, customer: { type: 'string' } } } },
      { key: 'new_customer', name: 'New Customer', description: 'Triggers when a new customer is created', type: 'polling', outputSchema: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' } } } },
    ],
    actions: [
      { key: 'create_customer', name: 'Create Customer', description: 'Create a new Stripe customer', configFields: [{ key: 'email', label: 'Email', type: 'string', required: true }, { key: 'name', label: 'Name', type: 'string', required: false }], outputSchema: { type: 'object', properties: { customerId: { type: 'string' } } } },
      { key: 'create_invoice', name: 'Create Invoice', description: 'Create a Stripe invoice', configFields: [{ key: 'customer', label: 'Customer ID', type: 'string', required: true }, { key: 'amount', label: 'Amount (cents)', type: 'number', required: true }], outputSchema: { type: 'object', properties: { invoiceId: { type: 'string' } } } },
    ],
  },

  async testConnection(credentials) {
    const res = await fetch(`${BASE}/account`, { headers: stripeHeaders(credentials.apiKey) });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const since = (lastPollState.since as number) || Math.floor(Date.now() / 1000) - 300;

    if (triggerKey === 'new_payment') {
      const res = await fetch(`${BASE}/events?type=charge.succeeded&created[gt]=${since}&limit=10`, {
        headers: stripeHeaders(credentials.apiKey),
      });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { data?: Array<{ id: string; data: { object: { id: string; amount: number; currency: string; customer: string } } }> };
      const items = (data.data || []).map(e => ({ id: e.data.object.id, amount: e.data.object.amount, currency: e.data.object.currency, customer: e.data.object.customer }));
      return { newItems: items, nextPollState: { since: Math.floor(Date.now() / 1000) } };
    }

    if (triggerKey === 'new_customer') {
      const res = await fetch(`${BASE}/customers?created[gt]=${since}&limit=10`, {
        headers: stripeHeaders(credentials.apiKey),
      });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { data?: Array<{ id: string; email: string; name: string }> };
      return { newItems: data.data || [], nextPollState: { since: Math.floor(Date.now() / 1000) } };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    if (actionKey === 'create_customer') {
      const { email, name } = params as { email: string; name?: string };
      const body: Record<string, unknown> = { email };
      if (name) body.name = name;

      const res = await fetch(`${BASE}/customers`, {
        method: 'POST',
        headers: stripeHeaders(credentials.apiKey),
        body: toFormData(body),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: { message: string } };
        return { success: false, error: err.error?.message || 'Failed to create customer' };
      }
      const data = await res.json() as { id: string };
      return { success: true, data: { customerId: data.id } };
    }

    if (actionKey === 'create_invoice') {
      const { customer, amount } = params as { customer: string; amount: number };
      const res = await fetch(`${BASE}/invoiceitems`, {
        method: 'POST',
        headers: stripeHeaders(credentials.apiKey),
        body: toFormData({ customer, amount, currency: 'usd' }),
      });
      if (!res.ok) return { success: false, error: 'Failed to create invoice item' };

      const invRes = await fetch(`${BASE}/invoices`, {
        method: 'POST',
        headers: stripeHeaders(credentials.apiKey),
        body: toFormData({ customer }),
      });
      if (!invRes.ok) return { success: false, error: 'Failed to create invoice' };
      const inv = await invRes.json() as { id: string };
      return { success: true, data: { invoiceId: inv.id } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default stripeConnector;
