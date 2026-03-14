// ─── Tier 2 Connector Manifests (100 connectors) ─────────────────────────────
// Lightweight metadata manifests for popular SaaS integrations.
// Full implementations will be added incrementally; these manifests enable
// UI discovery and custom HTTP fallback in the meantime.

import type { ConnectorManifest } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const oauth2Config = (authorizationUrl: string, tokenUrl: string, scopes: string[]) => ({
  type: 'oauth2' as const,
  authorizationUrl,
  tokenUrl,
  scopes,
});

const apiKeyConfig = (headerName = 'X-API-Key') => ({
  type: 'api_key' as const,
  headerName,
  location: 'header' as const,
});

const bearerConfig = () => ({
  type: 'bearer' as const,
  headerName: 'Authorization',
});

const basicConfig = () => ({
  type: 'basic' as const,
  usernameField: 'username',
  passwordField: 'password',
});

function m(
  slug: string,
  name: string,
  description: string,
  category: ConnectorManifest['category'],
  authType: ConnectorManifest['authType'],
  authConfig: ConnectorManifest['authConfig'],
  triggers: ConnectorManifest['triggers'],
  actions: ConnectorManifest['actions'],
  isPremium = false
): ConnectorManifest {
  return {
    id: slug,
    slug,
    name,
    description,
    icon: `/connectors/${slug}.svg`,
    category,
    authType,
    authConfig,
    triggers,
    actions,
    version: '1.0.0',
    isBuiltIn: true,
    isPremium,
  };
}

// ─── CRM (15) ────────────────────────────────────────────────────────────────

export const tier2CrmManifests: ConnectorManifest[] = [
  m('salesforce', 'Salesforce', 'World\'s #1 CRM — manage leads, contacts, and opportunities', 'crm', 'oauth2',
    oauth2Config('https://login.salesforce.com/services/oauth2/authorize', 'https://login.salesforce.com/services/oauth2/token', ['api', 'refresh_token']),
    [{ key: 'new_lead', name: 'New Lead', description: 'Triggers when a new lead is created', type: 'polling' as const }],
    [{ key: 'create_lead', name: 'Create Lead', description: 'Create a new lead' }, { key: 'update_contact', name: 'Update Contact', description: 'Update a contact record' }], true),

  m('hubspot', 'HubSpot', 'Inbound marketing and CRM platform', 'crm', 'oauth2',
    oauth2Config('https://app.hubspot.com/oauth/authorize', 'https://api.hubapi.com/oauth/v1/token', ['contacts', 'crm.objects.deals.read']),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is created', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Create a new contact' }, { key: 'create_deal', name: 'Create Deal', description: 'Create a new deal' }]),

  m('pipedrive', 'Pipedrive', 'Sales CRM & pipeline management tool', 'crm', 'api_key',
    apiKeyConfig('api_token'),
    [{ key: 'new_deal', name: 'New Deal', description: 'Triggers when a new deal is added', type: 'polling' as const }],
    [{ key: 'create_deal', name: 'Create Deal', description: 'Add a new deal to the pipeline' }, { key: 'create_person', name: 'Create Person', description: 'Create a new contact person' }]),

  m('zoho-crm', 'Zoho CRM', 'Cloud-based CRM for managing sales and marketing', 'crm', 'oauth2',
    oauth2Config('https://accounts.zoho.com/oauth/v2/auth', 'https://accounts.zoho.com/oauth/v2/token', ['ZohoCRM.modules.ALL']),
    [{ key: 'new_lead', name: 'New Lead', description: 'Triggers when a new lead is created', type: 'polling' as const }],
    [{ key: 'create_lead', name: 'Create Lead', description: 'Create a new lead' }, { key: 'update_contact', name: 'Update Contact', description: 'Update contact details' }]),

  m('copper', 'Copper', 'CRM built for Google Workspace', 'crm', 'api_key',
    apiKeyConfig('X-PW-AccessToken'),
    [{ key: 'new_person', name: 'New Person', description: 'Triggers when a new person is created', type: 'polling' as const }],
    [{ key: 'create_person', name: 'Create Person', description: 'Create a new person record' }, { key: 'create_opportunity', name: 'Create Opportunity', description: 'Create a new opportunity' }]),

  m('insightly', 'Insightly', 'CRM and project management for growing businesses', 'crm', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is added', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Add a new contact' }, { key: 'create_project', name: 'Create Project', description: 'Create a new project' }]),

  m('nimble', 'Nimble', 'Smart social sales CRM', 'crm', 'oauth2',
    oauth2Config('https://app.nimble.com/api/oauth/authorize', 'https://app.nimble.com/api/oauth/token', ['basic']),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is added', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Create a new contact' }]),

  m('agile-crm', 'Agile CRM', 'All-in-one CRM with sales, marketing and service automation', 'crm', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers on new contact creation', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Create a contact' }, { key: 'add_tag', name: 'Add Tag', description: 'Add a tag to a contact' }]),

  m('capsule', 'Capsule CRM', 'Simple and effective online CRM', 'crm', 'oauth2',
    oauth2Config('https://api.capsulecrm.com/oauth/authorise', 'https://api.capsulecrm.com/oauth/token', ['read', 'write']),
    [{ key: 'new_person', name: 'New Person', description: 'Triggers when a new person is added', type: 'polling' as const }],
    [{ key: 'create_person', name: 'Create Person', description: 'Add a new person' }, { key: 'create_opportunity', name: 'Create Opportunity', description: 'Create a new opportunity' }]),

  m('sugarcrm', 'SugarCRM', 'Enterprise-grade CRM for sales teams', 'crm', 'oauth2',
    oauth2Config('https://your-instance.sugarcrm.com/oauth2/authorize', 'https://your-instance.sugarcrm.com/oauth2/token', ['basic']),
    [{ key: 'new_lead', name: 'New Lead', description: 'Triggers on new lead creation', type: 'polling' as const }],
    [{ key: 'create_lead', name: 'Create Lead', description: 'Create a new lead record' }], true),

  m('freshsales', 'Freshsales', 'AI-powered CRM by Freshworks', 'crm', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_lead', name: 'New Lead', description: 'Triggers when a new lead is created', type: 'polling' as const }],
    [{ key: 'create_lead', name: 'Create Lead', description: 'Create a lead' }, { key: 'create_contact', name: 'Create Contact', description: 'Create a contact' }]),

  m('close-io', 'Close', 'CRM built for high-velocity sales teams', 'crm', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_lead', name: 'New Lead', description: 'Triggers when a new lead is created', type: 'polling' as const }],
    [{ key: 'create_lead', name: 'Create Lead', description: 'Create a new lead' }, { key: 'create_activity', name: 'Create Activity', description: 'Log a new activity' }]),

  m('keap', 'Keap', 'CRM and marketing automation for small businesses', 'crm', 'oauth2',
    oauth2Config('https://signin.infusionsoft.com/app/oauth/authorize', 'https://api.infusionsoft.com/token', ['full']),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is added', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Create a new contact' }, { key: 'add_tag', name: 'Add Tag', description: 'Apply a tag to a contact' }]),

  m('activecampaign', 'ActiveCampaign', 'Customer experience automation platform', 'crm', 'api_key',
    apiKeyConfig('Api-Token'),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is added', type: 'polling' as const }, { key: 'tag_added', name: 'Tag Added', description: 'Triggers when a tag is added to a contact', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Create a new contact' }, { key: 'add_tag', name: 'Add Tag', description: 'Add tag to a contact' }, { key: 'create_deal', name: 'Create Deal', description: 'Create a new deal' }]),

  m('streak', 'Streak', 'CRM built inside Gmail', 'crm', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_box', name: 'New Box', description: 'Triggers when a new box is created in a pipeline', type: 'polling' as const }],
    [{ key: 'create_box', name: 'Create Box', description: 'Create a new box in a pipeline' }, { key: 'update_stage', name: 'Update Stage', description: 'Move a box to a new stage' }]),
];

