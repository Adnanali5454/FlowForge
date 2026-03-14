import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

function shopifyBase(shop: string): string {
  return `https://${shop}.myshopify.com/admin/api/2024-01`;
}

function shopifyHeaders(accessToken: string): Record<string, string> {
  return {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  };
}

const shopifyConnector: ConnectorPlugin = {
  manifest: {
    id: 'shopify',
    slug: 'shopify',
    name: 'Shopify',
    description: 'E-commerce and order management with Shopify',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg',
    category: 'ecommerce',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'api_key',
    authConfig: {
      type: 'api_key',
      headerName: 'X-Shopify-Access-Token',
      apiKeyField: 'access_token',
      apiKeyLabel: 'Access Token',
    },
    triggers: [
      {
        key: 'new_order',
        name: 'New Order',
        description: 'Triggers when a new order is placed in Shopify',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            order_number: { type: 'number' },
            email: { type: 'string' },
            total_price: { type: 'string' },
            financial_status: { type: 'string' },
            created_at: { type: 'string' },
          },
        },
      },
      {
        key: 'new_customer',
        name: 'New Customer',
        description: 'Triggers when a new customer account is created',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            created_at: { type: 'string' },
          },
        },
      },
      {
        key: 'order_fulfilled',
        name: 'Order Fulfilled',
        description: 'Triggers when an order is fulfilled',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            order_number: { type: 'number' },
            fulfillment_status: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'create_product',
        name: 'Create Product',
        description: 'Create a new product in Shopify',
        configFields: [
          { key: 'title', label: 'Product Title', type: 'string', required: true },
          { key: 'body_html', label: 'Description (HTML)', type: 'textarea', required: false },
          { key: 'vendor', label: 'Vendor', type: 'string', required: false },
          { key: 'product_type', label: 'Product Type', type: 'string', required: false },
          { key: 'price', label: 'Price', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, title: { type: 'string' } } },
      },
      {
        key: 'update_order',
        name: 'Update Order',
        description: 'Update an existing order in Shopify',
        configFields: [
          { key: 'order_id', label: 'Order ID', type: 'number', required: true },
          { key: 'note', label: 'Note', type: 'textarea', required: false },
          { key: 'email', label: 'Email', type: 'string', required: false },
          { key: 'tags', label: 'Tags', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, order_number: { type: 'number' } } },
      },
      {
        key: 'create_customer',
        name: 'Create Customer',
        description: 'Create a new customer in Shopify',
        configFields: [
          { key: 'first_name', label: 'First Name', type: 'string', required: false },
          { key: 'last_name', label: 'Last Name', type: 'string', required: false },
          { key: 'email', label: 'Email', type: 'string', required: true },
          { key: 'phone', label: 'Phone', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { id: { type: 'number' }, email: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const base = shopifyBase(credentials.shop);
    const headers = shopifyHeaders(credentials.access_token);
    const res = await fetch(`${base}/shop.json`, { headers });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const base = shopifyBase(credentials.shop);
    const headers = shopifyHeaders(credentials.access_token);
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (triggerKey === 'new_order') {
      const res = await fetch(`${base}/orders.json?created_at_min=${encodeURIComponent(since)}&limit=50&status=any`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { orders?: Record<string, unknown>[] };
      return {
        newItems: data.orders || [],
        nextPollState: { since: new Date().toISOString() },
      };
    }

    if (triggerKey === 'new_customer') {
      const res = await fetch(`${base}/customers.json?created_at_min=${encodeURIComponent(since)}&limit=50`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { customers?: Record<string, unknown>[] };
      return {
        newItems: data.customers || [],
        nextPollState: { since: new Date().toISOString() },
      };
    }

    if (triggerKey === 'order_fulfilled') {
      const res = await fetch(`${base}/orders.json?fulfillment_status=fulfilled&updated_at_min=${encodeURIComponent(since)}&limit=50&status=any`, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { orders?: Record<string, unknown>[] };
      return {
        newItems: data.orders || [],
        nextPollState: { since: new Date().toISOString() },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const base = shopifyBase(credentials.shop);
    const headers = shopifyHeaders(credentials.access_token);

    if (actionKey === 'create_product') {
      const { title, body_html, vendor, product_type, price } = params as {
        title: string;
        body_html?: string;
        vendor?: string;
        product_type?: string;
        price?: string;
      };
      const product: Record<string, unknown> = { title };
      if (body_html) product.body_html = body_html;
      if (vendor) product.vendor = vendor;
      if (product_type) product.product_type = product_type;
      if (price) product.variants = [{ price }];

      const res = await fetch(`${base}/products.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ product }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Shopify create_product failed: ${err}` };
      }
      const data = await res.json() as { product: { id: number; title: string } };
      return { success: true, data: { id: data.product.id, title: data.product.title } };
    }

    if (actionKey === 'update_order') {
      const { order_id, note, email, tags } = params as {
        order_id: number;
        note?: string;
        email?: string;
        tags?: string;
      };
      const order: Record<string, unknown> = {};
      if (note !== undefined) order.note = note;
      if (email) order.email = email;
      if (tags !== undefined) order.tags = tags;

      const res = await fetch(`${base}/orders/${order_id}.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ order }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Shopify update_order failed: ${err}` };
      }
      const data = await res.json() as { order: { id: number; order_number: number } };
      return { success: true, data: { id: data.order.id, order_number: data.order.order_number } };
    }

    if (actionKey === 'create_customer') {
      const { first_name, last_name, email, phone } = params as {
        first_name?: string;
        last_name?: string;
        email: string;
        phone?: string;
      };
      const customer: Record<string, unknown> = { email };
      if (first_name) customer.first_name = first_name;
      if (last_name) customer.last_name = last_name;
      if (phone) customer.phone = phone;

      const res = await fetch(`${base}/customers.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ customer }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Shopify create_customer failed: ${err}` };
      }
      const data = await res.json() as { customer: { id: number; email: string } };
      return { success: true, data: { id: data.customer.id, email: data.customer.email } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default shopifyConnector;
