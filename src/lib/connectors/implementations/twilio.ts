import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

function twilioBase(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
}

function twilioHeaders(accountSid: string, authToken: string): Record<string, string> {
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

function toFormData(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

const twilioConnector: ConnectorPlugin = {
  manifest: {
    id: 'twilio',
    slug: 'twilio',
    name: 'Twilio',
    description: 'SMS, voice, and messaging with Twilio',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Twilio-logo-red.svg/1280px-Twilio-logo-red.svg.png',
    category: 'communication',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'basic',
    authConfig: {
      type: 'basic',
      usernameField: 'account_sid',
      passwordField: 'auth_token',
    },
    triggers: [
      {
        key: 'new_message',
        name: 'New Incoming Message',
        description: 'Triggers when a new SMS or MMS message is received',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            sid: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
            body: { type: 'string' },
            status: { type: 'string' },
            date_sent: { type: 'string' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'send_sms',
        name: 'Send SMS',
        description: 'Send an SMS message via Twilio',
        configFields: [
          { key: 'to', label: 'To Phone Number', type: 'string', required: true },
          { key: 'from', label: 'From Phone Number', type: 'string', required: true },
          { key: 'body', label: 'Message Body', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { sid: { type: 'string' }, status: { type: 'string' } } },
      },
      {
        key: 'send_whatsapp',
        name: 'Send WhatsApp Message',
        description: 'Send a WhatsApp message via Twilio',
        configFields: [
          { key: 'to', label: 'To WhatsApp Number (e.g. +1234567890)', type: 'string', required: true },
          { key: 'from', label: 'From WhatsApp Number', type: 'string', required: true },
          { key: 'body', label: 'Message Body', type: 'textarea', required: true },
        ],
        outputSchema: { type: 'object', properties: { sid: { type: 'string' }, status: { type: 'string' } } },
      },
      {
        key: 'make_call',
        name: 'Make Call',
        description: 'Initiate a phone call via Twilio',
        configFields: [
          { key: 'to', label: 'To Phone Number', type: 'string', required: true },
          { key: 'from', label: 'From Phone Number', type: 'string', required: true },
          { key: 'twiml_url', label: 'TwiML URL', type: 'string', required: true, helpText: 'URL that returns TwiML instructions for the call' },
        ],
        outputSchema: { type: 'object', properties: { sid: { type: 'string' }, status: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const base = twilioBase(credentials.account_sid);
    const headers = twilioHeaders(credentials.account_sid, credentials.auth_token);
    const res = await fetch(`${base}.json`, { headers });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const base = twilioBase(credentials.account_sid);
    const headers = twilioHeaders(credentials.account_sid, credentials.auth_token);
    const since = (lastPollState.since as string) || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (triggerKey === 'new_message') {
      const dateSent = since.split('T')[0];
      const url = `${base}/Messages.json?DateSent>=${dateSent}&PageSize=20`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { messages?: Record<string, unknown>[] };
      const sinceDate = new Date(since);
      const newItems = (data.messages || []).filter(msg => {
        const dateSentStr = msg.date_sent as string;
        return dateSentStr && new Date(dateSentStr) > sinceDate;
      });
      return {
        newItems,
        nextPollState: { since: new Date().toISOString() },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const base = twilioBase(credentials.account_sid);
    const headers = twilioHeaders(credentials.account_sid, credentials.auth_token);

    if (actionKey === 'send_sms') {
      const { to, from, body } = params as { to: string; from: string; body: string };
      const res = await fetch(`${base}/Messages.json`, {
        method: 'POST',
        headers,
        body: toFormData({ To: to, From: from, Body: body }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Twilio send_sms failed: ${err}` };
      }
      const data = await res.json() as { sid: string; status: string };
      return { success: true, data: { sid: data.sid, status: data.status } };
    }

    if (actionKey === 'send_whatsapp') {
      const { to, from, body } = params as { to: string; from: string; body: string };
      const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const whatsappFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      const res = await fetch(`${base}/Messages.json`, {
        method: 'POST',
        headers,
        body: toFormData({ To: whatsappTo, From: whatsappFrom, Body: body }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Twilio send_whatsapp failed: ${err}` };
      }
      const data = await res.json() as { sid: string; status: string };
      return { success: true, data: { sid: data.sid, status: data.status } };
    }

    if (actionKey === 'make_call') {
      const { to, from, twiml_url } = params as { to: string; from: string; twiml_url: string };
      const res = await fetch(`${base}/Calls.json`, {
        method: 'POST',
        headers,
        body: toFormData({ To: to, From: from, Url: twiml_url }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Twilio make_call failed: ${err}` };
      }
      const data = await res.json() as { sid: string; status: string };
      return { success: true, data: { sid: data.sid, status: data.status } };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default twilioConnector;