// ─── Communication (15) ──────────────────────────────────────────────────────

export const tier2CommunicationManifests: ConnectorManifest[] = [
  m('slack', 'Slack', 'Messaging and collaboration for teams', 'communication', 'oauth2',
    oauth2Config('https://slack.com/oauth/v2/authorize', 'https://slack.com/api/oauth.v2.access', ['channels:read', 'chat:write', 'users:read']),
    [{ key: 'new_message', name: 'New Message', description: 'Triggers when a new message is posted to a channel', type: 'polling' as const }],
    [{ key: 'send_message', name: 'Send Message', description: 'Send a message to a channel or user' }, { key: 'create_channel', name: 'Create Channel', description: 'Create a new channel' }]),

  m('discord', 'Discord', 'Voice, video, and text communication platform', 'communication', 'oauth2',
    oauth2Config('https://discord.com/api/oauth2/authorize', 'https://discord.com/api/oauth2/token', ['bot', 'identify']),
    [{ key: 'new_message', name: 'New Message', description: 'Triggers when a new message is received', type: 'polling' as const }],
    [{ key: 'send_message', name: 'Send Message', description: 'Send a message to a Discord channel' }, { key: 'create_channel', name: 'Create Channel', description: 'Create a new channel in a server' }]),

  m('microsoft-teams', 'Microsoft Teams', 'Microsoft\'s team collaboration platform', 'communication', 'oauth2',
    oauth2Config('https://login.microsoftonline.com/common/oauth2/v2.0/authorize', 'https://login.microsoftonline.com/common/oauth2/v2.0/token', ['Chat.ReadWrite', 'Channel.ReadBasic.All']),
    [{ key: 'new_message', name: 'New Message', description: 'Triggers when a new message is posted to a channel', type: 'polling' as const }],
    [{ key: 'send_message', name: 'Send Message', description: 'Post a message to a Teams channel' }, { key: 'create_meeting', name: 'Create Meeting', description: 'Schedule a new Teams meeting' }]),

  m('telegram', 'Telegram', 'Secure messaging and bot platform', 'communication', 'api_key',
    apiKeyConfig('X-Telegram-Bot-Api-Secret-Token'),
    [{ key: 'new_message', name: 'New Message', description: 'Triggers when a new message arrives via bot', type: 'polling' as const }],
    [{ key: 'send_message', name: 'Send Message', description: 'Send a message via Telegram bot' }, { key: 'send_photo', name: 'Send Photo', description: 'Send a photo message' }]),

  m('whatsapp-business', 'WhatsApp Business', 'Official WhatsApp Business API for enterprises', 'communication', 'bearer',
    bearerConfig(),
    [{ key: 'new_message', name: 'New Message', description: 'Triggers when a new WhatsApp message is received', type: 'polling' as const }],
    [{ key: 'send_message', name: 'Send Message', description: 'Send a WhatsApp message' }, { key: 'send_template', name: 'Send Template', description: 'Send a pre-approved template message' }], true),

  m('twilio-sms', 'Twilio SMS', 'Programmatic SMS and voice communications', 'communication', 'basic',
    basicConfig(),
    [{ key: 'new_sms', name: 'New SMS', description: 'Triggers when a new SMS is received', type: 'polling' as const }],
    [{ key: 'send_sms', name: 'Send SMS', description: 'Send an SMS message' }, { key: 'send_mms', name: 'Send MMS', description: 'Send a multimedia message' }]),

  m('mailgun', 'Mailgun', 'Transactional email API for developers', 'communication', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_email_event', name: 'New Email Event', description: 'Triggers on email events (delivered, opened, etc.)', type: 'polling' as const }],
    [{ key: 'send_email', name: 'Send Email', description: 'Send a transactional email' }, { key: 'add_to_mailing_list', name: 'Add to Mailing List', description: 'Add an address to a mailing list' }]),

  m('sendgrid', 'SendGrid', 'Email delivery and marketing platform by Twilio', 'communication', 'bearer',
    bearerConfig(),
    [{ key: 'email_event', name: 'Email Event', description: 'Triggers on email delivery events', type: 'polling' as const }],
    [{ key: 'send_email', name: 'Send Email', description: 'Send a transactional email' }, { key: 'add_contact', name: 'Add Contact', description: 'Add a contact to a marketing list' }]),

  m('postmark', 'Postmark', 'Fast and reliable transactional email service', 'communication', 'api_key',
    apiKeyConfig('X-Postmark-Server-Token'),
    [{ key: 'inbound_email', name: 'Inbound Email', description: 'Triggers when an inbound email is received', type: 'polling' as const }],
    [{ key: 'send_email', name: 'Send Email', description: 'Send a transactional email via Postmark' }]),

  m('sparkpost', 'SparkPost', 'Email deliverability and analytics platform', 'communication', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'email_event', name: 'Email Event', description: 'Triggers on email events', type: 'polling' as const }],
    [{ key: 'send_email', name: 'Send Email', description: 'Send an email via SparkPost' }]),

  m('amazon-ses', 'Amazon SES', 'Scalable cloud email service by AWS', 'communication', 'api_key',
    apiKeyConfig('X-Amz-Security-Token'),
    [{ key: 'bounce_notification', name: 'Bounce Notification', description: 'Triggers when an email bounces', type: 'polling' as const }],
    [{ key: 'send_email', name: 'Send Email', description: 'Send email via Amazon SES' }]),

  m('intercom', 'Intercom', 'Customer messaging and support platform', 'communication', 'bearer',
    bearerConfig(),
    [{ key: 'new_conversation', name: 'New Conversation', description: 'Triggers when a new conversation starts', type: 'polling' as const }, { key: 'new_message', name: 'New Message', description: 'Triggers when a new message is received', type: 'polling' as const }],
    [{ key: 'send_message', name: 'Send Message', description: 'Send a message to a user' }, { key: 'create_contact', name: 'Create Contact', description: 'Create a new contact in Intercom' }]),

  m('drift', 'Drift', 'Conversational marketing and sales platform', 'communication', 'bearer',
    bearerConfig(),
    [{ key: 'new_conversation', name: 'New Conversation', description: 'Triggers when a new chat conversation starts', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Create a contact in Drift' }, { key: 'send_message', name: 'Send Message', description: 'Send a message to a contact' }]),

  m('livechat', 'LiveChat', 'Live chat software for customer service teams', 'communication', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_chat', name: 'New Chat', description: 'Triggers when a new chat is started', type: 'polling' as const }],
    [{ key: 'send_message', name: 'Send Message', description: 'Send a chat message' }, { key: 'create_ticket', name: 'Create Ticket', description: 'Create a new support ticket' }]),

  m('crisp', 'Crisp', 'Customer messaging platform for startups', 'communication', 'basic',
    basicConfig(),
    [{ key: 'new_message', name: 'New Message', description: 'Triggers when a new message is received', type: 'polling' as const }],
    [{ key: 'send_message', name: 'Send Message', description: 'Send a message via Crisp' }, { key: 'create_contact', name: 'Create Contact', description: 'Create a new contact' }]),
];

// ─── Productivity (15) ───────────────────────────────────────────────────────

export const tier2ProductivityManifests: ConnectorManifest[] = [
  m('notion', 'Notion', 'All-in-one workspace for notes, tasks, and wikis', 'productivity', 'oauth2',
    oauth2Config('https://api.notion.com/v1/oauth/authorize', 'https://api.notion.com/v1/oauth/token', ['read_content', 'update_content']),
    [{ key: 'new_page', name: 'New Page', description: 'Triggers when a new page is created in a database', type: 'polling' as const }],
    [{ key: 'create_page', name: 'Create Page', description: 'Create a new page in a Notion database' }, { key: 'update_page', name: 'Update Page', description: 'Update an existing page' }]),

  m('asana', 'Asana', 'Work management platform for teams', 'productivity', 'oauth2',
    oauth2Config('https://app.asana.com/-/oauth_authorize', 'https://app.asana.com/-/oauth_token', ['default']),
    [{ key: 'new_task', name: 'New Task', description: 'Triggers when a new task is created', type: 'polling' as const }, { key: 'task_completed', name: 'Task Completed', description: 'Triggers when a task is completed', type: 'polling' as const }],
    [{ key: 'create_task', name: 'Create Task', description: 'Create a new task in Asana' }, { key: 'complete_task', name: 'Complete Task', description: 'Mark a task as complete' }]),

  m('trello', 'Trello', 'Visual project management with boards and cards', 'productivity', 'oauth2',
    oauth2Config('https://trello.com/1/OAuthAuthorizeToken', 'https://trello.com/1/OAuthGetAccessToken', ['read', 'write']),
    [{ key: 'new_card', name: 'New Card', description: 'Triggers when a new card is created on a board', type: 'polling' as const }, { key: 'card_moved', name: 'Card Moved', description: 'Triggers when a card is moved to a list', type: 'polling' as const }],
    [{ key: 'create_card', name: 'Create Card', description: 'Create a new card on a board' }, { key: 'move_card', name: 'Move Card', description: 'Move a card to a different list' }]),

  m('monday-com', 'Monday.com', 'Work OS for teams to run projects and workflows', 'productivity', 'oauth2',
    oauth2Config('https://auth.monday.com/oauth2/authorize', 'https://auth.monday.com/oauth2/token', ['boards:read', 'boards:write']),
    [{ key: 'new_item', name: 'New Item', description: 'Triggers when a new item is created on a board', type: 'polling' as const }],
    [{ key: 'create_item', name: 'Create Item', description: 'Create a new item on a board' }, { key: 'update_item', name: 'Update Item', description: 'Update an existing item' }]),

  m('basecamp', 'Basecamp', 'Project management and team communication tool', 'productivity', 'oauth2',
    oauth2Config('https://launchpad.37signals.com/authorization/new', 'https://launchpad.37signals.com/authorization/token', ['basecamp']),
    [{ key: 'new_todo', name: 'New To-Do', description: 'Triggers when a new to-do is created', type: 'polling' as const }],
    [{ key: 'create_todo', name: 'Create To-Do', description: 'Create a new to-do in a list' }, { key: 'create_message', name: 'Create Message', description: 'Post a message to a message board' }]),

  m('clickup', 'ClickUp', 'All-in-one project management platform', 'productivity', 'oauth2',
    oauth2Config('https://app.clickup.com/api', 'https://app.clickup.com/api/v2/oauth/token', ['task:write', 'task:read']),
    [{ key: 'new_task', name: 'New Task', description: 'Triggers when a new task is created', type: 'polling' as const }, { key: 'task_status_changed', name: 'Task Status Changed', description: 'Triggers when a task changes status', type: 'polling' as const }],
    [{ key: 'create_task', name: 'Create Task', description: 'Create a new task in ClickUp' }, { key: 'update_task', name: 'Update Task', description: 'Update an existing task' }]),

  m('todoist', 'Todoist', 'Task manager and to-do list app', 'productivity', 'oauth2',
    oauth2Config('https://todoist.com/oauth/authorize', 'https://todoist.com/oauth/access_token', ['task:add', 'data:read_write']),
    [{ key: 'new_task', name: 'New Task', description: 'Triggers when a new task is created', type: 'polling' as const }, { key: 'task_completed', name: 'Task Completed', description: 'Triggers when a task is completed', type: 'polling' as const }],
    [{ key: 'create_task', name: 'Create Task', description: 'Add a new task to Todoist' }, { key: 'complete_task', name: 'Complete Task', description: 'Mark a task as complete' }]),

  m('wrike', 'Wrike', 'Collaborative work management platform', 'productivity', 'oauth2',
    oauth2Config('https://login.wrike.com/oauth2/authorize/v4', 'https://login.wrike.com/oauth2/token', ['wsReadWrite']),
    [{ key: 'new_task', name: 'New Task', description: 'Triggers when a new task is created in a folder', type: 'polling' as const }],
    [{ key: 'create_task', name: 'Create Task', description: 'Create a new task in Wrike' }, { key: 'update_task_status', name: 'Update Task Status', description: 'Change the status of a task' }]),

  m('teamwork', 'Teamwork', 'Project management software for client work', 'productivity', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_task', name: 'New Task', description: 'Triggers when a new task is created', type: 'polling' as const }],
    [{ key: 'create_task', name: 'Create Task', description: 'Create a new task in a project' }, { key: 'create_project', name: 'Create Project', description: 'Create a new project' }]),

  m('proofhub', 'ProofHub', 'Project management and team collaboration tool', 'productivity', 'api_key',
    apiKeyConfig('X-API-KEY'),
    [{ key: 'new_task', name: 'New Task', description: 'Triggers when a new task is created', type: 'polling' as const }],
    [{ key: 'create_task', name: 'Create Task', description: 'Create a task in ProofHub' }, { key: 'create_note', name: 'Create Note', description: 'Create a note' }]),

  m('smartsheet', 'Smartsheet', 'Work execution platform with spreadsheet-like interface', 'productivity', 'oauth2',
    oauth2Config('https://app.smartsheet.com/b/authorize', 'https://api.smartsheet.com/2.0/token', ['READ_SHEETS', 'WRITE_SHEETS']),
    [{ key: 'new_row', name: 'New Row', description: 'Triggers when a new row is added to a sheet', type: 'polling' as const }],
    [{ key: 'add_row', name: 'Add Row', description: 'Add a new row to a sheet' }, { key: 'update_row', name: 'Update Row', description: 'Update an existing row' }]),

  m('quip', 'Quip', 'Collaborative productivity platform by Salesforce', 'productivity', 'bearer',
    bearerConfig(),
    [{ key: 'new_document', name: 'New Document', description: 'Triggers when a new document is created', type: 'polling' as const }],
    [{ key: 'create_document', name: 'Create Document', description: 'Create a new document' }, { key: 'add_message', name: 'Add Message', description: 'Add a message to a document' }]),

  m('coda', 'Coda', 'All-in-one collaborative document editor', 'productivity', 'bearer',
    bearerConfig(),
    [{ key: 'new_row', name: 'New Row', description: 'Triggers when a new row is added to a table', type: 'polling' as const }],
    [{ key: 'add_row', name: 'Add Row', description: 'Add a row to a Coda table' }, { key: 'update_row', name: 'Update Row', description: 'Update a row in a table' }]),

  m('nuclino', 'Nuclino', 'Lightweight wiki and knowledge base for teams', 'productivity', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_item', name: 'New Item', description: 'Triggers when a new item is created', type: 'polling' as const }],
    [{ key: 'create_item', name: 'Create Item', description: 'Create a new item in a workspace' }]),

  m('tettra', 'Tettra', 'Internal knowledge base for Slack teams', 'productivity', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_page', name: 'New Page', description: 'Triggers when a new page is created', type: 'polling' as const }],
    [{ key: 'create_page', name: 'Create Page', description: 'Create a new page in Tettra' }]),
];

// ─── Developer (15) ──────────────────────────────────────────────────────────

export const tier2DeveloperManifests: ConnectorManifest[] = [
  m('github', 'GitHub', 'Version control and collaboration platform for developers', 'developer', 'oauth2',
    oauth2Config('https://github.com/login/oauth/authorize', 'https://github.com/login/oauth/access_token', ['repo', 'issues', 'pull_requests']),
    [{ key: 'new_push', name: 'New Push', description: 'Triggers on new code push to a repository', type: 'polling' as const }, { key: 'new_issue', name: 'New Issue', description: 'Triggers when a new issue is opened', type: 'polling' as const }],
    [{ key: 'create_issue', name: 'Create Issue', description: 'Create a new GitHub issue' }, { key: 'create_comment', name: 'Create Comment', description: 'Comment on an issue or PR' }]),

  m('gitlab', 'GitLab', 'DevOps platform with Git repository management', 'developer', 'oauth2',
    oauth2Config('https://gitlab.com/oauth/authorize', 'https://gitlab.com/oauth/token', ['api', 'read_user']),
    [{ key: 'new_push', name: 'New Push', description: 'Triggers on new code push', type: 'polling' as const }, { key: 'new_merge_request', name: 'New Merge Request', description: 'Triggers when a new MR is created', type: 'polling' as const }],
    [{ key: 'create_issue', name: 'Create Issue', description: 'Create a new issue' }, { key: 'create_merge_request', name: 'Create Merge Request', description: 'Create a new MR' }]),

  m('bitbucket', 'Bitbucket', 'Git code hosting and collaboration tool by Atlassian', 'developer', 'oauth2',
    oauth2Config('https://bitbucket.org/site/oauth2/authorize', 'https://bitbucket.org/site/oauth2/access_token', ['repository', 'pullrequest']),
    [{ key: 'new_commit', name: 'New Commit', description: 'Triggers when a new commit is pushed', type: 'polling' as const }, { key: 'new_pull_request', name: 'New Pull Request', description: 'Triggers when a PR is created', type: 'polling' as const }],
    [{ key: 'create_issue', name: 'Create Issue', description: 'Create a new issue' }]),

  m('jira', 'Jira', 'Issue and project tracking for software teams', 'developer', 'oauth2',
    oauth2Config('https://auth.atlassian.com/authorize', 'https://auth.atlassian.com/oauth/token', ['read:jira-work', 'write:jira-work']),
    [{ key: 'new_issue', name: 'New Issue', description: 'Triggers when a new issue is created', type: 'polling' as const }, { key: 'issue_status_changed', name: 'Issue Status Changed', description: 'Triggers when an issue status changes', type: 'polling' as const }],
    [{ key: 'create_issue', name: 'Create Issue', description: 'Create a new Jira issue' }, { key: 'update_issue', name: 'Update Issue', description: 'Update an existing issue' }]),

  m('linear', 'Linear', 'Modern issue tracker built for high-performance teams', 'developer', 'oauth2',
    oauth2Config('https://linear.app/oauth/authorize', 'https://api.linear.app/oauth/token', ['read', 'write']),
    [{ key: 'new_issue', name: 'New Issue', description: 'Triggers when a new issue is created', type: 'polling' as const }, { key: 'issue_updated', name: 'Issue Updated', description: 'Triggers when an issue is updated', type: 'polling' as const }],
    [{ key: 'create_issue', name: 'Create Issue', description: 'Create a new Linear issue' }, { key: 'update_issue_state', name: 'Update Issue State', description: 'Change the state of an issue' }]),

  m('shortcut', 'Shortcut', 'Project management for software teams (formerly Clubhouse)', 'developer', 'api_key',
    apiKeyConfig('Shortcut-Token'),
    [{ key: 'new_story', name: 'New Story', description: 'Triggers when a new story is created', type: 'polling' as const }],
    [{ key: 'create_story', name: 'Create Story', description: 'Create a new story in Shortcut' }, { key: 'update_story', name: 'Update Story', description: 'Update a story\'s details' }]),

  m('azure-devops', 'Azure DevOps', 'Microsoft\'s DevOps services for planning and collaboration', 'developer', 'bearer',
    bearerConfig(),
    [{ key: 'new_work_item', name: 'New Work Item', description: 'Triggers when a new work item is created', type: 'polling' as const }],
    [{ key: 'create_work_item', name: 'Create Work Item', description: 'Create a new work item' }, { key: 'update_work_item', name: 'Update Work Item', description: 'Update an existing work item' }], true),

  m('sentry', 'Sentry', 'Application performance monitoring and error tracking', 'developer', 'oauth2',
    oauth2Config('https://sentry.io/oauth/authorize/', 'https://sentry.io/oauth/token/', ['project:read', 'event:read']),
    [{ key: 'new_error', name: 'New Error', description: 'Triggers when a new error is captured', type: 'polling' as const }, { key: 'issue_resolved', name: 'Issue Resolved', description: 'Triggers when an issue is resolved', type: 'polling' as const }],
    [{ key: 'create_comment', name: 'Create Comment', description: 'Add a comment to an issue' }, { key: 'resolve_issue', name: 'Resolve Issue', description: 'Mark an issue as resolved' }]),

  m('datadog', 'Datadog', 'Cloud monitoring and analytics platform', 'developer', 'api_key',
    apiKeyConfig('DD-API-KEY'),
    [{ key: 'new_alert', name: 'New Alert', description: 'Triggers when a monitor alert fires', type: 'polling' as const }],
    [{ key: 'send_event', name: 'Send Event', description: 'Send a custom event to Datadog' }, { key: 'create_metric', name: 'Create Metric', description: 'Submit a custom metric' }]),

  m('pagerduty', 'PagerDuty', 'Digital operations management platform for incident response', 'developer', 'oauth2',
    oauth2Config('https://identity.pagerduty.com/oauth/authorize', 'https://identity.pagerduty.com/oauth/token', ['write', 'read']),
    [{ key: 'new_incident', name: 'New Incident', description: 'Triggers when a new incident is created', type: 'polling' as const }, { key: 'incident_resolved', name: 'Incident Resolved', description: 'Triggers when an incident is resolved', type: 'polling' as const }],
    [{ key: 'create_incident', name: 'Create Incident', description: 'Create a new PagerDuty incident' }, { key: 'acknowledge_incident', name: 'Acknowledge Incident', description: 'Acknowledge an open incident' }]),

  m('opsgenie', 'OpsGenie', 'Incident management and alerting by Atlassian', 'developer', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_alert', name: 'New Alert', description: 'Triggers when a new alert is created', type: 'polling' as const }],
    [{ key: 'create_alert', name: 'Create Alert', description: 'Create a new OpsGenie alert' }, { key: 'close_alert', name: 'Close Alert', description: 'Close an existing alert' }]),

  m('statuspage', 'Statuspage', 'Communicate service status and incidents to users', 'developer', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_incident', name: 'New Incident', description: 'Triggers when a new incident is created', type: 'polling' as const }],
    [{ key: 'create_incident', name: 'Create Incident', description: 'Create a new status incident' }, { key: 'update_component', name: 'Update Component', description: 'Update a component\'s status' }]),

  m('launchdarkly', 'LaunchDarkly', 'Feature flag and experimentation platform', 'developer', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'flag_changed', name: 'Flag Changed', description: 'Triggers when a feature flag is updated', type: 'polling' as const }],
    [{ key: 'toggle_flag', name: 'Toggle Flag', description: 'Enable or disable a feature flag' }, { key: 'create_flag', name: 'Create Flag', description: 'Create a new feature flag' }]),

  m('rollbar', 'Rollbar', 'Real-time error monitoring and debugging platform', 'developer', 'api_key',
    apiKeyConfig('X-Rollbar-Access-Token'),
    [{ key: 'new_occurrence', name: 'New Occurrence', description: 'Triggers when a new error occurrence is logged', type: 'polling' as const }],
    [{ key: 'resolve_item', name: 'Resolve Item', description: 'Mark an error item as resolved' }]),

  m('bugsnag', 'Bugsnag', 'Application stability management and error monitoring', 'developer', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_error', name: 'New Error', description: 'Triggers when a new error is detected', type: 'polling' as const }],
    [{ key: 'ignore_error', name: 'Ignore Error', description: 'Mark an error as ignored' }]),
];

