import type { ConnectorPlugin, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://api.openai.com/v1';

const openaiConnector: ConnectorPlugin = {
  manifest: {
    id: 'openai',
    slug: 'openai',
    name: 'OpenAI',
    description: 'Use GPT-4o and other OpenAI models in your workflows',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    category: 'ai',
    version: '1.0.0',
    isBuiltIn: false,
    isPremium: false,
    authType: 'api_key',
    authConfig: { apiKeyField: 'apiKey', apiKeyLabel: 'API Key (sk-...)' },
    triggers: [],
    actions: [
      { key: 'chat_completion', name: 'Chat Completion', description: 'Generate text with GPT-4o', configFields: [{ key: 'prompt', label: 'Prompt', type: 'string', required: true }, { key: 'model', label: 'Model', type: 'string', required: false }, { key: 'systemPrompt', label: 'System Prompt', type: 'string', required: false }], outputSchema: { type: 'object', properties: { content: { type: 'string' }, tokensUsed: { type: 'number' } } } },
      { key: 'create_image', name: 'Create Image', description: 'Generate an image with DALL-E', configFields: [{ key: 'prompt', label: 'Prompt', type: 'string', required: true }, { key: 'size', label: 'Size', type: 'string', required: false }], outputSchema: { type: 'object', properties: { url: { type: 'string' } } } },
    ],
  },

  async testConnection(credentials) {
    const res = await fetch(`${BASE}/models`, {
      headers: { Authorization: `Bearer ${credentials.apiKey}` },
    });
    return res.ok;
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    if (actionKey === 'chat_completion') {
      const { prompt, model = 'gpt-4o', systemPrompt } = params as { prompt: string; model?: string; systemPrompt?: string };
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${credentials.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: 2048 }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `OpenAI error: ${err}` };
      }

      const data = await res.json() as { choices: Array<{ message: { content: string } }>; usage: { total_tokens: number } };
      return {
        success: true,
        data: {
          content: data.choices[0]?.message?.content || '',
          tokensUsed: data.usage?.total_tokens || 0,
        },
      };
    }

    if (actionKey === 'create_image') {
      const { prompt, size = '1024x1024' } = params as { prompt: string; size?: string };
      const res = await fetch(`${BASE}/images/generations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${credentials.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size }),
      });

      if (!res.ok) return { success: false, error: 'Failed to generate image' };
      const data = await res.json() as { data: Array<{ url: string }> };
      return { success: true, data: { url: data.data[0]?.url } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default openaiConnector;
