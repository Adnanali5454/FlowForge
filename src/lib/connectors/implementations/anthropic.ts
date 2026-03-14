import type { ConnectorPlugin, ActionResult } from '@/lib/connectors/base';

const anthropicConnector: ConnectorPlugin = {
  manifest: {
    id: 'anthropic',
    slug: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Use Claude Sonnet, Opus, and Haiku in your workflows',
    icon: 'https://claude.ai/favicon.ico',
    category: 'ai',
    version: '1.0.0',
    isBuiltIn: false,
    isPremium: false,
    authType: 'api_key',
    authConfig: { apiKeyField: 'apiKey', apiKeyLabel: 'API Key (sk-ant-...)' },
    triggers: [],
    actions: [
      { key: 'send_message', name: 'Send Message', description: 'Generate text with Claude', configFields: [{ key: 'prompt', label: 'User Prompt', type: 'string', required: true }, { key: 'systemPrompt', label: 'System Prompt', type: 'string', required: false }, { key: 'model', label: 'Model', type: 'string', required: false }, { key: 'maxTokens', label: 'Max Tokens', type: 'number', required: false }], outputSchema: { type: 'object', properties: { content: { type: 'string' }, tokensUsed: { type: 'number' } } } },
    ],
  },

  async testConnection(credentials) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': credentials.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    if (actionKey === 'send_message') {
      const { prompt, systemPrompt, model = 'claude-sonnet-4-5-20250514', maxTokens = 2048 } = params as { prompt: string; systemPrompt?: string; model?: string; maxTokens?: number };

      const body: Record<string, unknown> = {
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      };
      if (systemPrompt) body.system = systemPrompt;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': credentials.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Anthropic API error: ${err}` };
      }

      const data = await res.json() as { content: Array<{ text: string }>; usage: { input_tokens: number; output_tokens: number } };
      return {
        success: true,
        data: {
          content: data.content[0]?.text || '',
          tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default anthropicConnector;