// ─── Marketing (15) ──────────────────────────────────────────────────────────

export const tier2MarketingManifests: ConnectorManifest[] = [
  m('mailchimp', 'Mailchimp', 'Email marketing and automation platform', 'marketing', 'oauth2',
    oauth2Config('https://login.mailchimp.com/oauth2/authorize', 'https://login.mailchimp.com/oauth2/token', ['basic']),
    [{ key: 'new_subscriber', name: 'New Subscriber', description: 'Triggers when someone subscribes to a list', type: 'polling' as const }, { key: 'unsubscribe', name: 'Unsubscribe', description: 'Triggers when someone unsubscribes', type: 'polling' as const }],
    [{ key: 'add_subscriber', name: 'Add Subscriber', description: 'Add a new subscriber to a list' }, { key: 'send_campaign', name: 'Send Campaign', description: 'Send an email campaign' }]),

  m('klaviyo', 'Klaviyo', 'Email and SMS marketing automation for eCommerce', 'marketing', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_profile', name: 'New Profile', description: 'Triggers when a new profile is created', type: 'polling' as const }],
    [{ key: 'create_profile', name: 'Create Profile', description: 'Create a new customer profile' }, { key: 'track_event', name: 'Track Event', description: 'Track a custom event for a profile' }]),

  m('campaign-monitor', 'Campaign Monitor', 'Email marketing platform for designers and agencies', 'marketing', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_subscriber', name: 'New Subscriber', description: 'Triggers when a new subscriber is added', type: 'polling' as const }],
    [{ key: 'add_subscriber', name: 'Add Subscriber', description: 'Add a subscriber to a list' }, { key: 'send_campaign', name: 'Send Campaign', description: 'Send an email campaign' }]),

  m('constant-contact', 'Constant Contact', 'Digital marketing platform for small businesses', 'marketing', 'oauth2',
    oauth2Config('https://authz.constantcontact.com/oauth2/default/v1/authorize', 'https://authz.constantcontact.com/oauth2/default/v1/token', ['contact_data', 'campaign_data']),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is added', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Add a new contact' }, { key: 'send_email', name: 'Send Email', description: 'Send an email to a contact list' }]),

  m('brevo', 'Brevo', 'All-in-one marketing platform (formerly Sendinblue)', 'marketing', 'api_key',
    apiKeyConfig('api-key'),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is added', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Add a contact to Brevo' }, { key: 'send_transactional_email', name: 'Send Transactional Email', description: 'Send a transactional email' }]),

  m('convertkit', 'ConvertKit', 'Email marketing for creators and entrepreneurs', 'marketing', 'api_key',
    apiKeyConfig('api_key'),
    [{ key: 'new_subscriber', name: 'New Subscriber', description: 'Triggers when a subscriber joins a form', type: 'polling' as const }],
    [{ key: 'add_subscriber', name: 'Add Subscriber', description: 'Subscribe someone to a form' }, { key: 'add_tag', name: 'Add Tag', description: 'Tag a subscriber' }]),

  m('drip', 'Drip', 'ECRM for building personal, branded customer relationships', 'marketing', 'bearer',
    bearerConfig(),
    [{ key: 'new_subscriber', name: 'New Subscriber', description: 'Triggers when a new subscriber is created', type: 'polling' as const }],
    [{ key: 'create_subscriber', name: 'Create Subscriber', description: 'Create a new subscriber' }, { key: 'apply_tag', name: 'Apply Tag', description: 'Apply a tag to a subscriber' }]),

  m('activecampaign-mkt', 'ActiveCampaign Marketing', 'Marketing automation and email sequences', 'marketing', 'api_key',
    apiKeyConfig('Api-Token'),
    [{ key: 'automation_complete', name: 'Automation Complete', description: 'Triggers when a contact completes an automation', type: 'polling' as const }],
    [{ key: 'add_to_automation', name: 'Add to Automation', description: 'Add a contact to an automation sequence' }]),

  m('getresponse', 'GetResponse', 'Email marketing, landing pages, and webinar platform', 'marketing', 'api_key',
    apiKeyConfig('X-Auth-Token'),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact subscribes', type: 'polling' as const }],
    [{ key: 'add_contact', name: 'Add Contact', description: 'Add a new contact to a list' }, { key: 'send_newsletter', name: 'Send Newsletter', description: 'Send a newsletter to a list' }]),

  m('aweber', 'AWeber', 'Email marketing and automation for entrepreneurs', 'marketing', 'oauth2',
    oauth2Config('https://auth.aweber.com/oauth2/authorize', 'https://auth.aweber.com/oauth2/token', ['subscriber.read', 'subscriber.write']),
    [{ key: 'new_subscriber', name: 'New Subscriber', description: 'Triggers when a new subscriber signs up', type: 'polling' as const }],
    [{ key: 'add_subscriber', name: 'Add Subscriber', description: 'Add a subscriber to a list' }]),

  m('omnisend', 'Omnisend', 'Marketing automation for eCommerce businesses', 'marketing', 'api_key',
    apiKeyConfig('X-API-Key'),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is created', type: 'polling' as const }],
    [{ key: 'create_contact', name: 'Create Contact', description: 'Create a new contact in Omnisend' }, { key: 'track_event', name: 'Track Event', description: 'Track a custom event' }]),

  m('iterable', 'Iterable', 'Cross-channel marketing platform for growth', 'marketing', 'api_key',
    apiKeyConfig('Api_Key'),
    [{ key: 'new_event', name: 'New Event', description: 'Triggers when a new custom event fires', type: 'polling' as const }],
    [{ key: 'track_event', name: 'Track Event', description: 'Track an event for a user' }, { key: 'update_user', name: 'Update User', description: 'Update user profile data' }]),

  m('customer-io', 'Customer.io', 'Data-driven messaging and marketing automation', 'marketing', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_event', name: 'New Event', description: 'Triggers when a new event is tracked', type: 'polling' as const }],
    [{ key: 'identify_customer', name: 'Identify Customer', description: 'Create or update a customer' }, { key: 'track_event', name: 'Track Event', description: 'Track an event for a customer' }]),

  m('vero', 'Vero', 'Behavioral email marketing platform', 'marketing', 'api_key',
    apiKeyConfig('Authorization'),
    [],
    [{ key: 'identify_user', name: 'Identify User', description: 'Create or update a user profile' }, { key: 'track_event', name: 'Track Event', description: 'Track a user event' }]),

  m('autopilot', 'Ortto', 'Customer journey automation platform (formerly Autopilot)', 'marketing', 'api_key',
    apiKeyConfig('autopilotapikey'),
    [{ key: 'new_contact', name: 'New Contact', description: 'Triggers when a new contact is created', type: 'polling' as const }],
    [{ key: 'add_contact', name: 'Add Contact', description: 'Add or update a contact' }, { key: 'add_to_journey', name: 'Add to Journey', description: 'Enroll a contact in a journey' }]),
];

