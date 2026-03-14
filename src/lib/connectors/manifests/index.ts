// ─── 50 Priority Connector Manifests ──────────────────────────────────────────
// Pre-built integration definitions for the most popular apps.
// Grouped by category for organization and discoverability.

import type { ConnectorManifest } from '@/types';
import { createManifest } from '../base';

// ─── Communication (8) ───────────────────────────────────────────────────────

const gmailManifest = createManifest({
  slug: 'gmail',
  name: 'Gmail',
  description: 'Send emails, read messages, and manage labels',
  icon: '📧',
  category: 'communication',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_email',
      name: 'New Email',
      description: 'Trigger when a new email arrives',
      type: 'polling',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Email ID' },
          from: { type: 'string', description: 'Sender email' },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body' },
          timestamp: { type: 'string', description: 'Received timestamp' },
        },
      },
      configFields: [
        { key: 'label', label: 'Label', type: 'select', required: false, options: [] },
        { key: 'maxResults', label: 'Max Results', type: 'number', required: false },
      ],
    },
    {
      key: 'new_labeled_email',
      name: 'New Labeled Email',
      description: 'Trigger when email with specific label arrives',
      type: 'polling',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          from: { type: 'string' },
          subject: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
        },
      },
      configFields: [
        { key: 'label', label: 'Label', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'send_email',
      name: 'Send Email',
      description: 'Send an email',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
          labelIds: { type: 'array', items: { type: 'string' } },
        },
      },
      configFields: [
        { key: 'to', label: 'To', type: 'string', required: true },
        { key: 'subject', label: 'Subject', type: 'string', required: true },
        { key: 'body', label: 'Body', type: 'textarea', required: true },
        { key: 'cc', label: 'CC', type: 'string', required: false },
        { key: 'bcc', label: 'BCC', type: 'string', required: false },
      ],
    },
    {
      key: 'create_draft',
      name: 'Create Draft',
      description: 'Create a draft email',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          draftId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'to', label: 'To', type: 'string', required: true },
        { key: 'subject', label: 'Subject', type: 'string', required: true },
        { key: 'body', label: 'Body', type: 'textarea', required: true },
      ],
    },
    {
      key: 'add_label',
      name: 'Add Label',
      description: 'Add a label to an email',
      inputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['messageId', 'label'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
      configFields: [
        { key: 'messageId', label: 'Message ID', type: 'string', required: true },
        { key: 'label', label: 'Label', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const slackManifest = createManifest({
  slug: 'slack',
  name: 'Slack',
  description: 'Send messages, manage channels, and handle reactions',
  icon: '💬',
  category: 'communication',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://slack.com/oauth_authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'channels:manage', 'reactions:write'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_message',
      name: 'New Message',
      description: 'Trigger on new message in channel',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          user: { type: 'string' },
          channel: { type: 'string' },
          ts: { type: 'string' },
        },
      },
      configFields: [
        { key: 'channel', label: 'Channel', type: 'string', required: true },
      ],
    },
    {
      key: 'new_channel_message',
      name: 'New Channel Message',
      description: 'Trigger on new message in specific channel',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          channel: { type: 'string' },
          user: { type: 'string' },
        },
      },
      configFields: [
        { key: 'channel', label: 'Channel ID', type: 'string', required: true },
      ],
    },
    {
      key: 'new_reaction',
      name: 'New Reaction',
      description: 'Trigger on message reaction',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          emoji: { type: 'string' },
          messageTs: { type: 'string' },
          user: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'send_message',
      name: 'Send Message',
      description: 'Send a direct message',
      inputSchema: {
        type: 'object',
        properties: {
          user: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['user', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          ts: { type: 'string' },
        },
      },
      configFields: [
        { key: 'user', label: 'User ID', type: 'string', required: true },
        { key: 'text', label: 'Message', type: 'textarea', required: true },
      ],
    },
    {
      key: 'send_channel_message',
      name: 'Send Channel Message',
      description: 'Send message to a channel',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['channel', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          ts: { type: 'string' },
        },
      },
      configFields: [
        { key: 'channel', label: 'Channel ID', type: 'string', required: true },
        { key: 'text', label: 'Message', type: 'textarea', required: true },
      ],
    },
    {
      key: 'create_channel',
      name: 'Create Channel',
      description: 'Create a new channel',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          isPrivate: { type: 'boolean' },
        },
        required: ['name'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          channelId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'Channel Name', type: 'string', required: true },
        { key: 'isPrivate', label: 'Private', type: 'boolean', required: false },
      ],
    },
    {
      key: 'set_status',
      name: 'Set Status',
      description: 'Set user status message',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          emoji: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
        },
      },
      configFields: [
        { key: 'status', label: 'Status', type: 'string', required: true },
        { key: 'emoji', label: 'Emoji', type: 'string', required: false },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const teamsManifest = createManifest({
  slug: 'microsoft-teams',
  name: 'Microsoft Teams',
  description: 'Send messages and manage teams',
  icon: '👥',
  category: 'communication',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['Chat.Send', 'ChannelMessage.Send'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_chat_message',
      name: 'New Chat Message',
      description: 'Trigger on new chat message',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          body: { type: 'string' },
          from: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'send_message',
      name: 'Send Message',
      description: 'Send a message',
      inputSchema: {
        type: 'object',
        properties: {
          chatId: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['chatId', 'body'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'chatId', label: 'Chat ID', type: 'string', required: true },
        { key: 'body', label: 'Message', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const discordManifest = createManifest({
  slug: 'discord',
  name: 'Discord',
  description: 'Send messages and manage servers',
  icon: '🎮',
  category: 'communication',
  authType: 'bearer',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bot ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_message',
      name: 'New Message',
      description: 'Trigger on new message',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          author: { type: 'string' },
          channelId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'channelId', label: 'Channel ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'send_message',
      name: 'Send Message',
      description: 'Send a message to a channel',
      inputSchema: {
        type: 'object',
        properties: {
          channelId: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['channelId', 'content'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'channelId', label: 'Channel ID', type: 'string', required: true },
        { key: 'content', label: 'Message', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const twilioManifest = createManifest({
  slug: 'twilio',
  name: 'Twilio SMS',
  description: 'Send and receive SMS messages',
  icon: '📱',
  category: 'communication',
  authType: 'basic',
  authConfig: {
    type: 'basic',
    usernameField: 'accountSid',
    passwordField: 'authToken',
  },
  triggers: [
    {
      key: 'new_sms',
      name: 'New SMS',
      description: 'Trigger on new incoming SMS',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          body: { type: 'string' },
          messageId: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'send_sms',
      name: 'Send SMS',
      description: 'Send an SMS message',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          message: { type: 'string' },
        },
        required: ['to', 'message'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          sid: { type: 'string' },
          status: { type: 'string' },
        },
      },
      configFields: [
        { key: 'to', label: 'Phone Number', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const sendgridManifest = createManifest({
  slug: 'sendgrid',
  name: 'SendGrid',
  description: 'Send transactional emails',
  icon: '💌',
  category: 'communication',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [],
  actions: [
    {
      key: 'send_email',
      name: 'Send Email',
      description: 'Send an email via SendGrid',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'to', label: 'To', type: 'string', required: true },
        { key: 'subject', label: 'Subject', type: 'string', required: true },
        { key: 'body', label: 'Body', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const mailchimpManifest = createManifest({
  slug: 'mailchimp',
  name: 'Mailchimp',
  description: 'Manage email campaigns and subscribers',
  icon: '🦁',
  category: 'communication',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_subscriber',
      name: 'New Subscriber',
      description: 'Trigger on new email subscriber',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          listId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'listId', label: 'List ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'add_subscriber',
      name: 'Add Subscriber',
      description: 'Add a new subscriber to a list',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          listId: { type: 'string' },
        },
        required: ['email', 'listId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'listId', label: 'List ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const intercomManifest = createManifest({
  slug: 'intercom',
  name: 'Intercom',
  description: 'Manage customer conversations',
  icon: '💬',
  category: 'communication',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_conversation',
      name: 'New Conversation',
      description: 'Trigger on new conversation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          conversationId: { type: 'string' },
          initiator: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'send_message',
      name: 'Send Message',
      description: 'Send a message in a conversation',
      inputSchema: {
        type: 'object',
        properties: {
          conversationId: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['conversationId', 'body'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'conversationId', label: 'Conversation ID', type: 'string', required: true },
        { key: 'body', label: 'Message', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

// ─── CRM (5) ─────────────────────────────────────────────────────────────────

const salesforceManifest = createManifest({
  slug: 'salesforce',
  name: 'Salesforce',
  description: 'Create and manage CRM records',
  icon: '☁️',
  category: 'crm',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_lead',
      name: 'New Lead',
      description: 'Trigger on new lead creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          leadId: { type: 'string' },
          firstName: { type: 'string' },
          email: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_lead',
      name: 'Create Lead',
      description: 'Create a new lead',
      inputSchema: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          company: { type: 'string' },
        },
        required: ['firstName', 'lastName', 'email'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'firstName', label: 'First Name', type: 'string', required: true },
        { key: 'lastName', label: 'Last Name', type: 'string', required: true },
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'company', label: 'Company', type: 'string', required: false },
      ],
    },
    {
      key: 'create_contact',
      name: 'Create Contact',
      description: 'Create a new contact',
      inputSchema: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'firstName', label: 'First Name', type: 'string', required: true },
        { key: 'lastName', label: 'Last Name', type: 'string', required: true },
        { key: 'email', label: 'Email', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const hubspotManifest = createManifest({
  slug: 'hubspot',
  name: 'HubSpot',
  description: 'Manage contacts, deals, and companies',
  icon: '🎯',
  category: 'crm',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_contact',
      name: 'New Contact',
      description: 'Trigger on new contact creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          contactId: { type: 'string' },
          email: { type: 'string' },
        },
      },
      configFields: [],
    },
    {
      key: 'contact_updated',
      name: 'Contact Updated',
      description: 'Trigger when contact is updated',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          contactId: { type: 'string' },
          email: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_contact',
      name: 'Create Contact',
      description: 'Create a new contact',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'firstName', label: 'First Name', type: 'string', required: false },
        { key: 'lastName', label: 'Last Name', type: 'string', required: false },
      ],
    },
    {
      key: 'create_deal',
      name: 'Create Deal',
      description: 'Create a new deal',
      inputSchema: {
        type: 'object',
        properties: {
          dealName: { type: 'string' },
          amount: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'dealName', label: 'Deal Name', type: 'string', required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: false },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const pipedriveManifest = createManifest({
  slug: 'pipedrive',
  name: 'Pipedrive',
  description: 'Manage sales pipeline and deals',
  icon: '🔷',
  category: 'crm',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'api_token',
    prefix: '',
    location: 'query',
  },
  triggers: [
    {
      key: 'new_deal',
      name: 'New Deal',
      description: 'Trigger on new deal creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          dealId: { type: 'string' },
          title: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_deal',
      name: 'Create Deal',
      description: 'Create a new deal',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          userId: { type: 'string' },
        },
        required: ['title'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'title', label: 'Deal Title', type: 'string', required: true },
        { key: 'userId', label: 'User ID', type: 'string', required: false },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const zohoCrmManifest = createManifest({
  slug: 'zoho-crm',
  name: 'Zoho CRM',
  description: 'Manage Zoho CRM records',
  icon: '📊',
  category: 'crm',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    scopes: ['ZohoCRM.modules.READ', 'ZohoCRM.modules.CREATE'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_lead',
      name: 'New Lead',
      description: 'Trigger on new lead in Zoho',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_lead',
      name: 'Create Lead',
      description: 'Create a lead in Zoho CRM',
      inputSchema: {
        type: 'object',
        properties: {
          lastName: { type: 'string' },
          email: { type: 'string' },
        },
        required: ['lastName'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'lastName', label: 'Last Name', type: 'string', required: true },
        { key: 'email', label: 'Email', type: 'string', required: false },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const freshsalesManifest = createManifest({
  slug: 'freshsales',
  name: 'Freshsales',
  description: 'Manage contacts and leads in Freshsales',
  icon: '🌱',
  category: 'crm',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Token token=',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_contact',
      name: 'New Contact',
      description: 'Trigger on new contact',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_contact',
      name: 'Create Contact',
      description: 'Create a new contact',
      inputSchema: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          email: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'firstName', label: 'First Name', type: 'string', required: true },
        { key: 'email', label: 'Email', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

// ─── Productivity (8) ────────────────────────────────────────────────────────

const googleSheetsManifest = createManifest({
  slug: 'google-sheets',
  name: 'Google Sheets',
  description: 'Read and write data in Google Sheets',
  icon: '📊',
  category: 'productivity',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_row',
      name: 'New Row',
      description: 'Trigger when new row is added',
      type: 'polling',
      outputSchema: {
        type: 'object',
        properties: {
          row: { type: 'array', items: { type: 'string' } },
          rowNumber: { type: 'number' },
        },
      },
      configFields: [
        { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'string', required: true },
        { key: 'sheetName', label: 'Sheet Name', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'add_row',
      name: 'Add Row',
      description: 'Add a new row to a sheet',
      inputSchema: {
        type: 'object',
        properties: {
          values: { type: 'array' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          spreadsheetId: { type: 'string' },
          updatedRange: { type: 'string' },
        },
      },
      configFields: [
        { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'string', required: true },
        { key: 'sheetName', label: 'Sheet Name', type: 'string', required: true },
      ],
    },
    {
      key: 'update_cell',
      name: 'Update Cell',
      description: 'Update a specific cell',
      inputSchema: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          cell: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          updatedCells: { type: 'number' },
        },
      },
      configFields: [
        { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'string', required: true },
        { key: 'sheetName', label: 'Sheet Name', type: 'string', required: true },
        { key: 'cell', label: 'Cell (A1)', type: 'string', required: true },
        { key: 'value', label: 'Value', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const googleDriveManifest = createManifest({
  slug: 'google-drive',
  name: 'Google Drive',
  description: 'Create and manage files in Google Drive',
  icon: '🗂️',
  category: 'productivity',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/drive'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_file',
      name: 'New File',
      description: 'Trigger on new file created',
      type: 'polling',
      outputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          name: { type: 'string' },
        },
      },
      configFields: [
        { key: 'folderId', label: 'Folder ID', type: 'string', required: false },
      ],
    },
  ],
  actions: [
    {
      key: 'create_file',
      name: 'Create File',
      description: 'Create a new file',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          mimeType: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'File Name', type: 'string', required: true },
        { key: 'mimeType', label: 'MIME Type', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const notionManifest = createManifest({
  slug: 'notion',
  name: 'Notion',
  description: 'Create and manage Notion pages and databases',
  icon: '📝',
  category: 'productivity',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: ['content.read', 'content.write'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_database_item',
      name: 'New Database Item',
      description: 'Trigger on new database entry',
      type: 'polling',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          properties: { type: 'object' },
        },
      },
      configFields: [
        { key: 'databaseId', label: 'Database ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_page',
      name: 'Create Page',
      description: 'Create a new Notion page',
      inputSchema: {
        type: 'object',
        properties: {
          parentId: { type: 'string' },
          title: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: { type: 'string' },
        },
      },
      configFields: [
        { key: 'parentId', label: 'Parent ID', type: 'string', required: true },
        { key: 'title', label: 'Title', type: 'string', required: true },
      ],
    },
    {
      key: 'add_database_item',
      name: 'Add Database Item',
      description: 'Add item to a Notion database',
      inputSchema: {
        type: 'object',
        properties: {
          databaseId: { type: 'string' },
          properties: { type: 'object' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'databaseId', label: 'Database ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const airtableManifest = createManifest({
  slug: 'airtable',
  name: 'Airtable',
  description: 'Create and manage Airtable records',
  icon: '🗃️',
  category: 'productivity',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_record',
      name: 'New Record',
      description: 'Trigger on new record creation',
      type: 'polling',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fields: { type: 'object' },
        },
      },
      configFields: [
        { key: 'baseId', label: 'Base ID', type: 'string', required: true },
        { key: 'tableId', label: 'Table Name', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_record',
      name: 'Create Record',
      description: 'Create a new record',
      inputSchema: {
        type: 'object',
        properties: {
          fields: { type: 'object' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'baseId', label: 'Base ID', type: 'string', required: true },
        { key: 'tableId', label: 'Table Name', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const asanaManifest = createManifest({
  slug: 'asana',
  name: 'Asana',
  description: 'Create and manage tasks in Asana',
  icon: '✓',
  category: 'productivity',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
    scopes: ['default'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_task',
      name: 'New Task',
      description: 'Trigger on new task creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      configFields: [
        { key: 'projectId', label: 'Project ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_task',
      name: 'Create Task',
      description: 'Create a new task',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          projectId: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'Task Name', type: 'string', required: true },
        { key: 'projectId', label: 'Project ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const trelloManifest = createManifest({
  slug: 'trello',
  name: 'Trello',
  description: 'Create and manage Trello cards',
  icon: '📌',
  category: 'productivity',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_card',
      name: 'New Card',
      description: 'Trigger on new card creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      configFields: [
        { key: 'boardId', label: 'Board ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_card',
      name: 'Create Card',
      description: 'Create a new card',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          listId: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'Card Name', type: 'string', required: true },
        { key: 'listId', label: 'List ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const mondayManifest = createManifest({
  slug: 'monday',
  name: 'Monday.com',
  description: 'Create and manage Monday.com items',
  icon: '📋',
  category: 'productivity',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_item',
      name: 'New Item',
      description: 'Trigger on new item creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      configFields: [
        { key: 'boardId', label: 'Board ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_item',
      name: 'Create Item',
      description: 'Create a new item',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          boardId: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'Item Name', type: 'string', required: true },
        { key: 'boardId', label: 'Board ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const clickupManifest = createManifest({
  slug: 'clickup',
  name: 'ClickUp',
  description: 'Create and manage ClickUp tasks',
  icon: '🎯',
  category: 'productivity',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: '',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_task',
      name: 'New Task',
      description: 'Trigger on new task creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      configFields: [
        { key: 'listId', label: 'List ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_task',
      name: 'Create Task',
      description: 'Create a new task',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          listId: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'Task Name', type: 'string', required: true },
        { key: 'listId', label: 'List ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

// ─── Developer (6) ───────────────────────────────────────────────────────────

const githubManifest = createManifest({
  slug: 'github',
  name: 'GitHub',
  description: 'Manage repositories, issues, and pull requests',
  icon: '🐙',
  category: 'developer',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'issues'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_issue',
      name: 'New Issue',
      description: 'Trigger on new issue creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          number: { type: 'number' },
          title: { type: 'string' },
          body: { type: 'string' },
        },
      },
      configFields: [
        { key: 'repository', label: 'Repository', type: 'string', required: true },
      ],
    },
    {
      key: 'new_pull_request',
      name: 'New Pull Request',
      description: 'Trigger on new PR creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          number: { type: 'number' },
          title: { type: 'string' },
        },
      },
      configFields: [
        { key: 'repository', label: 'Repository', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_issue',
      name: 'Create Issue',
      description: 'Create a new issue',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          number: { type: 'number' },
          url: { type: 'string' },
        },
      },
      configFields: [
        { key: 'repository', label: 'Repository', type: 'string', required: true },
        { key: 'title', label: 'Title', type: 'string', required: true },
        { key: 'body', label: 'Description', type: 'textarea', required: false },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const gitlabManifest = createManifest({
  slug: 'gitlab',
  name: 'GitLab',
  description: 'Manage GitLab projects and issues',
  icon: '🦊',
  category: 'developer',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'PRIVATE-TOKEN',
    prefix: '',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_issue',
      name: 'New Issue',
      description: 'Trigger on new issue',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
        },
      },
      configFields: [
        { key: 'projectId', label: 'Project ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_issue',
      name: 'Create Issue',
      description: 'Create an issue',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
      },
      configFields: [
        { key: 'projectId', label: 'Project ID', type: 'string', required: true },
        { key: 'title', label: 'Title', type: 'string', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: false },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const jiraManifest = createManifest({
  slug: 'jira',
  name: 'Jira',
  description: 'Create and manage Jira issues',
  icon: '🎫',
  category: 'developer',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:jira-work', 'write:jira-work'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_issue',
      name: 'New Issue',
      description: 'Trigger on new issue creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          summary: { type: 'string' },
        },
      },
      configFields: [
        { key: 'projectKey', label: 'Project Key', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_issue',
      name: 'Create Issue',
      description: 'Create a new issue',
      inputSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          issueType: { type: 'string' },
          projectKey: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'projectKey', label: 'Project Key', type: 'string', required: true },
        { key: 'summary', label: 'Summary', type: 'string', required: true },
        { key: 'issueType', label: 'Issue Type', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const linearManifest = createManifest({
  slug: 'linear',
  name: 'Linear',
  description: 'Create and manage Linear issues',
  icon: '↗️',
  category: 'developer',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_issue',
      name: 'New Issue',
      description: 'Trigger on new issue',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
        },
      },
      configFields: [
        { key: 'teamId', label: 'Team ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'create_issue',
      name: 'Create Issue',
      description: 'Create an issue',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          teamId: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'teamId', label: 'Team ID', type: 'string', required: true },
        { key: 'title', label: 'Title', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const datadogManifest = createManifest({
  slug: 'datadog',
  name: 'Datadog',
  description: 'Send logs and metrics to Datadog',
  icon: '📈',
  category: 'developer',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'DD-API-KEY',
    prefix: '',
    location: 'header',
  },
  triggers: [
    {
      key: 'alert_triggered',
      name: 'Alert Triggered',
      description: 'Trigger on Datadog alert',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          alert: { type: 'string' },
          severity: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'send_event',
      name: 'Send Event',
      description: 'Send an event to Datadog',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          text: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
        },
      },
      configFields: [
        { key: 'title', label: 'Title', type: 'string', required: true },
        { key: 'text', label: 'Text', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const pagerdutyManifest = createManifest({
  slug: 'pagerduty',
  name: 'PagerDuty',
  description: 'Create and manage incidents in PagerDuty',
  icon: '🚨',
  category: 'developer',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Token token=',
    location: 'header',
  },
  triggers: [
    {
      key: 'incident_triggered',
      name: 'Incident Triggered',
      description: 'Trigger on new incident',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          incidentNumber: { type: 'number' },
          title: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_incident',
      name: 'Create Incident',
      description: 'Create an incident',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          urgency: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          incidentNumber: { type: 'number' },
        },
      },
      configFields: [
        { key: 'title', label: 'Title', type: 'string', required: true },
        { key: 'urgency', label: 'Urgency', type: 'select', required: true,
          options: [
            { label: 'Low', value: 'low' },
            { label: 'High', value: 'high' },
          ],
        },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

// ─── Marketing (4) ───────────────────────────────────────────────────────────

const googleAdsManifest = createManifest({
  slug: 'google-ads',
  name: 'Google Ads',
  description: 'Manage Google Ads campaigns',
  icon: '📢',
  category: 'marketing',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/adwords'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [],
  actions: [
    {
      key: 'create_campaign',
      name: 'Create Campaign',
      description: 'Create a new ad campaign',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          budget: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'Campaign Name', type: 'string', required: true },
        { key: 'budget', label: 'Daily Budget', type: 'number', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const facebookAdsManifest = createManifest({
  slug: 'facebook-ads',
  name: 'Facebook Ads',
  description: 'Manage Facebook Ads campaigns',
  icon: '👍',
  category: 'marketing',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenUrl: 'https://graph.instagram.com/v12.0/oauth/access_token',
    scopes: ['ads_management'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [],
  actions: [
    {
      key: 'create_campaign',
      name: 'Create Campaign',
      description: 'Create a campaign',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'Campaign Name', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const linkedinAdsManifest = createManifest({
  slug: 'linkedin-ads',
  name: 'LinkedIn Ads',
  description: 'Manage LinkedIn Ads campaigns',
  icon: '💼',
  category: 'marketing',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['r_ads', 'w_ads'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [],
  actions: [
    {
      key: 'create_campaign',
      name: 'Create Campaign',
      description: 'Create a campaign',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'name', label: 'Campaign Name', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const marketoManifest = createManifest({
  slug: 'marketo',
  name: 'Marketo',
  description: 'Manage marketing automation in Marketo',
  icon: '📧',
  category: 'marketing',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://app-ab01.marketo.com/identity/oauth/authorize',
    tokenUrl: 'https://app-ab01.marketo.com/identity/oauth/token',
    scopes: ['api'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [],
  actions: [
    {
      key: 'create_lead',
      name: 'Create Lead',
      description: 'Create a lead',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      configFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

// ─── Finance (5) ─────────────────────────────────────────────────────────────

const stripeManifest = createManifest({
  slug: 'stripe',
  name: 'Stripe',
  description: 'Process payments and manage customers',
  icon: '💳',
  category: 'finance',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'payment_succeeded',
      name: 'Payment Succeeded',
      description: 'Trigger on successful payment',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          paymentIntentId: { type: 'string' },
          amount: { type: 'number' },
          status: { type: 'string' },
        },
      },
      configFields: [],
    },
    {
      key: 'new_customer',
      name: 'New Customer',
      description: 'Trigger on new customer creation',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
          email: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_charge',
      name: 'Create Charge',
      description: 'Create a charge',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          chargeId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'currency', label: 'Currency', type: 'string', required: true },
      ],
    },
    {
      key: 'create_customer',
      name: 'Create Customer',
      description: 'Create a customer',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const paypalManifest = createManifest({
  slug: 'paypal',
  name: 'PayPal',
  description: 'Process payments via PayPal',
  icon: '🅿️',
  category: 'finance',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://www.paypal.com/signin/authorize',
    tokenUrl: 'https://api.paypal.com/v1/oauth2/token',
    scopes: ['PAYMENT.CAPTURE'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'payment_completed',
      name: 'Payment Completed',
      description: 'Trigger on payment completion',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          transactionId: { type: 'string' },
          amount: { type: 'number' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_invoice',
      name: 'Create Invoice',
      description: 'Create an invoice',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'amount', label: 'Amount', type: 'number', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const quickbooksManifest = createManifest({
  slug: 'quickbooks',
  name: 'QuickBooks',
  description: 'Manage QuickBooks accounting',
  icon: '📙',
  category: 'finance',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://quickbooks.api.intuit.com/oauth2/tokens/bearer',
    scopes: ['com.intuit.quickbooks.accounting'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [],
  actions: [
    {
      key: 'create_invoice',
      name: 'Create Invoice',
      description: 'Create an invoice',
      inputSchema: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
          amount: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'customerId', label: 'Customer ID', type: 'string', required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const xeroManifest = createManifest({
  slug: 'xero',
  name: 'Xero',
  description: 'Manage Xero accounting',
  icon: '📊',
  category: 'finance',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: 'https://identity.xero.com/connect/token',
    scopes: ['accounting'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [],
  actions: [
    {
      key: 'create_invoice',
      name: 'Create Invoice',
      description: 'Create an invoice',
      inputSchema: {
        type: 'object',
        properties: {
          contactId: { type: 'string' },
          amount: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'contactId', label: 'Contact ID', type: 'string', required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const squareManifest = createManifest({
  slug: 'square',
  name: 'Square',
  description: 'Process payments with Square',
  icon: '⬜',
  category: 'finance',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [
    {
      key: 'payment_completed',
      name: 'Payment Completed',
      description: 'Trigger on payment',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          paymentId: { type: 'string' },
          amount: { type: 'number' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_payment',
      name: 'Create Payment',
      description: 'Create a payment',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          paymentId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'amount', label: 'Amount', type: 'number', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

// ─── E-commerce (4) ──────────────────────────────────────────────────────────

const shopifyManifest = createManifest({
  slug: 'shopify',
  name: 'Shopify',
  description: 'Manage Shopify store orders and products',
  icon: '🛍️',
  category: 'ecommerce',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://myshopify.com/admin/oauth/access_token',
    scopes: ['write_orders', 'read_products'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_order',
      name: 'New Order',
      description: 'Trigger on new order',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerEmail: { type: 'string' },
          total: { type: 'number' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_order',
      name: 'Create Order',
      description: 'Create an order',
      inputSchema: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
          items: { type: 'array' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'customerId', label: 'Customer ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const woocommerceManifest = createManifest({
  slug: 'woocommerce',
  name: 'WooCommerce',
  description: 'Manage WooCommerce store',
  icon: '🏪',
  category: 'ecommerce',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Basic ',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_order',
      name: 'New Order',
      description: 'Trigger on new order',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'number' },
          total: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_product',
      name: 'Create Product',
      description: 'Create a product',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          productId: { type: 'number' },
        },
      },
      configFields: [
        { key: 'name', label: 'Product Name', type: 'string', required: true },
        { key: 'price', label: 'Price', type: 'number', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const bigcommerceManifest = createManifest({
  slug: 'bigcommerce',
  name: 'BigCommerce',
  description: 'Manage BigCommerce store',
  icon: '🏬',
  category: 'ecommerce',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'X-Auth-Token',
    prefix: '',
    location: 'header',
  },
  triggers: [
    {
      key: 'new_order',
      name: 'New Order',
      description: 'Trigger on new order',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'number' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_product',
      name: 'Create Product',
      description: 'Create a product',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          productId: { type: 'number' },
        },
      },
      configFields: [
        { key: 'name', label: 'Product Name', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const amazonSellerManifest = createManifest({
  slug: 'amazon-seller',
  name: 'Amazon Seller',
  description: 'Manage Amazon Seller Central',
  icon: '🔶',
  category: 'ecommerce',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://sellercentral.amazon.com/apps/authorize/consent',
    tokenUrl: 'https://api.amazon.com/auth/o2/tokenexchange',
    scopes: ['selling:products:read', 'selling:orders:read'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_order',
      name: 'New Order',
      description: 'Trigger on new Amazon order',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          buyerEmail: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'get_orders',
      name: 'Get Orders',
      description: 'Retrieve orders',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      outputSchema: {
        type: 'object',
        properties: {
          orders: { type: 'array' },
        },
      },
      configFields: [],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

// ─── Social (4) ──────────────────────────────────────────────────────────────

const twitterManifest = createManifest({
  slug: 'twitter',
  name: 'Twitter / X',
  description: 'Post tweets and manage account',
  icon: '𝕏',
  category: 'social',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.write', 'tweet.read'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_mention',
      name: 'New Mention',
      description: 'Trigger on new mention',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          tweetId: { type: 'string' },
          text: { type: 'string' },
          authorId: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'post_tweet',
      name: 'Post Tweet',
      description: 'Post a tweet',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
        },
        required: ['text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          tweetId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'text', label: 'Tweet Text', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const facebookPagesManifest = createManifest({
  slug: 'facebook-pages',
  name: 'Facebook Pages',
  description: 'Manage Facebook page posts',
  icon: '👍',
  category: 'social',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v12.0/oauth/access_token',
    scopes: ['pages_manage_posts'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_post_comment',
      name: 'New Post Comment',
      description: 'Trigger on new comment',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          commentId: { type: 'string' },
          message: { type: 'string' },
        },
      },
      configFields: [
        { key: 'pageId', label: 'Page ID', type: 'string', required: true },
      ],
    },
  ],
  actions: [
    {
      key: 'post_to_page',
      name: 'Post to Page',
      description: 'Post content to page',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          postId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'pageId', label: 'Page ID', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const instagramManifest = createManifest({
  slug: 'instagram',
  name: 'Instagram',
  description: 'Post content to Instagram',
  icon: '📸',
  category: 'social',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://graph.instagram.com/v12.0/oauth/access_token',
    scopes: ['instagram_business_basic', 'instagram_business_content_publish'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [
    {
      key: 'new_comment',
      name: 'New Comment',
      description: 'Trigger on new comment on post',
      type: 'webhook',
      outputSchema: {
        type: 'object',
        properties: {
          commentId: { type: 'string' },
          text: { type: 'string' },
        },
      },
      configFields: [],
    },
  ],
  actions: [
    {
      key: 'create_post',
      name: 'Create Post',
      description: 'Create a post',
      inputSchema: {
        type: 'object',
        properties: {
          caption: { type: 'string' },
          mediaUrl: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          mediaId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'caption', label: 'Caption', type: 'textarea', required: false },
        { key: 'mediaUrl', label: 'Media URL', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const linkedinManifest = createManifest({
  slug: 'linkedin',
  name: 'LinkedIn',
  description: 'Post content on LinkedIn',
  icon: '💼',
  category: 'social',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['w_member_social'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [],
  actions: [
    {
      key: 'post_update',
      name: 'Post Update',
      description: 'Post an update',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          postId: { type: 'string' },
        },
      },
      configFields: [
        { key: 'text', label: 'Post Text', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

// ─── Analytics (3) ───────────────────────────────────────────────────────────

const googleAnalyticsManifest = createManifest({
  slug: 'google-analytics',
  name: 'Google Analytics',
  description: 'Track events and retrieve analytics data',
  icon: '📈',
  category: 'analytics',
  authType: 'oauth2',
  authConfig: {
    type: 'oauth2',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/analytics', 'https://www.googleapis.com/auth/analytics.readonly'],
    clientId: '',
    clientSecret: '',
  },
  triggers: [],
  actions: [
    {
      key: 'send_event',
      name: 'Send Event',
      description: 'Send a custom event',
      inputSchema: {
        type: 'object',
        properties: {
          eventName: { type: 'string' },
          eventValue: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
        },
      },
      configFields: [
        { key: 'eventName', label: 'Event Name', type: 'string', required: true },
        { key: 'eventValue', label: 'Event Value', type: 'number', required: false },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const mixpanelManifest = createManifest({
  slug: 'mixpanel',
  name: 'Mixpanel',
  description: 'Send events to Mixpanel',
  icon: '📊',
  category: 'analytics',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [],
  actions: [
    {
      key: 'track_event',
      name: 'Track Event',
      description: 'Track an event',
      inputSchema: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          userId: { type: 'string' },
          properties: { type: 'object' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
        },
      },
      configFields: [
        { key: 'event', label: 'Event Name', type: 'string', required: true },
        { key: 'userId', label: 'User ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const segmentManifest = createManifest({
  slug: 'segment',
  name: 'Segment',
  description: 'Send data to Segment',
  icon: '🔀',
  category: 'analytics',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [],
  actions: [
    {
      key: 'track_event',
      name: 'Track Event',
      description: 'Track an event',
      inputSchema: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          userId: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
      configFields: [
        { key: 'event', label: 'Event', type: 'string', required: true },
        { key: 'userId', label: 'User ID', type: 'string', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

// ─── AI (3) ──────────────────────────────────────────────────────────────────

const openaiManifest = createManifest({
  slug: 'openai',
  name: 'OpenAI',
  description: 'Use GPT models for text generation',
  icon: '🤖',
  category: 'ai',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'Authorization',
    prefix: 'Bearer ',
    location: 'header',
  },
  triggers: [],
  actions: [
    {
      key: 'create_completion',
      name: 'Create Completion',
      description: 'Generate text with GPT',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          model: { type: 'string' },
          temperature: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          tokensUsed: { type: 'number' },
        },
      },
      configFields: [
        { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
        { key: 'model', label: 'Model', type: 'select', required: true,
          options: [
            { label: 'GPT-4', value: 'gpt-4' },
            { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
          ],
        },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

const anthropicManifest = createManifest({
  slug: 'anthropic',
  name: 'Anthropic Claude',
  description: 'Use Claude for advanced AI tasks',
  icon: '🧠',
  category: 'ai',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'x-api-key',
    prefix: '',
    location: 'header',
  },
  triggers: [],
  actions: [
    {
      key: 'create_message',
      name: 'Create Message',
      description: 'Generate response with Claude',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          model: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          response: { type: 'string' },
          tokensUsed: { type: 'number' },
        },
      },
      configFields: [
        { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: false,
});

const geminiManifest = createManifest({
  slug: 'google-gemini',
  name: 'Google Gemini',
  description: 'Use Google Gemini for AI tasks',
  icon: '✨',
  category: 'ai',
  authType: 'api_key',
  authConfig: {
    type: 'api_key',
    headerName: 'x-goog-api-key',
    prefix: '',
    location: 'query',
  },
  triggers: [],
  actions: [
    {
      key: 'generate_content',
      name: 'Generate Content',
      description: 'Generate content with Gemini',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
        },
      },
      configFields: [
        { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
      ],
    },
  ],
  version: '1.0.0',
  isBuiltIn: true,
  isPremium: true,
});

// ─── Export All 50 Manifests ─────────────────────────────────────────────────

export const priorityConnectorManifests: ConnectorManifest[] = [
  // Communication (8)
  gmailManifest,
  slackManifest,
  teamsManifest,
  discordManifest,
  twilioManifest,
  sendgridManifest,
  mailchimpManifest,
  intercomManifest,

  // CRM (5)
  salesforceManifest,
  hubspotManifest,
  pipedriveManifest,
  zohoCrmManifest,
  freshsalesManifest,

  // Productivity (8)
  googleSheetsManifest,
  googleDriveManifest,
  notionManifest,
  airtableManifest,
  asanaManifest,
  trelloManifest,
  mondayManifest,
  clickupManifest,

  // Developer (6)
  githubManifest,
  gitlabManifest,
  jiraManifest,
  linearManifest,
  datadogManifest,
  pagerdutyManifest,

  // Marketing (4)
  googleAdsManifest,
  facebookAdsManifest,
  linkedinAdsManifest,
  marketoManifest,

  // Finance (5)
  stripeManifest,
  paypalManifest,
  quickbooksManifest,
  xeroManifest,
  squareManifest,

  // E-commerce (4)
  shopifyManifest,
  woocommerceManifest,
  bigcommerceManifest,
  amazonSellerManifest,

  // Social (4)
  twitterManifest,
  facebookPagesManifest,
  instagramManifest,
  linkedinManifest,

  // Analytics (3)
  googleAnalyticsManifest,
  mixpanelManifest,
  segmentManifest,

  // AI (3)
  openaiManifest,
  anthropicManifest,
  geminiManifest,
];
