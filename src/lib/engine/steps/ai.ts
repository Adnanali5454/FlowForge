// ─── AI Step Executor ────────────────────────────────────────────────────────
// Executes AI prompts via HTTP to external APIs (Anthropic, OpenAI, Google).
// Supports: claude-sonnet-4-5-20250514, gpt-4o, gemini-pro
// Returns: { model, output, tokensUsed, durationMs }

import type { AiConfig } from '@/types';
import { resolveTemplate } from '@/lib/utils';

export interface AiResult {
  model: string;
  output: string | Record<string, unknown>;
  tokensUsed: number | null;
  durationMs: number;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface OpenAiRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

interface OpenAiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GoogleRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
}

interface GoogleResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
  };
}

/**
 * Execute an AI step with support for multiple AI providers.
 */
export async function executeAi(
  config: AiConfig,
  inputData: Record<string, unknown>
): Promise<AiResult> {
  const startTime = Date.now();

  // Resolve the prompt template using input data
  const resolvedPrompt = resolveTemplate(config.prompt, inputData);
  const resolvedSystemPrompt = resolveTemplate(config.systemPrompt, inputData);

  try {
    switch (config.model) {
      case 'claude-sonnet-4-5-20250514':
      case 'claude-opus-4-5-20250414':
        return await executeAnthropicAi(
          config.model,
          resolvedPrompt,
          resolvedSystemPrompt,
          config.temperature,
          config.maxTokens,
          config.outputFormat,
          startTime
        );

      case 'gpt-4o':
        return await executeOpenAiAi(
          config.model,
          resolvedPrompt,
          resolvedSystemPrompt,
          config.temperature,
          config.maxTokens,
          config.outputFormat,
          startTime
        );

      case 'gemini-pro':
        return await executeGoogleAi(
          config.model,
          resolvedPrompt,
          resolvedSystemPrompt,
          config.temperature,
          config.maxTokens,
          config.outputFormat,
          startTime
        );

      default:
        throw new Error(`Unsupported AI model: ${config.model}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`AI step failed: ${message}`);
  }
}

/**
 * Execute via Anthropic API (Claude models)
 */
async function executeAnthropicAi(
  model: string,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  outputFormat: string,
  startTime: number
): Promise<AiResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const request: AnthropicRequest = {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errorData}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const textContent = data.content.find((c) => c.type === 'text');
  if (!textContent) {
    throw new Error('No text content in Anthropic response');
  }

  const output =
    outputFormat === 'json'
      ? parseJsonOutput(textContent.text)
      : textContent.text;

  return {
    model,
    output,
    tokensUsed:
      (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    durationMs: Date.now() - startTime,
  };
}

/**
 * Execute via OpenAI API (GPT models)
 */
async function executeOpenAiAi(
  model: string,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  outputFormat: string,
  startTime: number
): Promise<AiResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const request: OpenAiRequest = {
    model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
  }

  const data = (await response.json()) as OpenAiResponse;
  const choice = data.choices[0];
  if (!choice || !choice.message) {
    throw new Error('No message in OpenAI response');
  }

  const output =
    outputFormat === 'json'
      ? parseJsonOutput(choice.message.content)
      : choice.message.content;

  return {
    model,
    output,
    tokensUsed: data.usage?.total_tokens ?? null,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Execute via Google AI API (Gemini models)
 */
async function executeGoogleAi(
  model: string,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  outputFormat: string,
  startTime: number
): Promise<AiResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
  }

  const request: GoogleRequest = {
    contents: [
      {
        parts: [
          {
            text: `${systemPrompt}\n\n${prompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Google AI API error: ${response.status} ${errorData}`);
  }

  const data = (await response.json()) as GoogleResponse;
  const candidate = data.candidates[0];
  if (!candidate || !candidate.content.parts[0]) {
    throw new Error('No content in Google AI response');
  }

  const textContent = candidate.content.parts[0].text;
  const output =
    outputFormat === 'json'
      ? parseJsonOutput(textContent)
      : textContent;

  return {
    model,
    output,
    tokensUsed:
      (data.usageMetadata?.promptTokenCount ?? 0) +
      (data.usageMetadata?.candidatesTokenCount ?? 0),
    durationMs: Date.now() - startTime,
  };
}

/**
 * Parse JSON output, with fallback to string if invalid JSON
 */
function parseJsonOutput(text: string): string | Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Return as string if not valid JSON
    return text;
  }
}