// ─── eCommerce (10) ──────────────────────────────────────────────────────────

export const tier2EcommerceManifests: ConnectorManifest[] = [
  m('shopify', 'Shopify', 'Leading eCommerce platform for online stores', 'ecommerce', 'oauth2',
    oauth2Config('https://{shop}.myshopify.com/admin/oauth/authorize', 'https://{shop}.myshopify.com/admin/oauth/access_token', ['read_orders', 'write_orders', 'read_products']),
    [{ key: 'new_order', name: 'New Order', description: 'Triggers when a new order is placed', type: 'polling' as const }, { key: 'new_customer', name: 'New Customer', description: 'Triggers when a new customer registers', type: 'polling' as const }],
    [{ key: 'create_product', name: 'Create Product', description: 'Add a new product to the store' }, { key: 'update_order', name: 'Update Order', description: 'Update an existing order' }]),

  m('woocommerce', 'WooCommerce', 'Open-source eCommerce plugin for WordPress', 'ecommerce', 'basic',
    basicConfig(),
    [{ key: 'new_order', name: 'New Order', description: 'Triggers when a new order is received', type: 'polling' as const }, { key: 'order_status_changed', name: 'Order Status Changed', description: 'Triggers when order status changes', type: 'polling' as const }],
    [{ key: 'create_order', name: 'Create Order', description: 'Create a new order' }, { key: 'update_product', name: 'Update Product', description: 'Update product details' }]),

  m('bigcommerce', 'BigCommerce', 'Enterprise eCommerce platform for fast-growing businesses', 'ecommerce', 'api_key',
    apiKeyConfig('X-Auth-Token'),
    [{ key: 'new_order', name: 'New Order', description: 'Triggers when a new order is placed', type: 'polling' as const }],
    [{ key: 'create_product', name: 'Create Product', description: 'Create a new product' }, { key: 'update_order_status', name: 'Update Order Status', description: 'Change the status of an order' }]),

  m('magento', 'Adobe Commerce', 'Enterprise eCommerce platform by Adobe (formerly Magento)', 'ecommerce', 'bearer',
    bearerConfig(),
    [{ key: 'new_order', name: 'New Order', description: 'Triggers when a new order is created', type: 'polling' as const }],
    [{ key: 'create_order', name: 'Create Order', description: 'Create a new order' }, { key: 'update_inventory', name: 'Update Inventory', description: 'Update product inventory quantities' }], true),

  m('squarespace-commerce', 'Squarespace Commerce', 'Integrated online store for Squarespace websites', 'ecommerce', 'oauth2',
    oauth2Config('https://login.squarespace.com/api/1/login/oauth/provider/authorize', 'https://login.squarespace.com/api/1/login/oauth/provider/token', ['website.orders.read']),
    [{ key: 'new_order', name: 'New Order', description: 'Triggers when a new order is placed', type: 'polling' as const }],
    [{ key: 'fulfill_order', name: 'Fulfill Order', description: 'Mark an order as fulfilled' }]),

  m('wix-stores', 'Wix Stores', 'eCommerce solution integrated into Wix websites', 'ecommerce', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_order', name: 'New Order', description: 'Triggers when a new store order is placed', type: 'polling' as const }],
    [{ key: 'create_product', name: 'Create Product', description: 'Add a new product to the Wix store' }]),

  m('stripe', 'Stripe', 'Online payments and billing infrastructure', 'ecommerce', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_payment', name: 'New Payment', description: 'Triggers when a payment is received', type: 'polling' as const }, { key: 'new_customer', name: 'New Customer', description: 'Triggers when a new customer is created', type: 'polling' as const }],
    [{ key: 'create_charge', name: 'Create Charge', description: 'Create a new payment charge' }, { key: 'create_customer', name: 'Create Customer', description: 'Create a new Stripe customer' }]),

  m('paypal', 'PayPal', 'Global payments platform for individuals and businesses', 'ecommerce', 'oauth2',
    oauth2Config('https://www.paypal.com/signin/authorize', 'https://api.paypal.com/v1/oauth2/token', ['openid', 'email']),
    [{ key: 'new_payment', name: 'New Payment', description: 'Triggers when a new payment is received', type: 'polling' as const }],
    [{ key: 'send_payment', name: 'Send Payment', description: 'Send a payment to a recipient' }, { key: 'create_invoice', name: 'Create Invoice', description: 'Create a new PayPal invoice' }]),

  m('square', 'Square', 'Payments, POS, and business management tools', 'ecommerce', 'oauth2',
    oauth2Config('https://connect.squareup.com/oauth2/authorize', 'https://connect.squareup.com/oauth2/token', ['PAYMENTS_READ', 'PAYMENTS_WRITE']),
    [{ key: 'new_payment', name: 'New Payment', description: 'Triggers when a new payment is processed', type: 'polling' as const }],
    [{ key: 'create_payment', name: 'Create Payment', description: 'Process a new payment' }, { key: 'create_customer', name: 'Create Customer', description: 'Create a new customer' }]),

  m('recurly', 'Recurly', 'Subscription billing and revenue management platform', 'ecommerce', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_subscription', name: 'New Subscription', description: 'Triggers when a new subscription is created', type: 'polling' as const }, { key: 'subscription_cancelled', name: 'Subscription Cancelled', description: 'Triggers when a subscription is cancelled', type: 'polling' as const }],
    [{ key: 'create_subscription', name: 'Create Subscription', description: 'Create a new subscription' }, { key: 'cancel_subscription', name: 'Cancel Subscription', description: 'Cancel a subscription' }]),
];

