import { NextRequest, NextResponse } from 'next/server';
import type { StepConfig, TriggerConfig } from '@/types';
import { nanoid } from 'nanoid';

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
  try {
    const body = await request.json() as { prompt?: string };
    const prompt = (body.prompt ?? '').toLowerCase();

    // Determine trigger based on keywords
    let trigger: TriggerConfig;

    if (prompt.includes('stripe') || prompt.includes('payment')) {
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
    } else if (prompt.includes('gmail') || prompt.includes('email')) {
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
    } else if (prompt.includes('form') || prompt.includes('submit') || prompt.includes('crm')) {
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
    } else if (prompt.includes('schedule') || prompt.includes('daily') || prompt.includes('digest') || prompt.includes('every')) {
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
    } else if (prompt.includes('webhook') || prompt.includes('http') || prompt.includes('error') || prompt.includes('alert')) {
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
    if (prompt.includes('slack') || prompt.includes('notify') || prompt.includes('notification') || prompt.includes('alert')) {
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
      prompt.includes('table') ||
      prompt.includes('spreadsheet') ||
      prompt.includes('sheet') ||
      prompt.includes('row') ||
      prompt.includes('backup')
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
      (prompt.includes('email') && !prompt.includes('gmail')) ||
      prompt.includes('send email') ||
      prompt.includes('digest email')
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
    if (prompt.includes('hubspot') || prompt.includes('crm') || prompt.includes('contact') || prompt.includes('lead')) {
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
