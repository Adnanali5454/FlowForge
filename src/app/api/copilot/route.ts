import { NextRequest, NextResponse } from 'next/server';
import type { StepConfig, TriggerConfig } from '@/types';
import { nanoid } from 'nanoid';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

interface CopilotResponse {
  trigger: TriggerConfig;
  steps: StepConfig[];
}

function generateId(prefix: string): string {
  return `${prefix}_${nanoid(10)}`;
}

function buildDefaultErrorHandling() {
  return {
    onError: 'halt' as const,
    maxRetries: 0,
    retryDelayMs: 1000,
    retryBackoff: 'fixed' as const,
    routeToStepId: null,
    notifyOnError: true,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<CopilotResponse | { error: string }>> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session?.workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { prompt?: string };
    const prompt = (body.prompt as string ?? '').trim();
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

    // PRIMARY: Real Claude API
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: `You are a workflow automation assistant for FlowForge (similar to Zapier).
Given a user description, return ONLY a valid JSON object. No explanation. No markdown. No code blocks. Pure JSON only.
The JSON must match this structure: { "trigger": TriggerConfig, "steps": StepConfig[] }
Trigger types: webhook | schedule | manual | app-event
Step types: action | filter | path | delay | loop | formatter | code | http | ai | human-in-the-loop | sub-workflow | digest | storage | error-handler
Connector slugs: slack | gmail | stripe | hubspot | notion | airtable | github | discord | shopify | jira | linear | salesforce | google-sheets | google-calendar | mailchimp | twilio | zendesk | pipedrive | intercom | asana | microsoft-teams | dropbox | zoom
For each step include: id (short random string), type, name, description, connectorId (or null), actionKey, config (matching the step type), inputMapping ({}), outputSchema ({ type: "object", properties: {} }), errorHandling ({ onError: "halt", maxRetries: 0, retryDelayMs: 1000, retryBackoff: "fixed", routeToStepId: null, notifyOnError: true }), position ({x:250, y: 220 + index*170}), conditions ([]), nextStepIds ([])`,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const text = (aiData.content?.[0]?.text ?? '') as string;
          try {
            const parsed = JSON.parse(text);
            if (parsed.trigger && Array.isArray(parsed.steps)) {
              return NextResponse.json(parsed);
            }
          } catch { /* fall through to keyword matching */ }
        }
      } catch { /* fall through to keyword matching */ }
    }

    // FALLBACK: keyword matching
    const lower = prompt.toLowerCase();

    // Determine trigger based on keywords
    let trigger: TriggerConfig;

    if (lower.includes('stripe') || lower.includes('payment')) {
      trigger = {
        id: generateId('trg'),
        type: 'app-event',
        connectorId: 'stripe',
        eventKey: 'new_payment',
        config: {},
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Payment ID' },
            amount: { type: 'number', description: 'Payment amount' },
            currency: { type: 'string', description: 'Currency code' },
            customer_email: { type: 'string', description: 'Customer email' },
            status: { type: 'string', description: 'Payment status' },
          },
        },
        position: { x: 250, y: 50 },
      };
    } else if (lower.includes('gmail') || lower.includes('email')) {
      trigger = {
        id: generateId('trg'),
        type: 'app-event',
        connectorId: 'gmail',
        eventKey: 'new_email',
        config: {},
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Message ID' },
            subject: { type: 'string', description: 'Email subject' },
            from: { type: 'string', description: 'Sender email' },
            body: { type: 'string', description: 'Email body' },
            receivedAt: { type: 'string', description: 'Received timestamp' },
          },
        },
        position: { x: 250, y: 50 },
      };
    } else if (lower.includes('form') || lower.includes('submit') || lower.includes('crm')) {
      trigger = {
        id: generateId('trg'),
        type: 'webhook',
        connectorId: null,
        eventKey: 'form_submit',
        config: {},
        outputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Submitter name' },
            email: { type: 'string', description: 'Submitter email' },
            data: { type: 'object', description: 'Form data payload' },
          },
        },
        position: { x: 250, y: 50 },
      };
    } else if (lower.includes('schedule') || lower.includes('daily') || lower.includes('digest') || lower.includes('every')) {
      trigger = {
        id: generateId('trg'),
        type: 'schedule',
        connectorId: null,
        eventKey: 'cron',
        config: { cron: '0 9 * * *' },
        outputSchema: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', description: 'Trigger timestamp' },
            runId: { type: 'string', description: 'Run identifier' },
          },
        },
        position: { x: 250, y: 50 },
      };
    } else if (lower.includes('webhook') || lower.includes('http') || lower.includes('error') || lower.includes('alert')) {
      trigger = {
        id: generateId('trg'),
        type: 'webhook',
        connectorId: null,
        eventKey: 'webhook_received',
        config: {},
        outputSchema: {
          type: 'object',
          properties: {
            payload: { type: 'object', description: 'Webhook payload' },
            headers: { type: 'object', description: 'Request headers' },
          },
        },
        position: { x: 250, y: 50 },
      };
    } else {
      trigger = {
        id: generateId('trg'),
        type: 'manual',
        connectorId: null,
        eventKey: 'manual_trigger',
        config: {},
        outputSchema: { type: 'object', properties: {} },
        position: { x: 250, y: 50 },
      };
    }

    // Build steps based on keywords
    const steps: StepConfig[] = [];
    let yPos = 220;

    // Slack step
    if (lower.includes('slack') || lower.includes('notify') || lower.includes('notification') || lower.includes('alert')) {
      steps.push({
        id: generateId('step'),
        type: 'action',
        name: 'Slack → Send Message',
        description: 'Send a Slack notification',
        connectorId: 'slack',
        actionKey: 'send_message',
        config: {
          type: 'action',
          connectorId: 'slack',
          actionKey: 'send_message',
          params: {
            channel: '#notifications',
            text: '{{ trigger.subject }}',
          },
        },
        inputMapping: {},
        outputSchema: {
          type: 'object',
          properties: {
            ts: { type: 'string', description: 'Message timestamp' },
            channel: { type: 'string', description: 'Channel ID' },
          },
        },
        errorHandling: buildDefaultErrorHandling(),
        position: { x: 250, y: yPos },
        conditions: [],
        nextStepIds: [],
      });
      yPos += 170;
    }

    // Table / spreadsheet step
    if (
      lower.includes('table') ||
      lower.includes('spreadsheet') ||
      lower.includes('sheet') ||
      lower.includes('row') ||
      lower.includes('backup')
    ) {
      steps.push({
        id: generateId('step'),
        type: 'action',
        name: 'FlowForge Table → Add Row',
        description: 'Insert a new row into a FlowForge table',
        connectorId: 'flowforge_tables',
        actionKey: 'add_row',
        config: {
          type: 'action',
          connectorId: 'flowforge_tables',
          actionKey: 'add_row',
          params: {
            tableId: '',
            data: '{{ trigger }}',
          },
        },
        inputMapping: {},
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'New row ID' },
            createdAt: { type: 'string', description: 'Creation timestamp' },
          },
        },
        errorHandling: buildDefaultErrorHandling(),
        position: { x: 250, y: yPos },
        conditions: [],
        nextStepIds: [],
      });
      yPos += 170;
    }

    // Email step (non-gmail trigger)
    if (
      (lower.includes('email') && !lower.includes('gmail')) ||
      lower.includes('send email') ||
      lower.includes('digest email')
    ) {
      steps.push({
        id: generateId('step'),
        type: 'action',
        name: 'Gmail → Send Email',
        description: 'Send an email via Gmail',
        connectorId: 'gmail',
        actionKey: 'send_email',
        config: {
          type: 'action',
          connectorId: 'gmail',
          actionKey: 'send_email',
          params: {
            to: '{{ trigger.email }}',
            subject: 'Workflow Notification',
            body: '{{ trigger }}',
          },
        },
        inputMapping: {},
        outputSchema: {
          type: 'object',
          properties: {
            messageId: { type: 'string', description: 'Sent message ID' },
          },
        },
        errorHandling: buildDefaultErrorHandling(),
        position: { x: 250, y: yPos },
        conditions: [],
        nextStepIds: [],
      });
      yPos += 170;
    }

    // HubSpot / CRM step
    if (lower.includes('hubspot') || lower.includes('crm') || lower.includes('contact') || lower.includes('lead')) {
      steps.push({
        id: generateId('step'),
        type: 'action',
        name: 'HubSpot → Create Contact',
        description: 'Create or update a CRM contact',
        connectorId: 'hubspot',
        actionKey: 'create_contact',
        config: {
          type: 'action',
          connectorId: 'hubspot',
          actionKey: 'create_contact',
          params: {
            email: '{{ trigger.email }}',
            firstname: '{{ trigger.name }}',
          },
        },
        inputMapping: {},
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Contact ID' },
            email: { type: 'string', description: 'Contact email' },
          },
        },
        errorHandling: buildDefaultErrorHandling(),
        position: { x: 250, y: yPos },
        conditions: [],
        nextStepIds: [],
      });
      yPos += 170;
    }

    // If no specific steps matched, add a generic HTTP step
    if (steps.length === 0) {
      steps.push({
        id: generateId('step'),
        type: 'http',
        name: 'HTTP Request',
        description: 'Make an HTTP request with the trigger data',
        connectorId: null,
        actionKey: '',
        config: {
          type: 'http',
          method: 'POST',
          url: 'https://example.com/webhook',
          headers: { 'Content-Type': 'application/json' },
          body: '{{ trigger }}',
          bodyType: 'json',
          auth: null,
          timeout: 30000,
          followRedirects: true,
        },
        inputMapping: {},
        outputSchema: {
          type: 'object',
          properties: {
            status: { type: 'number', description: 'HTTP status code' },
            body: { type: 'object', description: 'Response body' },
          },
        },
        errorHandling: buildDefaultErrorHandling(),
        position: { x: 250, y: yPos },
        conditions: [],
        nextStepIds: [],
      });
    }

    const response: CopilotResponse = { trigger, steps };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Failed to process prompt' }, { status: 400 });
  }
}