// ─── Finance (10) ────────────────────────────────────────────────────────────

export const tier2FinanceManifests: ConnectorManifest[] = [
  m('quickbooks', 'QuickBooks Online', 'Small business accounting software by Intuit', 'finance', 'oauth2',
    oauth2Config('https://appcenter.intuit.com/connect/oauth2', 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', ['com.intuit.quickbooks.accounting']),
    [{ key: 'new_invoice', name: 'New Invoice', description: 'Triggers when a new invoice is created', type: 'polling' as const }, { key: 'new_expense', name: 'New Expense', description: 'Triggers when a new expense is added', type: 'polling' as const }],
    [{ key: 'create_invoice', name: 'Create Invoice', description: 'Create a new invoice' }, { key: 'create_customer', name: 'Create Customer', description: 'Create a new customer record' }]),

  m('xero', 'Xero', 'Cloud-based accounting software for small businesses', 'finance', 'oauth2',
    oauth2Config('https://login.xero.com/identity/connect/authorize', 'https://identity.xero.com/connect/token', ['openid', 'profile', 'email', 'accounting.transactions']),
    [{ key: 'new_invoice', name: 'New Invoice', description: 'Triggers when a new invoice is created', type: 'polling' as const }, { key: 'new_payment', name: 'New Payment', description: 'Triggers when a payment is received', type: 'polling' as const }],
    [{ key: 'create_invoice', name: 'Create Invoice', description: 'Create a new invoice in Xero' }, { key: 'create_contact', name: 'Create Contact', description: 'Add a new contact' }]),

  m('freshbooks', 'FreshBooks', 'Cloud accounting for freelancers and small businesses', 'finance', 'oauth2',
    oauth2Config('https://my.freshbooks.com/service/auth/oauth/authorize', 'https://api.freshbooks.com/auth/oauth/token', ['user:profile:read', 'user:invoices:read', 'user:invoices:write']),
    [{ key: 'new_invoice', name: 'New Invoice', description: 'Triggers when a new invoice is created', type: 'polling' as const }, { key: 'payment_received', name: 'Payment Received', description: 'Triggers when a payment is received', type: 'polling' as const }],
    [{ key: 'create_invoice', name: 'Create Invoice', description: 'Generate a new invoice' }, { key: 'create_client', name: 'Create Client', description: 'Add a new client' }]),

  m('wave', 'Wave', 'Free accounting software for small businesses', 'finance', 'oauth2',
    oauth2Config('https://api.waveapps.com/oauth2/authorize/', 'https://api.waveapps.com/oauth2/token/', ['account:read', 'transaction:read', 'transaction:write']),
    [{ key: 'new_transaction', name: 'New Transaction', description: 'Triggers when a new transaction is recorded', type: 'polling' as const }],
    [{ key: 'create_invoice', name: 'Create Invoice', description: 'Create a new invoice in Wave' }, { key: 'create_customer', name: 'Create Customer', description: 'Add a new customer' }]),

  m('sage', 'Sage Business Cloud', 'Accounting and business management software', 'finance', 'oauth2',
    oauth2Config('https://www.sageone.com/oauth2/auth/central', 'https://oauth.accounting.sage.com/token', ['readonly']),
    [{ key: 'new_invoice', name: 'New Invoice', description: 'Triggers when a new sales invoice is created', type: 'polling' as const }],
    [{ key: 'create_invoice', name: 'Create Invoice', description: 'Create a sales invoice' }, { key: 'create_contact', name: 'Create Contact', description: 'Add a new contact' }], true),

  m('zoho-books', 'Zoho Books', 'Online accounting software for small businesses', 'finance', 'oauth2',
    oauth2Config('https://accounts.zoho.com/oauth/v2/auth', 'https://accounts.zoho.com/oauth/v2/token', ['ZohoBooks.fullaccess.all']),
    [{ key: 'new_invoice', name: 'New Invoice', description: 'Triggers when a new invoice is created', type: 'polling' as const }],
    [{ key: 'create_invoice', name: 'Create Invoice', description: 'Create a new invoice' }, { key: 'create_contact', name: 'Create Contact', description: 'Add a new contact' }]),

  m('chargebee', 'Chargebee', 'Subscription billing and revenue operations platform', 'finance', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_subscription', name: 'New Subscription', description: 'Triggers when a new subscription is created', type: 'polling' as const }, { key: 'subscription_cancelled', name: 'Subscription Cancelled', description: 'Triggers when a subscription is cancelled', type: 'polling' as const }],
    [{ key: 'create_subscription', name: 'Create Subscription', description: 'Create a new subscription' }, { key: 'apply_coupon', name: 'Apply Coupon', description: 'Apply a discount coupon to a subscription' }]),

  m('paddle', 'Paddle', 'Payment infrastructure for software companies', 'finance', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_payment', name: 'New Payment', description: 'Triggers on new payment completion', type: 'polling' as const }, { key: 'new_subscription', name: 'New Subscription', description: 'Triggers on new subscription creation', type: 'polling' as const }],
    [{ key: 'create_coupon', name: 'Create Coupon', description: 'Generate a new discount coupon' }, { key: 'update_subscription', name: 'Update Subscription', description: 'Modify an existing subscription' }]),

  m('braintree', 'Braintree', 'Full-stack payment platform by PayPal', 'finance', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_transaction', name: 'New Transaction', description: 'Triggers when a new transaction is processed', type: 'polling' as const }],
    [{ key: 'create_transaction', name: 'Create Transaction', description: 'Process a new payment transaction' }, { key: 'create_customer', name: 'Create Customer', description: 'Create a new customer vault record' }]),

  m('adyen', 'Adyen', 'End-to-end payments platform for global businesses', 'finance', 'api_key',
    apiKeyConfig('X-API-Key'),
    [{ key: 'payment_received', name: 'Payment Received', description: 'Triggers when a payment notification is received', type: 'polling' as const }],
    [{ key: 'create_payment', name: 'Create Payment', description: 'Initiate a payment' }, { key: 'refund_payment', name: 'Refund Payment', description: 'Issue a refund for a payment' }], true),
];

// ─── Storage/Files (5) ───────────────────────────────────────────────────────

export const tier2StorageManifests: ConnectorManifest[] = [
  m('google-drive', 'Google Drive', 'Cloud storage and file management by Google', 'storage', 'oauth2',
    oauth2Config('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/drive']),
    [{ key: 'new_file', name: 'New File', description: 'Triggers when a new file is added to a folder', type: 'polling' as const }, { key: 'file_updated', name: 'File Updated', description: 'Triggers when a file is modified', type: 'polling' as const }],
    [{ key: 'upload_file', name: 'Upload File', description: 'Upload a file to Google Drive' }, { key: 'create_folder', name: 'Create Folder', description: 'Create a new folder' }]),

  m('dropbox', 'Dropbox', 'Cloud storage and file sync platform', 'storage', 'oauth2',
    oauth2Config('https://www.dropbox.com/oauth2/authorize', 'https://api.dropbox.com/oauth2/token', ['files.content.read', 'files.content.write']),
    [{ key: 'new_file', name: 'New File', description: 'Triggers when a new file is added to a folder', type: 'polling' as const }],
    [{ key: 'upload_file', name: 'Upload File', description: 'Upload a file to Dropbox' }, { key: 'create_folder', name: 'Create Folder', description: 'Create a new folder in Dropbox' }]),

  m('box', 'Box', 'Secure cloud content management and collaboration', 'storage', 'oauth2',
    oauth2Config('https://account.box.com/api/oauth2/authorize', 'https://api.box.com/oauth2/token', ['root_readwrite']),
    [{ key: 'new_file', name: 'New File', description: 'Triggers when a new file is uploaded to a folder', type: 'polling' as const }],
    [{ key: 'upload_file', name: 'Upload File', description: 'Upload a file to Box' }, { key: 'create_folder', name: 'Create Folder', description: 'Create a new folder in Box' }]),

  m('onedrive', 'OneDrive', 'Cloud storage by Microsoft for individuals and businesses', 'storage', 'oauth2',
    oauth2Config('https://login.microsoftonline.com/common/oauth2/v2.0/authorize', 'https://login.microsoftonline.com/common/oauth2/v2.0/token', ['Files.ReadWrite', 'offline_access']),
    [{ key: 'new_file', name: 'New File', description: 'Triggers when a new file is added to a folder', type: 'polling' as const }],
    [{ key: 'upload_file', name: 'Upload File', description: 'Upload a file to OneDrive' }, { key: 'create_folder', name: 'Create Folder', description: 'Create a new folder' }]),

  m('amazon-s3', 'Amazon S3', 'Scalable object storage by AWS', 'storage', 'api_key',
    apiKeyConfig('X-Amz-Security-Token'),
    [{ key: 'new_object', name: 'New Object', description: 'Triggers when a new object is uploaded to a bucket', type: 'polling' as const }],
    [{ key: 'upload_object', name: 'Upload Object', description: 'Upload an object to an S3 bucket' }, { key: 'delete_object', name: 'Delete Object', description: 'Delete an object from a bucket' }, { key: 'generate_presigned_url', name: 'Generate Pre-Signed URL', description: 'Create a time-limited download URL' }]),
];

// ─── Analytics (10) ──────────────────────────────────────────────────────────

export const tier2AnalyticsManifests: ConnectorManifest[] = [
  m('google-analytics', 'Google Analytics', 'Web analytics service by Google', 'analytics', 'oauth2',
    oauth2Config('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/analytics.readonly']),
    [],
    [{ key: 'get_report', name: 'Get Report', description: 'Retrieve an analytics report' }, { key: 'track_event', name: 'Track Event', description: 'Send a custom event to Analytics' }]),

  m('mixpanel', 'Mixpanel', 'Product analytics for web and mobile apps', 'analytics', 'api_key',
    apiKeyConfig('Authorization'),
    [],
    [{ key: 'track_event', name: 'Track Event', description: 'Track a user event in Mixpanel' }, { key: 'identify_user', name: 'Identify User', description: 'Create or update a user profile' }]),

  m('amplitude', 'Amplitude', 'Digital analytics platform for product teams', 'analytics', 'api_key',
    apiKeyConfig('Authorization'),
    [],
    [{ key: 'track_event', name: 'Track Event', description: 'Send a custom event to Amplitude' }, { key: 'identify_user', name: 'Identify User', description: 'Create or update a user identity' }]),

  m('segment', 'Segment', 'Customer data platform for collecting and routing analytics data', 'analytics', 'api_key',
    apiKeyConfig('Authorization'),
    [],
    [{ key: 'track', name: 'Track', description: 'Record a user action' }, { key: 'identify', name: 'Identify', description: 'Tie a user to their actions and record traits' }, { key: 'page', name: 'Page', description: 'Record page view events' }]),

  m('heap', 'Heap', 'Digital insights platform that auto-captures all user behavior', 'analytics', 'api_key',
    apiKeyConfig('Authorization'),
    [],
    [{ key: 'track_event', name: 'Track Event', description: 'Send a custom event to Heap' }, { key: 'add_user_properties', name: 'Add User Properties', description: 'Update user properties in Heap' }]),

  m('hotjar', 'Hotjar', 'Behavior analytics and user feedback tool', 'analytics', 'api_key',
    apiKeyConfig('Authorization'),
    [],
    [{ key: 'create_survey', name: 'Create Survey', description: 'Create a new survey in Hotjar' }]),

  m('fullstory', 'FullStory', 'Digital experience intelligence platform', 'analytics', 'api_key',
    apiKeyConfig('Authorization'),
    [],
    [{ key: 'set_user_vars', name: 'Set User Variables', description: 'Tag users with custom data' }]),

  m('pendo', 'Pendo', 'Product analytics and user guidance platform', 'analytics', 'api_key',
    apiKeyConfig('x-pendo-integration-key'),
    [],
    [{ key: 'track_event', name: 'Track Event', description: 'Send a custom event to Pendo' }, { key: 'update_visitor', name: 'Update Visitor', description: 'Update visitor metadata' }]),

  m('logrocket', 'LogRocket', 'Session replay and application monitoring platform', 'analytics', 'api_key',
    apiKeyConfig('Authorization'),
    [],
    [{ key: 'track_event', name: 'Track Event', description: 'Log a custom event in LogRocket' }]),

  m('chartbeat', 'Chartbeat', 'Real-time analytics for digital publishing', 'analytics', 'api_key',
    apiKeyConfig('apikey'),
    [],
    [{ key: 'get_summary', name: 'Get Summary', description: 'Retrieve real-time traffic summary data' }]),
];

// ─── HR/People (10) ──────────────────────────────────────────────────────────

export const tier2HrManifests: ConnectorManifest[] = [
  m('bamboohr', 'BambooHR', 'HR software for small and medium businesses', 'utility', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_employee', name: 'New Employee', description: 'Triggers when a new employee record is created', type: 'polling' as const }],
    [{ key: 'create_employee', name: 'Create Employee', description: 'Add a new employee to BambooHR' }, { key: 'update_employee', name: 'Update Employee', description: 'Update employee information' }]),

  m('workday', 'Workday', 'Enterprise cloud applications for finance and HR', 'utility', 'oauth2',
    oauth2Config('https://wd2.myworkday.com/authenticate', 'https://wd2.myworkday.com/oauth2/token', ['Human_Resources']),
    [{ key: 'new_hire', name: 'New Hire', description: 'Triggers when a new employee is onboarded', type: 'polling' as const }],
    [{ key: 'create_position', name: 'Create Position', description: 'Create a new open position' }], true),

  m('greenhouse', 'Greenhouse', 'Recruiting and applicant tracking system', 'utility', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_application', name: 'New Application', description: 'Triggers when a new job application is received', type: 'polling' as const }, { key: 'candidate_hired', name: 'Candidate Hired', description: 'Triggers when a candidate is marked as hired', type: 'polling' as const }],
    [{ key: 'create_candidate', name: 'Create Candidate', description: 'Add a new candidate to Greenhouse' }, { key: 'add_note', name: 'Add Note', description: 'Add a note to a candidate profile' }]),

  m('lever', 'Lever', 'Modern applicant tracking and recruiting software', 'utility', 'oauth2',
    oauth2Config('https://auth.lever.co/authorize', 'https://auth.lever.co/oauth/token', ['opportunities:read:admin', 'opportunities:write:admin']),
    [{ key: 'new_opportunity', name: 'New Opportunity', description: 'Triggers when a new opportunity is created', type: 'polling' as const }],
    [{ key: 'create_opportunity', name: 'Create Opportunity', description: 'Create a new opportunity in Lever' }, { key: 'add_note', name: 'Add Note', description: 'Add a note to an opportunity' }]),

  m('adp', 'ADP Workforce Now', 'Payroll and HR management for businesses of all sizes', 'utility', 'oauth2',
    oauth2Config('https://accounts.adp.com/auth/oauth/v2/authorize', 'https://accounts.adp.com/auth/oauth/v2/token', ['openid', 'profile']),
    [{ key: 'new_employee', name: 'New Employee', description: 'Triggers when a new employee is added', type: 'polling' as const }],
    [{ key: 'create_time_off', name: 'Create Time Off', description: 'Submit a time-off request' }], true),

  m('gusto', 'Gusto', 'HR, payroll, and benefits platform for modern businesses', 'utility', 'oauth2',
    oauth2Config('https://api.gusto.com/oauth/authorize', 'https://api.gusto.com/oauth/token', ['openid', 'company_admin']),
    [{ key: 'new_employee', name: 'New Employee', description: 'Triggers when a new employee is hired', type: 'polling' as const }],
    [{ key: 'create_employee', name: 'Create Employee', description: 'Add a new employee to Gusto' }]),

  m('rippling', 'Rippling', 'All-in-one HR, IT, and finance platform', 'utility', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_employee', name: 'New Employee', description: 'Triggers when a new employee is added', type: 'polling' as const }],
    [{ key: 'create_employee', name: 'Create Employee', description: 'Onboard a new employee in Rippling' }, { key: 'update_employee', name: 'Update Employee', description: 'Update employee details' }], true),

  m('lattice', 'Lattice', 'Performance management and employee engagement platform', 'utility', 'api_key',
    apiKeyConfig('Authorization'),
    [{ key: 'new_review', name: 'New Review', description: 'Triggers when a performance review is completed', type: 'polling' as const }],
    [{ key: 'create_goal', name: 'Create Goal', description: 'Create a new goal for an employee' }]),

  m('culture-amp', 'Culture Amp', 'Employee engagement, performance, and development platform', 'utility', 'bearer',
    bearerConfig(),
    [{ key: 'survey_completed', name: 'Survey Completed', description: 'Triggers when an employee completes a survey', type: 'polling' as const }],
    [{ key: 'create_survey', name: 'Create Survey', description: 'Launch a new employee survey' }]),

  m('workable', 'Workable', 'End-to-end recruitment software and applicant tracking', 'utility', 'bearer',
    bearerConfig(),
    [{ key: 'new_candidate', name: 'New Candidate', description: 'Triggers when a new candidate applies', type: 'polling' as const }],
    [{ key: 'create_job', name: 'Create Job', description: 'Post a new job opening' }, { key: 'move_stage', name: 'Move Stage', description: 'Move a candidate to a new pipeline stage' }]),
];

// ─── Export all Tier 2 manifests ─────────────────────────────────────────────

export const tier2Manifests: ConnectorManifest[] = [
  ...tier2CrmManifests,
  ...tier2CommunicationManifests,
  ...tier2ProductivityManifests,
  ...tier2DeveloperManifests,
  ...tier2MarketingManifests,
  ...tier2EcommerceManifests,
  ...tier2FinanceManifests,
  ...tier2StorageManifests,
  ...tier2AnalyticsManifests,
  ...tier2HrManifests,
];
