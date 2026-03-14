// ─── Tier 3 Connector Manifests (300 connectors) ─────────────────────────────
// Extended catalog covering databases, cloud services, social media, AI/ML,
// and miscellaneous verticals.

import type { ConnectorManifest } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const oauth2 = (a: string, t: string, s: string[]): ConnectorManifest['authConfig'] => ({ type: 'oauth2', authorizationUrl: a, tokenUrl: t, scopes: s });
const apiKey = (h = 'X-API-Key'): ConnectorManifest['authConfig'] => ({ type: 'api_key', headerName: h, location: 'header' as const });
const bearer = (): ConnectorManifest['authConfig'] => ({ type: 'bearer', headerName: 'Authorization' });
const basic = (): ConnectorManifest['authConfig'] => ({ type: 'basic', usernameField: 'username', passwordField: 'password' });

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

const t = (key: string, name: string, desc: string): ConnectorManifest['triggers'][0] => ({ key, name, description: desc, type: 'polling' as const });
const a = (key: string, name: string, desc: string): ConnectorManifest['actions'][0] => ({ key, name, description: desc });

// ─── Additional SaaS Tools (50) ──────────────────────────────────────────────

export const tier3SaasManifests: ConnectorManifest[] = [
  m('zendesk', 'Zendesk', 'Customer service and support ticketing platform', 'communication', 'api_key', apiKey('Authorization'),
    [t('new_ticket', 'New Ticket', 'Triggers when a new support ticket is created'), t('ticket_updated', 'Ticket Updated', 'Triggers when a ticket status changes')],
    [a('create_ticket', 'Create Ticket', 'Create a new support ticket'), a('update_ticket', 'Update Ticket', 'Update ticket details')]),

  m('freshdesk', 'Freshdesk', 'Cloud-based customer support software', 'communication', 'api_key', apiKey('Authorization'),
    [t('new_ticket', 'New Ticket', 'Triggers when a new ticket is created')],
    [a('create_ticket', 'Create Ticket', 'Create a new support ticket'), a('reply_to_ticket', 'Reply to Ticket', 'Add a reply to a ticket')]),

  m('helpscout', 'Help Scout', 'Customer service platform for growing businesses', 'communication', 'oauth2', oauth2('https://secure.helpscout.net/authentication/authorizeClientApplication/', 'https://api.helpscout.net/v2/oauth2/token', ['mailbox']),
    [t('new_conversation', 'New Conversation', 'Triggers when a new conversation is created')],
    [a('create_conversation', 'Create Conversation', 'Start a new conversation'), a('reply_to_conversation', 'Reply to Conversation', 'Send a reply in a conversation')]),

  m('hubspot-service', 'HubSpot Service', 'HubSpot customer service and ticketing tools', 'communication', 'oauth2', oauth2('https://app.hubspot.com/oauth/authorize', 'https://api.hubapi.com/oauth/v1/token', ['tickets']),
    [t('new_ticket', 'New Ticket', 'Triggers when a new ticket is created')],
    [a('create_ticket', 'Create Ticket', 'Create a new service ticket'), a('update_ticket', 'Update Ticket', 'Update ticket properties')]),

  m('front', 'Front', 'Shared inbox and team email collaboration tool', 'communication', 'oauth2', oauth2('https://app.frontapp.com/oauth/authorize', 'https://app.frontapp.com/oauth/token', ['shared_inboxes']),
    [t('new_message', 'New Message', 'Triggers when a new message is received')],
    [a('send_message', 'Send Message', 'Send a reply in Front'), a('create_conversation', 'Create Conversation', 'Start a new conversation')]),

  m('zoom', 'Zoom', 'Video conferencing and online meetings platform', 'productivity', 'oauth2', oauth2('https://zoom.us/oauth/authorize', 'https://zoom.us/oauth/token', ['meeting:write:admin', 'user:read:admin']),
    [t('meeting_started', 'Meeting Started', 'Triggers when a meeting starts'), t('recording_completed', 'Recording Completed', 'Triggers when a cloud recording is completed')],
    [a('create_meeting', 'Create Meeting', 'Schedule a new Zoom meeting'), a('add_registrant', 'Add Registrant', 'Register a user for a webinar')]),

  m('google-meet', 'Google Meet', 'Video conferencing by Google', 'productivity', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/calendar']),
    [],
    [a('create_meeting', 'Create Meeting', 'Create a Google Meet meeting link')]),

  m('webex', 'Webex', 'Team collaboration and video conferencing by Cisco', 'communication', 'oauth2', oauth2('https://webexapis.com/v1/authorize', 'https://webexapis.com/v1/access_token', ['spark:all']),
    [t('new_message', 'New Message', 'Triggers when a new message is posted to a room')],
    [a('send_message', 'Send Message', 'Post a message to a Webex space'), a('create_meeting', 'Create Meeting', 'Schedule a Webex meeting')]),

  m('calendly', 'Calendly', 'Automated scheduling and appointment booking platform', 'productivity', 'oauth2', oauth2('https://auth.calendly.com/oauth/authorize', 'https://auth.calendly.com/oauth/token', ['default']),
    [t('new_event', 'New Event Created', 'Triggers when a new event is scheduled')],
    [a('get_event_types', 'Get Event Types', 'Retrieve all event types'), a('cancel_event', 'Cancel Event', 'Cancel a scheduled event')]),

  m('airtable', 'Airtable', 'Flexible cloud database that works like a spreadsheet', 'productivity', 'api_key', apiKey('Authorization'),
    [t('new_record', 'New Record', 'Triggers when a new record is created in a table')],
    [a('create_record', 'Create Record', 'Add a new record to an Airtable table'), a('update_record', 'Update Record', 'Update fields on a record')]),

  m('google-sheets', 'Google Sheets', 'Collaborative spreadsheet application by Google', 'productivity', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/spreadsheets']),
    [t('new_row', 'New Row', 'Triggers when a new row is added')],
    [a('append_row', 'Append Row', 'Add a new row to a spreadsheet'), a('update_row', 'Update Row', 'Update cells in an existing row')]),

  m('google-calendar', 'Google Calendar', 'Calendar and event scheduling by Google', 'productivity', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/calendar']),
    [t('new_event', 'New Event', 'Triggers when a new calendar event is created')],
    [a('create_event', 'Create Event', 'Create a new calendar event'), a('update_event', 'Update Event', 'Modify an existing event')]),

  m('outlook-calendar', 'Outlook Calendar', 'Microsoft calendar and scheduling application', 'productivity', 'oauth2', oauth2('https://login.microsoftonline.com/common/oauth2/v2.0/authorize', 'https://login.microsoftonline.com/common/oauth2/v2.0/token', ['Calendars.ReadWrite']),
    [t('new_event', 'New Event', 'Triggers when a new calendar event is created')],
    [a('create_event', 'Create Event', 'Schedule a new calendar event'), a('update_event', 'Update Event', 'Update an existing event')]),

  m('office365', 'Microsoft 365', 'Microsoft productivity suite including Outlook, Word, and Excel', 'productivity', 'oauth2', oauth2('https://login.microsoftonline.com/common/oauth2/v2.0/authorize', 'https://login.microsoftonline.com/common/oauth2/v2.0/token', ['Mail.ReadWrite', 'Files.ReadWrite']),
    [t('new_email', 'New Email', 'Triggers when a new email arrives in Outlook')],
    [a('send_email', 'Send Email', 'Send an email via Outlook'), a('create_file', 'Create File', 'Create a new file in OneDrive')], true),

  m('typeform', 'Typeform', 'Online form builder and survey platform', 'productivity', 'oauth2', oauth2('https://api.typeform.com/oauth/authorize', 'https://api.typeform.com/oauth/token', ['responses:read', 'forms:read']),
    [t('new_response', 'New Form Response', 'Triggers when a form response is submitted')],
    [a('create_form', 'Create Form', 'Create a new Typeform form')]),

  m('surveymonkey', 'SurveyMonkey', 'Online survey platform for collecting feedback', 'analytics', 'oauth2', oauth2('https://api.surveymonkey.com/oauth/authorize', 'https://api.surveymonkey.com/oauth/token', ['surveys_read', 'responses_read_detail']),
    [t('new_response', 'New Response', 'Triggers when a survey response is received')],
    [a('create_survey', 'Create Survey', 'Create a new survey')]),

  m('google-forms', 'Google Forms', 'Free online form and survey builder by Google', 'productivity', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/forms.body']),
    [t('new_response', 'New Response', 'Triggers when a new form response is submitted')],
    [a('create_form', 'Create Form', 'Create a new Google Form')]),

  m('jotform', 'JotForm', 'Drag-and-drop online form builder', 'productivity', 'api_key', apiKey('APIKEY'),
    [t('new_submission', 'New Submission', 'Triggers when a form is submitted')],
    [a('create_form', 'Create Form', 'Create a new JotForm form')]),

  m('docusign', 'DocuSign', 'Electronic signature and digital transaction management', 'productivity', 'oauth2', oauth2('https://account.docusign.com/oauth/auth', 'https://account.docusign.com/oauth/token', ['signature', 'extended']),
    [t('envelope_completed', 'Envelope Completed', 'Triggers when all signers have signed'), t('envelope_sent', 'Envelope Sent', 'Triggers when an envelope is sent')],
    [a('create_envelope', 'Create Envelope', 'Send a document for signature'), a('void_envelope', 'Void Envelope', 'Cancel a pending signature request')]),

  m('adobe-sign', 'Adobe Acrobat Sign', 'Electronic signature solution by Adobe', 'productivity', 'oauth2', oauth2('https://secure.echosign.com/public/oauth/v2', 'https://api.echosign.com/oauth/v2/token', ['user_read', 'agreement_read', 'agreement_write']),
    [t('agreement_completed', 'Agreement Completed', 'Triggers when an agreement is fully signed')],
    [a('send_agreement', 'Send Agreement', 'Send a document for e-signature')]),

  m('pandadoc', 'PandaDoc', 'Document automation and e-signature platform', 'productivity', 'oauth2', oauth2('https://app.pandadoc.com/oauth2/authorize', 'https://api.pandadoc.com/oauth2/access_token', ['read+write']),
    [t('document_completed', 'Document Completed', 'Triggers when a document is fully signed')],
    [a('create_document', 'Create Document', 'Generate a new document from a template'), a('send_document', 'Send Document', 'Send a document for signature')]),

  m('hellosign', 'Dropbox Sign', 'Simple e-signature platform (formerly HelloSign)', 'productivity', 'oauth2', oauth2('https://app.hellosign.com/oauth/authorize', 'https://app.hellosign.com/oauth/token', ['basic_account_info', 'request_signature']),
    [t('signature_request_signed', 'Request Signed', 'Triggers when a signature request is completed')],
    [a('send_signature_request', 'Send Signature Request', 'Create and send a signature request')]),

  m('zapier', 'Zapier', 'Automation platform connecting 5,000+ apps', 'utility', 'api_key', apiKey('X-API-Key'),
    [t('catch_hook', 'Catch Hook', 'Receives data from Zapier webhooks')],
    [a('trigger_zap', 'Trigger Zap', 'Trigger a Zap in your Zapier account')]),

  m('make', 'Make', 'Visual automation platform (formerly Integromat)', 'utility', 'api_key', apiKey('Authorization'),
    [t('new_scenario_run', 'Scenario Run', 'Triggers when a Make scenario runs')],
    [a('run_scenario', 'Run Scenario', 'Execute a Make scenario'), a('create_hook', 'Create Webhook', 'Create a new Make webhook')]),

  m('n8n', 'n8n', 'Open-source workflow automation tool', 'utility', 'api_key', apiKey('X-N8N-API-KEY'),
    [t('webhook_received', 'Webhook Received', 'Triggers when a webhook is received by n8n')],
    [a('execute_workflow', 'Execute Workflow', 'Trigger an n8n workflow')]),

  m('retool', 'Retool', 'Low-code platform for building internal tools', 'developer', 'bearer', bearer(),
    [],
    [a('trigger_workflow', 'Trigger Workflow', 'Run a Retool workflow'), a('query_database', 'Query Database', 'Execute a database query')]),

  m('appsmith', 'Appsmith', 'Open-source low-code platform for internal apps', 'developer', 'bearer', bearer(),
    [],
    [a('run_query', 'Run Query', 'Execute an Appsmith query or API')]),

  m('webflow', 'Webflow', 'No-code website design and CMS platform', 'productivity', 'oauth2', oauth2('https://webflow.com/oauth/authorize', 'https://api.webflow.com/oauth/access_token', ['cms:read', 'cms:write']),
    [t('new_form_submission', 'New Form Submission', 'Triggers when a Webflow form is submitted')],
    [a('create_item', 'Create CMS Item', 'Create a new CMS collection item'), a('update_item', 'Update CMS Item', 'Update an existing CMS item')]),

  m('wordpress', 'WordPress', 'Popular open-source website and blogging platform', 'productivity', 'basic', basic(),
    [t('new_post', 'New Post', 'Triggers when a new post is published')],
    [a('create_post', 'Create Post', 'Publish a new WordPress post'), a('create_comment', 'Create Comment', 'Add a comment to a post')]),

  m('ghost', 'Ghost', 'Professional publishing platform for independent creators', 'productivity', 'api_key', apiKey('Authorization'),
    [t('new_post', 'New Post', 'Triggers when a new post is published')],
    [a('create_post', 'Create Post', 'Publish a new article on Ghost')]),

  m('contentful', 'Contentful', 'Headless CMS for omnichannel digital experiences', 'developer', 'bearer', bearer(),
    [t('entry_published', 'Entry Published', 'Triggers when a content entry is published')],
    [a('create_entry', 'Create Entry', 'Create a new content entry'), a('publish_entry', 'Publish Entry', 'Publish an existing entry')]),

  m('sanity', 'Sanity', 'Flexible headless CMS with structured content', 'developer', 'bearer', bearer(),
    [t('document_published', 'Document Published', 'Triggers when a document is published in Sanity')],
    [a('create_document', 'Create Document', 'Create a new Sanity document'), a('patch_document', 'Patch Document', 'Update fields on an existing document')]),

  m('storyblok', 'Storyblok', 'Headless CMS with visual editor', 'developer', 'api_key', apiKey('token'),
    [t('story_published', 'Story Published', 'Triggers when a story is published')],
    [a('create_story', 'Create Story', 'Create a new story in Storyblok')]),

  m('shopify-partners', 'Shopify Partners', 'Shopify partner API for agencies and developers', 'developer', 'api_key', apiKey('X-Shopify-Access-Token'),
    [],
    [a('create_development_store', 'Create Dev Store', 'Create a new Shopify development store')]),

  m('twilio-voice', 'Twilio Voice', 'Programmable voice calls and telephony API', 'communication', 'basic', basic(),
    [t('incoming_call', 'Incoming Call', 'Triggers when an inbound call is received')],
    [a('make_call', 'Make Call', 'Place an outbound voice call'), a('send_voice_message', 'Send Voice Message', 'Deliver a text-to-speech call')]),

  m('vonage', 'Vonage', 'Cloud communications API platform (formerly Nexmo)', 'communication', 'api_key', apiKey('api_key'),
    [t('inbound_sms', 'Inbound SMS', 'Triggers when an SMS is received')],
    [a('send_sms', 'Send SMS', 'Send an SMS message via Vonage'), a('make_call', 'Make Call', 'Initiate a voice call')]),

  m('plivo', 'Plivo', 'Cloud communication platform for SMS and voice', 'communication', 'basic', basic(),
    [t('inbound_sms', 'Inbound SMS', 'Triggers when an inbound SMS is received')],
    [a('send_sms', 'Send SMS', 'Send an SMS message via Plivo')]),

  m('bandwidth', 'Bandwidth', 'Enterprise-grade communications platform', 'communication', 'basic', basic(),
    [t('inbound_message', 'Inbound Message', 'Triggers when a message is received')],
    [a('send_message', 'Send Message', 'Send an SMS or MMS via Bandwidth')]),

  m('ringcentral', 'RingCentral', 'Cloud communications and contact center platform', 'communication', 'oauth2', oauth2('https://platform.ringcentral.com/restapi/oauth/authorize', 'https://platform.ringcentral.com/restapi/oauth/token', ['ReadMessages', 'EditMessages']),
    [t('new_message', 'New Message', 'Triggers when a new message is received')],
    [a('send_sms', 'Send SMS', 'Send an SMS via RingCentral'), a('make_call', 'Make Call', 'Initiate a voice call')]),

  m('aircall', 'Aircall', 'Cloud phone system and call center software', 'communication', 'oauth2', oauth2('https://dashboard.aircall.io/oauth/authorize', 'https://api.aircall.io/v1/oauth/token', ['public_api']),
    [t('call_ended', 'Call Ended', 'Triggers when a call ends'), t('new_contact', 'New Contact', 'Triggers when a new contact is created')],
    [a('create_contact', 'Create Contact', 'Add a new contact in Aircall'), a('dial', 'Dial Number', 'Initiate an outbound call')]),

  m('close-crm', 'Close CRM', 'Sales CRM with built-in calling and emailing', 'crm', 'api_key', apiKey('Authorization'),
    [t('new_lead', 'New Lead', 'Triggers when a new lead is created'), t('lead_status_changed', 'Lead Status Changed', 'Triggers when a lead status changes')],
    [a('create_lead', 'Create Lead', 'Create a new lead'), a('create_call', 'Log Call', 'Log a call against a lead')]),

  m('nutshell', 'Nutshell', 'CRM for B2B sales teams with pipeline automation', 'crm', 'basic', basic(),
    [t('new_lead', 'New Lead', 'Triggers when a new lead is created')],
    [a('create_lead', 'Create Lead', 'Add a new lead to Nutshell'), a('update_stage', 'Update Stage', 'Move a lead to a new pipeline stage')]),

  m('outreach', 'Outreach', 'Sales engagement platform for revenue teams', 'crm', 'oauth2', oauth2('https://api.outreach.io/oauth/authorize', 'https://api.outreach.io/oauth/token', ['email', 'profile', 'read_sequences']),
    [t('sequence_finished', 'Sequence Finished', 'Triggers when a prospect completes a sequence')],
    [a('add_to_sequence', 'Add to Sequence', 'Enroll a prospect in a sales sequence'), a('create_prospect', 'Create Prospect', 'Create a new prospect record')]),

  m('salesloft', 'Salesloft', 'Revenue workflow platform for modern sales teams', 'crm', 'oauth2', oauth2('https://accounts.salesloft.com/oauth/authorize', 'https://accounts.salesloft.com/oauth/token', ['read', 'write']),
    [t('email_opened', 'Email Opened', 'Triggers when a prospect opens an email')],
    [a('create_person', 'Create Person', 'Add a new person'), a('add_to_cadence', 'Add to Cadence', 'Enroll in a sales cadence')]),

  m('chargebee-billing', 'Chargebee Billing', 'Recurring billing and subscription management', 'finance', 'api_key', apiKey('Authorization'),
    [t('invoice_generated', 'Invoice Generated', 'Triggers when a new invoice is created')],
    [a('create_subscription', 'Create Subscription', 'Create a new subscription'), a('apply_coupon', 'Apply Coupon', 'Apply a discount to a subscription')]),

  m('harvest', 'Harvest', 'Time tracking and invoicing software for teams', 'productivity', 'bearer', bearer(),
    [t('new_time_entry', 'New Time Entry', 'Triggers when a new time entry is logged')],
    [a('create_time_entry', 'Create Time Entry', 'Log a new time entry'), a('create_invoice', 'Create Invoice', 'Generate an invoice from tracked time')]),

  m('toggl', 'Toggl Track', 'Simple time tracking app for teams', 'productivity', 'basic', basic(),
    [t('time_entry_completed', 'Time Entry Completed', 'Triggers when a time entry is stopped')],
    [a('start_timer', 'Start Timer', 'Start a new time tracking entry'), a('stop_timer', 'Stop Timer', 'Stop the currently running timer')]),

  m('clockify', 'Clockify', 'Free time tracker and timesheet app', 'productivity', 'api_key', apiKey('X-Api-Key'),
    [t('new_time_entry', 'New Time Entry', 'Triggers when a new time entry is added')],
    [a('create_time_entry', 'Create Time Entry', 'Add a new time entry'), a('create_project', 'Create Project', 'Create a new project in Clockify')]),

  m('freckle', 'Freckle', 'Effortless time tracking for freelancers and teams', 'productivity', 'bearer', bearer(),
    [t('entry_created', 'Entry Created', 'Triggers when a new time entry is created')],
    [a('create_entry', 'Create Entry', 'Log a new time entry')]),
];

// ─── Database Connectors (50) ─────────────────────────────────────────────────

export const tier3DatabaseManifests: ConnectorManifest[] = [
  m('mysql', 'MySQL', 'Open-source relational database management system', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query against a MySQL database'), a('insert_row', 'Insert Row', 'Insert a new row into a table'), a('update_row', 'Update Row', 'Update rows matching a condition')]),

  m('postgresql', 'PostgreSQL', 'Advanced open-source relational database', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query'), a('insert_row', 'Insert Row', 'Insert a new record'), a('upsert_row', 'Upsert Row', 'Insert or update a row')]),

  m('mongodb', 'MongoDB', 'Document-oriented NoSQL database', 'developer', 'basic', basic(),
    [],
    [a('find_documents', 'Find Documents', 'Query documents in a collection'), a('insert_document', 'Insert Document', 'Add a new document'), a('update_document', 'Update Document', 'Modify existing documents')]),

  m('redis', 'Redis', 'In-memory data structure store for caching and messaging', 'developer', 'basic', basic(),
    [],
    [a('set_key', 'Set Key', 'Set a key-value pair in Redis'), a('get_key', 'Get Key', 'Retrieve a value by key'), a('publish', 'Publish Message', 'Publish a message to a Redis channel')]),

  m('elasticsearch', 'Elasticsearch', 'Distributed search and analytics engine', 'developer', 'basic', basic(),
    [],
    [a('index_document', 'Index Document', 'Index a new document'), a('search', 'Search', 'Execute a full-text search query'), a('delete_document', 'Delete Document', 'Delete a document by ID')]),

  m('dynamodb', 'Amazon DynamoDB', 'Fully managed NoSQL database service by AWS', 'developer', 'api_key', apiKey('X-Amz-Security-Token'),
    [],
    [a('put_item', 'Put Item', 'Insert or replace an item in a table'), a('get_item', 'Get Item', 'Retrieve an item by primary key'), a('query', 'Query', 'Query items by partition key')]),

  m('firestore', 'Cloud Firestore', 'Flexible, scalable NoSQL database for mobile and web apps by Google', 'developer', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/datastore']),
    [t('new_document', 'New Document', 'Triggers when a new document is created in a collection')],
    [a('create_document', 'Create Document', 'Add a new Firestore document'), a('update_document', 'Update Document', 'Update fields on an existing document')]),

  m('supabase', 'Supabase', 'Open-source Firebase alternative with PostgreSQL', 'developer', 'api_key', apiKey('apikey'),
    [t('new_row', 'New Row', 'Triggers when a new row is inserted into a table')],
    [a('insert_row', 'Insert Row', 'Insert a row into a Supabase table'), a('update_row', 'Update Row', 'Update rows matching a filter'), a('run_function', 'Run Function', 'Execute a Supabase database function')]),

  m('planetscale', 'PlanetScale', 'Serverless MySQL-compatible database platform', 'developer', 'oauth2', oauth2('https://auth.planetscale.com/oauth/authorize', 'https://auth.planetscale.com/oauth/token', ['read_database', 'write_database']),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on PlanetScale'), a('create_branch', 'Create Branch', 'Create a new database branch')]),

  m('turso', 'Turso', 'SQLite-compatible edge database for global applications', 'developer', 'bearer', bearer(),
    [],
    [a('execute_statement', 'Execute Statement', 'Run a SQL statement against a Turso database'), a('batch_execute', 'Batch Execute', 'Execute multiple SQL statements in one request')]),

  m('sqlite', 'SQLite', 'Lightweight embedded relational database engine', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on an SQLite database')]),

  m('mariadb', 'MariaDB', 'Community-developed open-source relational database', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on MariaDB'), a('insert_row', 'Insert Row', 'Insert a new row')]),

  m('mssql', 'Microsoft SQL Server', 'Enterprise relational database management system by Microsoft', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a T-SQL query'), a('insert_row', 'Insert Row', 'Insert a new row into a table')], true),

  m('oracle-db', 'Oracle Database', 'Enterprise multi-model database management system', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute an Oracle SQL query'), a('call_procedure', 'Call Procedure', 'Execute a stored procedure')], true),

  m('cassandra', 'Apache Cassandra', 'Highly scalable distributed NoSQL database', 'developer', 'basic', basic(),
    [],
    [a('execute_cql', 'Execute CQL', 'Execute a Cassandra Query Language statement'), a('insert_row', 'Insert Row', 'Insert a row into a table')]),

  m('couchdb', 'Apache CouchDB', 'Open-source document-oriented NoSQL database', 'developer', 'basic', basic(),
    [t('new_document', 'New Document', 'Triggers when a new document is created via _changes feed')],
    [a('create_document', 'Create Document', 'Create a new CouchDB document'), a('update_document', 'Update Document', 'Update an existing document')]),

  m('couchbase', 'Couchbase', 'Distributed NoSQL database for interactive enterprise apps', 'developer', 'basic', basic(),
    [],
    [a('upsert_document', 'Upsert Document', 'Insert or update a document'), a('get_document', 'Get Document', 'Retrieve a document by key')]),

  m('neo4j', 'Neo4j', 'Graph database management system', 'developer', 'basic', basic(),
    [],
    [a('run_cypher', 'Run Cypher Query', 'Execute a Cypher query against Neo4j'), a('create_node', 'Create Node', 'Create a new graph node')]),

  m('influxdb', 'InfluxDB', 'Time series database for metrics and events', 'developer', 'bearer', bearer(),
    [],
    [a('write_data', 'Write Data', 'Write time series data points'), a('query_data', 'Query Data', 'Run a Flux query')]),

  m('timescaledb', 'TimescaleDB', 'Time-series SQL database built on PostgreSQL', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on TimescaleDB'), a('insert_data', 'Insert Data', 'Insert time-series data')]),

  m('clickhouse', 'ClickHouse', 'Column-oriented OLAP database for real-time analytics', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a ClickHouse SQL query'), a('insert_data', 'Insert Data', 'Insert rows into a table')]),

  m('bigquery', 'Google BigQuery', 'Serverless, scalable data warehouse by Google Cloud', 'developer', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/bigquery']),
    [],
    [a('run_query', 'Run Query', 'Execute a BigQuery SQL job'), a('insert_rows', 'Insert Rows', 'Stream rows into a BigQuery table')]),

  m('snowflake', 'Snowflake', 'Cloud data platform for data warehousing and analytics', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a Snowflake SQL statement'), a('load_data', 'Load Data', 'Load data into a Snowflake table')], true),

  m('redshift', 'Amazon Redshift', 'Cloud data warehouse by AWS', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute an Amazon Redshift SQL query'), a('copy_data', 'Copy Data', 'Load data from S3 into Redshift')], true),

  m('databricks', 'Databricks', 'Unified analytics platform for data and AI teams', 'developer', 'bearer', bearer(),
    [],
    [a('run_notebook', 'Run Notebook', 'Execute a Databricks notebook'), a('run_sql', 'Run SQL', 'Execute a SQL query via Databricks SQL')], true),

  m('fauna', 'Fauna', 'Distributed document-relational database for serverless apps', 'developer', 'bearer', bearer(),
    [],
    [a('run_query', 'Run Query', 'Execute a Fauna query'), a('create_document', 'Create Document', 'Create a new document in a collection')]),

  m('hasura', 'Hasura', 'Instant GraphQL APIs on your databases', 'developer', 'api_key', apiKey('x-hasura-admin-secret'),
    [t('event_trigger', 'Event Trigger', 'Triggers when a database event fires via Hasura')],
    [a('run_graphql', 'Run GraphQL', 'Execute a GraphQL query or mutation via Hasura')]),

  m('neon', 'Neon', 'Serverless PostgreSQL with branching and scale-to-zero', 'developer', 'bearer', bearer(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on a Neon database'), a('create_branch', 'Create Branch', 'Create a new Neon database branch')]),

  m('cockroachdb', 'CockroachDB', 'Distributed SQL database for global cloud applications', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on CockroachDB'), a('insert_row', 'Insert Row', 'Insert a row into a table')]),

  m('singlestore', 'SingleStore', 'Unified database for transactions and analytics', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on SingleStore'), a('insert_data', 'Insert Data', 'Insert data into a table')], true),

  m('yugabyte', 'YugabyteDB', 'Distributed SQL database for cloud-native apps', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on YugabyteDB')]),

  m('vitess', 'Vitess', 'Horizontal scaling middleware for MySQL', 'developer', 'basic', basic(),
    [],
    [a('run_query', 'Run Query', 'Execute a SQL query on Vitess'), a('insert_row', 'Insert Row', 'Insert a row')]),

  m('dgraph', 'Dgraph', 'Native GraphQL database with a graph backend', 'developer', 'bearer', bearer(),
    [],
    [a('run_graphql', 'Run GraphQL', 'Execute a GraphQL query or mutation'), a('upsert', 'Upsert', 'Perform a conditional upsert operation')]),

  m('weaviate', 'Weaviate', 'Open-source vector database for semantic search and AI', 'developer', 'bearer', bearer(),
    [],
    [a('add_object', 'Add Object', 'Add a new vector object'), a('search', 'Semantic Search', 'Perform a vector similarity search')]),

  m('pinecone', 'Pinecone', 'Managed vector database for machine learning applications', 'developer', 'api_key', apiKey('Api-Key'),
    [],
    [a('upsert_vectors', 'Upsert Vectors', 'Insert or update vectors in an index'), a('query', 'Query', 'Find similar vectors by embedding')]),

  m('qdrant', 'Qdrant', 'High-performance vector similarity search engine', 'developer', 'api_key', apiKey('api-key'),
    [],
    [a('upsert_points', 'Upsert Points', 'Insert or update points in a collection'), a('search', 'Search', 'Query similar vectors')]),

  m('chroma', 'Chroma', 'Open-source embedding database for AI applications', 'developer', 'bearer', bearer(),
    [],
    [a('add_documents', 'Add Documents', 'Add documents with embeddings to a collection'), a('query', 'Query', 'Search for similar documents')]),

  m('milvus', 'Milvus', 'Open-source vector database built for AI applications', 'developer', 'bearer', bearer(),
    [],
    [a('insert', 'Insert', 'Insert vectors into a Milvus collection'), a('search', 'Search', 'Perform approximate nearest neighbor search')]),

  m('upstash', 'Upstash', 'Serverless Redis and Kafka for modern applications', 'developer', 'bearer', bearer(),
    [],
    [a('set_key', 'Set Key', 'Set a key-value pair in Upstash Redis'), a('get_key', 'Get Key', 'Get a value from Upstash Redis'), a('publish', 'Publish', 'Publish a message to an Upstash Kafka topic')]),

  m('kafka', 'Apache Kafka', 'Distributed event streaming platform', 'developer', 'basic', basic(),
    [t('new_message', 'New Message', 'Triggers when a new message arrives on a Kafka topic')],
    [a('produce_message', 'Produce Message', 'Publish a message to a Kafka topic')]),

  m('rabbitmq', 'RabbitMQ', 'Open-source message broker for distributed systems', 'developer', 'basic', basic(),
    [t('new_message', 'New Message', 'Triggers when a message is received from a queue')],
    [a('publish_message', 'Publish Message', 'Send a message to a RabbitMQ exchange')]),

  m('sqs', 'Amazon SQS', 'Fully managed message queuing service by AWS', 'developer', 'api_key', apiKey('X-Amz-Security-Token'),
    [t('new_message', 'New Message', 'Triggers when a message arrives in an SQS queue')],
    [a('send_message', 'Send Message', 'Send a message to an SQS queue'), a('delete_message', 'Delete Message', 'Delete a processed message from a queue')]),

  m('pubsub', 'Google Cloud Pub/Sub', 'Asynchronous messaging service by Google Cloud', 'developer', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/pubsub']),
    [t('new_message', 'New Message', 'Triggers when a message is published to a subscription')],
    [a('publish_message', 'Publish Message', 'Publish a message to a Pub/Sub topic')]),

  m('eventhubs', 'Azure Event Hubs', 'Big data streaming and event ingestion service by Azure', 'developer', 'bearer', bearer(),
    [t('new_event', 'New Event', 'Triggers when events arrive in an Event Hub')],
    [a('send_event', 'Send Event', 'Send an event to Azure Event Hubs')]),

  m('nats', 'NATS', 'High-performance open-source messaging system', 'developer', 'bearer', bearer(),
    [t('new_message', 'New Message', 'Triggers when a message is received on a NATS subject')],
    [a('publish', 'Publish', 'Publish a message to a NATS subject')]),

  m('graphql', 'Generic GraphQL', 'Connect to any GraphQL API endpoint', 'developer', 'bearer', bearer(),
    [],
    [a('run_query', 'Run Query', 'Execute a GraphQL query'), a('run_mutation', 'Run Mutation', 'Execute a GraphQL mutation')]),

  m('grpc', 'gRPC', 'High-performance, universal RPC framework', 'developer', 'bearer', bearer(),
    [],
    [a('call_method', 'Call Method', 'Invoke a gRPC service method')]),

  m('websocket', 'WebSocket', 'Real-time bidirectional communication protocol', 'developer', 'bearer', bearer(),
    [t('new_message', 'New Message', 'Triggers when a message is received over WebSocket')],
    [a('send_message', 'Send Message', 'Send a message to a WebSocket server')]),

  m('webhook', 'Webhook', 'Generic webhook to receive HTTP callbacks', 'developer', 'api_key', apiKey('X-Webhook-Secret'),
    [t('received', 'Webhook Received', 'Triggers when an HTTP POST is received at the webhook URL')],
    []),

  m('ftp', 'FTP/SFTP', 'File transfer via FTP or SFTP protocol', 'storage', 'basic', basic(),
    [t('new_file', 'New File', 'Triggers when a new file is uploaded to an FTP/SFTP directory')],
    [a('upload_file', 'Upload File', 'Upload a file to an FTP/SFTP server'), a('delete_file', 'Delete File', 'Delete a file from an FTP/SFTP server')]),
];

// ─── Cloud Services (50) ─────────────────────────────────────────────────────

export const tier3CloudManifests: ConnectorManifest[] = [
  m('aws-lambda', 'AWS Lambda', 'Serverless compute service that runs code on demand', 'developer', 'api_key', apiKey('X-Amz-Security-Token'),
    [],
    [a('invoke_function', 'Invoke Function', 'Invoke an AWS Lambda function'), a('create_function', 'Create Function', 'Deploy a new Lambda function')], true),

  m('google-cloud-functions', 'Google Cloud Functions', 'Serverless execution environment for event-driven cloud services', 'developer', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/cloud-platform']),
    [],
    [a('call_function', 'Call Function', 'Invoke a Google Cloud Function'), a('deploy_function', 'Deploy Function', 'Deploy a new Cloud Function')], true),

  m('azure-functions', 'Azure Functions', 'Serverless compute service for event-driven workloads by Microsoft', 'developer', 'bearer', bearer(),
    [],
    [a('trigger_function', 'Trigger Function', 'Invoke an Azure Function via HTTP trigger'), a('create_function_app', 'Create Function App', 'Create a new function app resource')], true),

  m('cloudflare-workers', 'Cloudflare Workers', 'Serverless JavaScript execution at the network edge', 'developer', 'api_key', apiKey('X-Auth-Key'),
    [],
    [a('run_worker', 'Run Worker', 'Invoke a Cloudflare Worker script'), a('deploy_worker', 'Deploy Worker', 'Deploy new Worker script code')]),

  m('vercel-functions', 'Vercel Functions', 'Serverless functions deployed with Vercel projects', 'developer', 'bearer', bearer(),
    [],
    [a('invoke_function', 'Invoke Function', 'Call a deployed Vercel serverless function')]),

  m('netlify-functions', 'Netlify Functions', 'Serverless Lambda functions managed by Netlify', 'developer', 'bearer', bearer(),
    [],
    [a('invoke_function', 'Invoke Function', 'Call a Netlify Function endpoint')]),

  m('aws-ec2', 'Amazon EC2', 'Scalable virtual servers in the cloud by AWS', 'developer', 'api_key', apiKey('X-Amz-Security-Token'),
    [],
    [a('start_instance', 'Start Instance', 'Start a stopped EC2 instance'), a('stop_instance', 'Stop Instance', 'Stop a running EC2 instance'), a('describe_instances', 'Describe Instances', 'List and describe EC2 instances')], true),

  m('aws-s3-events', 'AWS S3 Events', 'Trigger workflows from Amazon S3 bucket events', 'storage', 'api_key', apiKey('X-Amz-Security-Token'),
    [t('object_created', 'Object Created', 'Triggers when an object is uploaded to an S3 bucket'), t('object_deleted', 'Object Deleted', 'Triggers when an object is deleted from an S3 bucket')],
    []),

  m('aws-sns', 'Amazon SNS', 'Fully managed pub/sub messaging by AWS', 'developer', 'api_key', apiKey('X-Amz-Security-Token'),
    [t('new_notification', 'New Notification', 'Triggers when a message is published to an SNS topic')],
    [a('publish_message', 'Publish Message', 'Send a message to an SNS topic')]),

  m('aws-cloudwatch', 'Amazon CloudWatch', 'Monitoring and observability service for AWS resources', 'developer', 'api_key', apiKey('X-Amz-Security-Token'),
    [t('alarm_triggered', 'Alarm Triggered', 'Triggers when a CloudWatch alarm state changes')],
    [a('put_metric', 'Put Metric', 'Publish a custom metric to CloudWatch'), a('create_alarm', 'Create Alarm', 'Create a new CloudWatch alarm')]),

  m('google-cloud-run', 'Google Cloud Run', 'Serverless managed compute platform for containerized apps', 'developer', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/cloud-platform']),
    [],
    [a('deploy_service', 'Deploy Service', 'Deploy a container image to Cloud Run'), a('invoke_service', 'Invoke Service', 'Send an HTTP request to a Cloud Run service')], true),

  m('gcp-storage', 'Google Cloud Storage', 'Unified object storage for developers and enterprises', 'storage', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/devstorage.read_write']),
    [t('new_object', 'New Object', 'Triggers when a new object is created in a bucket')],
    [a('upload_object', 'Upload Object', 'Upload an object to GCS'), a('delete_object', 'Delete Object', 'Delete an object from a bucket')]),

  m('azure-blob', 'Azure Blob Storage', 'Massively scalable object storage for unstructured data', 'storage', 'bearer', bearer(),
    [t('new_blob', 'New Blob', 'Triggers when a new blob is created in a container')],
    [a('upload_blob', 'Upload Blob', 'Upload data to an Azure Blob Storage container'), a('delete_blob', 'Delete Blob', 'Delete a blob')]),

  m('docker-hub', 'Docker Hub', 'Container image registry and collaboration platform', 'developer', 'basic', basic(),
    [t('new_image', 'New Image Push', 'Triggers when a new image is pushed to a repository')],
    [a('create_repository', 'Create Repository', 'Create a new Docker Hub repository')]),

  m('github-actions', 'GitHub Actions', 'CI/CD workflows built directly into GitHub', 'developer', 'bearer', bearer(),
    [t('workflow_run_completed', 'Workflow Run Completed', 'Triggers when a GitHub Actions workflow run finishes')],
    [a('trigger_workflow', 'Trigger Workflow', 'Manually trigger a GitHub Actions workflow dispatch event')]),

  m('gitlab-ci', 'GitLab CI/CD', 'Built-in continuous integration and delivery in GitLab', 'developer', 'bearer', bearer(),
    [t('pipeline_finished', 'Pipeline Finished', 'Triggers when a CI/CD pipeline completes')],
    [a('trigger_pipeline', 'Trigger Pipeline', 'Create a new pipeline run via trigger token')]),

  m('circleci', 'CircleCI', 'Continuous integration and delivery platform', 'developer', 'api_key', apiKey('Circle-Token'),
    [t('build_completed', 'Build Completed', 'Triggers when a CircleCI build finishes')],
    [a('trigger_pipeline', 'Trigger Pipeline', 'Trigger a new CircleCI pipeline run')]),

  m('travis-ci', 'Travis CI', 'Continuous integration service for GitHub projects', 'developer', 'api_key', apiKey('Authorization'),
    [t('build_finished', 'Build Finished', 'Triggers when a Travis CI build completes')],
    [a('trigger_build', 'Trigger Build', 'Trigger a new Travis CI build')]),

  m('jenkins', 'Jenkins', 'Open-source automation server for CI/CD pipelines', 'developer', 'basic', basic(),
    [t('build_finished', 'Build Finished', 'Triggers when a Jenkins build completes')],
    [a('trigger_build', 'Trigger Build', 'Trigger a Jenkins pipeline build'), a('create_job', 'Create Job', 'Create a new Jenkins job')]),

  m('argocd', 'Argo CD', 'Declarative GitOps continuous delivery for Kubernetes', 'developer', 'bearer', bearer(),
    [t('sync_finished', 'Sync Finished', 'Triggers when an ArgoCD application sync completes')],
    [a('sync_application', 'Sync Application', 'Trigger a manual sync of an ArgoCD application')]),

  m('kubernetes', 'Kubernetes', 'Container orchestration platform for automating deployments', 'developer', 'bearer', bearer(),
    [t('pod_failed', 'Pod Failed', 'Triggers when a Kubernetes pod enters a Failed state')],
    [a('apply_manifest', 'Apply Manifest', 'Apply a YAML manifest to a Kubernetes cluster'), a('scale_deployment', 'Scale Deployment', 'Scale a Kubernetes deployment replica count')], true),

  m('heroku', 'Heroku', 'Cloud platform for deploying and scaling web apps', 'developer', 'bearer', bearer(),
    [t('new_release', 'New Release', 'Triggers when a new release is created')],
    [a('create_app', 'Create App', 'Create a new Heroku app'), a('scale_dyno', 'Scale Dyno', 'Scale dyno formation for an app'), a('deploy', 'Deploy', 'Trigger a Heroku deployment via build')]),

  m('render', 'Render', 'Cloud platform for hosting websites, APIs, and databases', 'developer', 'bearer', bearer(),
    [t('deploy_started', 'Deploy Started', 'Triggers when a new deploy is initiated')],
    [a('trigger_deploy', 'Trigger Deploy', 'Trigger a new deployment on Render')]),

  m('fly-io', 'Fly.io', 'Platform for running full-stack apps close to your users', 'developer', 'bearer', bearer(),
    [],
    [a('deploy_app', 'Deploy App', 'Deploy a new version of a Fly.io application'), a('scale_app', 'Scale App', 'Scale the number of instances for an app')]),

  m('railway', 'Railway', 'Instant deployment platform for any language or framework', 'developer', 'bearer', bearer(),
    [t('deployment_finished', 'Deployment Finished', 'Triggers when a Railway deployment completes')],
    [a('trigger_deployment', 'Trigger Deployment', 'Kick off a new Railway deployment')]),

  m('terraform-cloud', 'Terraform Cloud', 'Managed Terraform service by HashiCorp', 'developer', 'bearer', bearer(),
    [t('run_completed', 'Run Completed', 'Triggers when a Terraform run finishes')],
    [a('trigger_run', 'Trigger Run', 'Start a new Terraform Cloud run'), a('apply_run', 'Apply Run', 'Apply a completed Terraform plan')], true),

  m('ansible-tower', 'Ansible Tower', 'IT automation and orchestration platform by Red Hat', 'developer', 'bearer', bearer(),
    [t('job_finished', 'Job Finished', 'Triggers when an Ansible job completes')],
    [a('launch_job', 'Launch Job', 'Launch an Ansible Tower job template')], true),

  m('pagerduty-schedules', 'PagerDuty Schedules', 'On-call schedule management for operations teams', 'developer', 'oauth2', oauth2('https://identity.pagerduty.com/oauth/authorize', 'https://identity.pagerduty.com/oauth/token', ['write', 'read']),
    [t('on_call_started', 'On-Call Started', 'Triggers when an on-call shift begins')],
    [a('override_schedule', 'Override Schedule', 'Create a schedule override for a user')]),

  m('newrelic', 'New Relic', 'Observability platform for monitoring and performance analysis', 'developer', 'api_key', apiKey('X-Api-Key'),
    [t('alert_triggered', 'Alert Triggered', 'Triggers when a New Relic alert policy fires')],
    [a('create_alert', 'Create Alert Policy', 'Create a new alert policy in New Relic'), a('track_event', 'Track Custom Event', 'Send custom event data to New Relic')]),

  m('grafana', 'Grafana', 'Open-source analytics and monitoring visualization platform', 'developer', 'api_key', apiKey('Authorization'),
    [t('alert_fired', 'Alert Fired', 'Triggers when a Grafana alert fires')],
    [a('create_annotation', 'Create Annotation', 'Add a new annotation to a dashboard'), a('silence_alert', 'Silence Alert', 'Silence an active Grafana alert')]),

  m('prometheus', 'Prometheus', 'Open-source systems monitoring and alerting toolkit', 'developer', 'bearer', bearer(),
    [t('alert_firing', 'Alert Firing', 'Triggers when a Prometheus alert fires via Alertmanager')],
    [a('query_metrics', 'Query Metrics', 'Execute a PromQL query against the metrics store')]),

  m('logstash', 'Logstash', 'Data collection and processing pipeline for logs', 'developer', 'bearer', bearer(),
    [],
    [a('send_log', 'Send Log Event', 'Send a log event to a Logstash pipeline')]),

  m('splunk', 'Splunk', 'Data-to-everything platform for machine data', 'developer', 'bearer', bearer(),
    [t('new_alert', 'New Alert', 'Triggers when a Splunk saved search alert fires')],
    [a('send_event', 'Send Event', 'Index an event in Splunk'), a('run_search', 'Run Search', 'Execute a Splunk search')], true),

  m('sumologic', 'Sumo Logic', 'Cloud-native machine data analytics platform', 'developer', 'basic', basic(),
    [t('new_scheduled_search', 'Scheduled Search Alert', 'Triggers when a scheduled search alert fires')],
    [a('send_log', 'Send Log', 'Send log data to Sumo Logic via HTTP Source')]),

  m('cloudinary', 'Cloudinary', 'Cloud-based image and video management platform', 'storage', 'api_key', apiKey('X-Requested-With'),
    [t('resource_uploaded', 'Resource Uploaded', 'Triggers when a new asset is uploaded')],
    [a('upload_image', 'Upload Image', 'Upload an image to Cloudinary'), a('transform_image', 'Transform Image', 'Apply transformations to an existing image')]),

  m('imgix', 'Imgix', 'Real-time image processing and optimization CDN', 'storage', 'bearer', bearer(),
    [],
    [a('generate_url', 'Generate URL', 'Generate a transformed image URL via imgix parameters')]),

  m('fastly', 'Fastly', 'Edge cloud platform for CDN and DDoS protection', 'developer', 'api_key', apiKey('Fastly-Key'),
    [],
    [a('purge_url', 'Purge URL', 'Purge a cached URL from Fastly edge nodes'), a('ban_key', 'Ban Cache Key', 'Invalidate cache entries by surrogate key')]),

  m('cloudflare', 'Cloudflare', 'DNS, CDN, and security services for internet properties', 'developer', 'api_key', apiKey('X-Auth-Key'),
    [],
    [a('purge_cache', 'Purge Cache', 'Purge cached assets for a Cloudflare zone'), a('create_dns_record', 'Create DNS Record', 'Add a new DNS record')]),

  m('sendbird', 'Sendbird', 'Chat and messaging platform for apps', 'communication', 'api_key', apiKey('Api-Token'),
    [t('new_message', 'New Message', 'Triggers when a new message is sent in a channel')],
    [a('send_message', 'Send Message', 'Send a message to a Sendbird channel'), a('create_user', 'Create User', 'Create a new Sendbird user')]),

  m('stream', 'Stream', 'APIs for building activity feeds and chat features', 'communication', 'api_key', apiKey('Stream-Auth-Type'),
    [t('new_message', 'New Message', 'Triggers when a new message is sent')],
    [a('send_message', 'Send Message', 'Send a chat message via Stream'), a('add_activity', 'Add Activity', 'Add an activity to a user\'s feed')]),

  m('pusher', 'Pusher', 'Realtime messaging and data synchronization APIs', 'communication', 'api_key', apiKey('Authorization'),
    [],
    [a('trigger_event', 'Trigger Event', 'Publish an event to a Pusher channel')]),

  m('ably', 'Ably', 'Realtime messaging and data streaming infrastructure', 'communication', 'api_key', apiKey('Authorization'),
    [t('new_message', 'New Message', 'Triggers when a message is published to a channel')],
    [a('publish_message', 'Publish Message', 'Publish a message to an Ably channel')]),

  m('twilio-flex', 'Twilio Flex', 'Programmable cloud contact center platform', 'communication', 'basic', basic(),
    [t('new_task', 'New Task', 'Triggers when a new task is created in Flex')],
    [a('create_task', 'Create Task', 'Create a new Flex task'), a('complete_task', 'Complete Task', 'Mark a task as completed')]),

  m('segment-destinations', 'Segment Destinations', 'Route customer data to any tool in your stack', 'analytics', 'api_key', apiKey('Authorization'),
    [],
    [a('track', 'Track Event', 'Track a user event and route to all connected destinations'), a('identify', 'Identify User', 'Identify a user and update their traits')]),

  m('metabase', 'Metabase', 'Simple, open-source business intelligence tool', 'analytics', 'basic', basic(),
    [],
    [a('run_question', 'Run Question', 'Execute a saved Metabase question and retrieve results')]),

  m('looker', 'Looker', 'Business intelligence and big data analytics platform by Google', 'analytics', 'bearer', bearer(),
    [],
    [a('run_look', 'Run Look', 'Execute a saved Looker Look and retrieve data'), a('run_inline_query', 'Run Inline Query', 'Execute an ad-hoc LookML query')], true),

  m('tableau', 'Tableau', 'Data visualization and business intelligence platform', 'analytics', 'basic', basic(),
    [],
    [a('refresh_datasource', 'Refresh Data Source', 'Trigger a data source refresh'), a('publish_workbook', 'Publish Workbook', 'Publish a workbook to Tableau Server')], true),

  m('power-bi', 'Microsoft Power BI', 'Business analytics service by Microsoft', 'analytics', 'oauth2', oauth2('https://login.microsoftonline.com/common/oauth2/v2.0/authorize', 'https://login.microsoftonline.com/common/oauth2/v2.0/token', ['https://analysis.windows.net/powerbi/api/.default']),
    [],
    [a('refresh_dataset', 'Refresh Dataset', 'Trigger a dataset refresh in Power BI'), a('push_rows', 'Push Rows', 'Push rows to a streaming dataset')], true),

  m('dbt-cloud', 'dbt Cloud', 'Data transformation tool for analytics engineers', 'developer', 'bearer', bearer(),
    [t('job_finished', 'Job Finished', 'Triggers when a dbt Cloud job run completes')],
    [a('trigger_job', 'Trigger Job', 'Kick off a dbt Cloud job run')]),

  m('airbyte', 'Airbyte', 'Open-source data integration platform for ELT pipelines', 'developer', 'bearer', bearer(),
    [t('sync_completed', 'Sync Completed', 'Triggers when a sync job completes')],
    [a('trigger_sync', 'Trigger Sync', 'Start a new data sync job'), a('create_connection', 'Create Connection', 'Set up a new source-destination connection')]),

  m('fivetran', 'Fivetran', 'Automated data movement and ELT pipelines', 'developer', 'basic', basic(),
    [t('sync_completed', 'Sync Completed', 'Triggers when a connector sync completes')],
    [a('trigger_sync', 'Trigger Sync', 'Manually trigger a Fivetran connector sync')], true),
];

// ─── Social Media (50) ───────────────────────────────────────────────────────

export const tier3SocialManifests: ConnectorManifest[] = [
  m('twitter', 'Twitter / X', 'Social media and microblogging platform', 'social', 'oauth2', oauth2('https://twitter.com/i/oauth2/authorize', 'https://api.twitter.com/2/oauth2/token', ['tweet.read', 'tweet.write', 'users.read']),
    [t('new_mention', 'New Mention', 'Triggers when the authenticated user is mentioned'), t('new_tweet', 'New Tweet', 'Triggers when a new tweet matches a search query')],
    [a('create_tweet', 'Create Tweet', 'Post a new tweet'), a('like_tweet', 'Like Tweet', 'Like a tweet'), a('retweet', 'Retweet', 'Retweet a tweet')]),

  m('linkedin', 'LinkedIn', 'Professional networking and career development platform', 'social', 'oauth2', oauth2('https://www.linkedin.com/oauth/v2/authorization', 'https://www.linkedin.com/oauth/v2/accessToken', ['r_liteprofile', 'r_emailaddress', 'w_member_social']),
    [],
    [a('share_post', 'Share Post', 'Post an update to LinkedIn'), a('send_message', 'Send Message', 'Send a LinkedIn InMail message')]),

  m('instagram', 'Instagram', 'Photo and video sharing social network by Meta', 'social', 'oauth2', oauth2('https://api.instagram.com/oauth/authorize', 'https://api.instagram.com/oauth/access_token', ['user_profile', 'user_media']),
    [t('new_media', 'New Media', 'Triggers when a new photo or video is posted')],
    [a('create_media', 'Create Post', 'Publish a new photo or video to Instagram'), a('get_insights', 'Get Insights', 'Retrieve post engagement insights')]),

  m('facebook', 'Facebook', 'Social network and digital marketing platform by Meta', 'social', 'oauth2', oauth2('https://www.facebook.com/v18.0/dialog/oauth', 'https://graph.facebook.com/v18.0/oauth/access_token', ['pages_read_engagement', 'pages_manage_posts']),
    [t('new_page_post', 'New Page Post', 'Triggers when a new post is published to a Page')],
    [a('create_post', 'Create Post', 'Publish a post to a Facebook Page'), a('create_ad', 'Create Ad', 'Create a new Facebook ad')]),

  m('youtube', 'YouTube', 'Video sharing and live streaming platform by Google', 'social', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/youtube']),
    [t('new_video', 'New Video', 'Triggers when a new video is uploaded to a channel'), t('new_comment', 'New Comment', 'Triggers when a new comment is posted on a video')],
    [a('upload_video', 'Upload Video', 'Upload a new video to YouTube'), a('update_video', 'Update Video', 'Update video metadata like title and description')]),

  m('tiktok', 'TikTok', 'Short-form video social media platform', 'social', 'oauth2', oauth2('https://www.tiktok.com/auth/authorize/', 'https://open.tiktokapis.com/v2/oauth/token/', ['user.info.basic', 'video.list']),
    [t('new_video', 'New Video', 'Triggers when a new video is posted')],
    [a('create_post', 'Create Post', 'Publish a new TikTok video post')]),

  m('pinterest', 'Pinterest', 'Image discovery and visual bookmarking platform', 'social', 'oauth2', oauth2('https://www.pinterest.com/oauth/', 'https://api.pinterest.com/v5/oauth/token', ['boards:read', 'pins:read', 'pins:write']),
    [t('new_pin', 'New Pin', 'Triggers when a new pin is created on a board')],
    [a('create_pin', 'Create Pin', 'Create a new Pinterest pin'), a('create_board', 'Create Board', 'Create a new Pinterest board')]),

  m('reddit', 'Reddit', 'Social news aggregation and discussion platform', 'social', 'oauth2', oauth2('https://www.reddit.com/api/v1/authorize', 'https://www.reddit.com/api/v1/access_token', ['read', 'submit']),
    [t('new_post', 'New Post', 'Triggers when a new post is submitted to a subreddit')],
    [a('submit_post', 'Submit Post', 'Submit a new post to a subreddit'), a('submit_comment', 'Submit Comment', 'Reply to a post or comment')]),

  m('snapchat', 'Snapchat', 'Ephemeral messaging and multimedia social app', 'social', 'oauth2', oauth2('https://accounts.snapchat.com/accounts/oauth2/auth', 'https://accounts.snapchat.com/accounts/oauth2/token', ['snapchat-marketing-api']),
    [],
    [a('create_ad', 'Create Ad', 'Create a new Snapchat ad campaign'), a('get_insights', 'Get Insights', 'Retrieve campaign performance data')]),

  m('twitter-ads', 'X Ads', 'Advertising and promotion platform on Twitter/X', 'social', 'oauth2', oauth2('https://twitter.com/i/oauth2/authorize', 'https://api.twitter.com/2/oauth2/token', ['ads:read', 'ads:write']),
    [],
    [a('create_campaign', 'Create Campaign', 'Create a new advertising campaign'), a('get_analytics', 'Get Analytics', 'Retrieve campaign performance analytics')]),

  m('linkedin-ads', 'LinkedIn Ads', 'B2B digital advertising platform on LinkedIn', 'social', 'oauth2', oauth2('https://www.linkedin.com/oauth/v2/authorization', 'https://www.linkedin.com/oauth/v2/accessToken', ['r_ads', 'r_ads_reporting', 'w_organization_social']),
    [],
    [a('create_campaign', 'Create Campaign', 'Create a LinkedIn ad campaign'), a('get_analytics', 'Get Analytics', 'Retrieve ad campaign analytics')]),

  m('facebook-ads', 'Meta Ads', 'Digital advertising across Facebook and Instagram', 'social', 'oauth2', oauth2('https://www.facebook.com/v18.0/dialog/oauth', 'https://graph.facebook.com/v18.0/oauth/access_token', ['ads_management', 'ads_read']),
    [t('new_lead', 'New Lead', 'Triggers when a Lead Ad form is submitted')],
    [a('create_ad_campaign', 'Create Ad Campaign', 'Create a new Meta ad campaign'), a('get_insights', 'Get Ad Insights', 'Retrieve performance data for ad campaigns')]),

  m('google-ads', 'Google Ads', 'Online advertising platform by Google', 'social', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/adwords']),
    [],
    [a('create_campaign', 'Create Campaign', 'Create a new Google Ads campaign'), a('get_report', 'Get Report', 'Retrieve an advertising performance report')], true),

  m('medium', 'Medium', 'Online publishing platform for stories and ideas', 'social', 'oauth2', oauth2('https://medium.com/m/oauth/authorize', 'https://api.medium.com/v1/tokens', ['basicProfile', 'publishPost']),
    [],
    [a('create_post', 'Create Post', 'Publish a new story on Medium')]),

  m('substack', 'Substack', 'Newsletter and publishing platform for independent writers', 'social', 'api_key', apiKey('Authorization'),
    [t('new_post', 'New Post', 'Triggers when a new newsletter post is published')],
    [a('create_post', 'Create Post', 'Publish a new Substack post')]),

  m('patreon', 'Patreon', 'Membership platform for creators and their fans', 'social', 'oauth2', oauth2('https://www.patreon.com/oauth2/authorize', 'https://www.patreon.com/api/oauth2/token', ['identity', 'campaigns', 'campaigns.members']),
    [t('new_pledge', 'New Pledge', 'Triggers when a patron creates a new pledge')],
    [a('create_post', 'Create Post', 'Post a new patron-only post to Patreon')]),

  m('twitch', 'Twitch', 'Live streaming and gaming entertainment platform', 'social', 'oauth2', oauth2('https://id.twitch.tv/oauth2/authorize', 'https://id.twitch.tv/oauth2/token', ['channel:read:subscriptions', 'chat:read']),
    [t('new_follower', 'New Follower', 'Triggers when a new user follows the channel'), t('stream_started', 'Stream Started', 'Triggers when a live stream goes live')],
    [a('send_chat_message', 'Send Chat Message', 'Post a message to a Twitch chat')]),

  m('discord-bot', 'Discord Bot', 'Automate Discord server interactions with a bot', 'social', 'bearer', bearer(),
    [t('new_member', 'New Member', 'Triggers when a user joins the server')],
    [a('send_message', 'Send Message', 'Send a message to a Discord channel'), a('assign_role', 'Assign Role', 'Add a role to a Discord server member')]),

  m('mastodon', 'Mastodon', 'Decentralized, open-source social network', 'social', 'oauth2', oauth2('https://{instance}/oauth/authorize', 'https://{instance}/oauth/token', ['read', 'write']),
    [t('new_mention', 'New Mention', 'Triggers when the account is mentioned')],
    [a('publish_status', 'Publish Status', 'Post a new status toot'), a('boost_status', 'Boost Status', 'Boost another user\'s post')]),

  m('bluesky', 'Bluesky', 'Decentralized social media platform using the AT Protocol', 'social', 'basic', basic(),
    [t('new_mention', 'New Mention', 'Triggers when the account is mentioned in a post')],
    [a('create_post', 'Create Post', 'Publish a new post on Bluesky')]),

  m('threads', 'Threads', 'Text-based social media platform by Meta', 'social', 'oauth2', oauth2('https://www.threads.net/oauth/authorize', 'https://graph.threads.net/oauth/access_token', ['threads_basic', 'threads_content_publish']),
    [],
    [a('create_post', 'Create Post', 'Publish a new thread on Threads by Meta')]),

  m('telegram-channel', 'Telegram Channel', 'Broadcast content to Telegram channel subscribers', 'social', 'api_key', apiKey('bot_token'),
    [t('new_subscriber', 'New Subscriber', 'Triggers when a user joins a Telegram channel')],
    [a('send_message', 'Send Message', 'Post a message to a Telegram channel')]),

  m('whatsapp-meta', 'WhatsApp (Meta)', 'Meta\'s WhatsApp API for business messaging', 'social', 'bearer', bearer(),
    [t('new_message', 'New Message', 'Triggers when a WhatsApp message is received')],
    [a('send_message', 'Send Message', 'Send a text message via WhatsApp')]),

  m('wechat', 'WeChat', 'Multi-purpose messaging and social media app', 'social', 'oauth2', oauth2('https://open.weixin.qq.com/connect/qrconnect', 'https://api.weixin.qq.com/sns/oauth2/access_token', ['snsapi_login']),
    [t('new_follower', 'New Follower', 'Triggers when a new user follows the Official Account')],
    [a('send_message', 'Send Message', 'Send a customer service message via WeChat')]),

  m('line', 'LINE', 'Mobile messaging and digital commerce platform', 'social', 'bearer', bearer(),
    [t('new_message', 'New Message', 'Triggers when a new LINE message is received via webhook')],
    [a('send_message', 'Send Message', 'Push a message to a LINE user')]),

  m('viber', 'Viber', 'Free messaging and calling app', 'social', 'api_key', apiKey('X-Viber-Auth-Token'),
    [t('new_message', 'New Message', 'Triggers when a new Viber message is received')],
    [a('send_message', 'Send Message', 'Send a message via Viber bot')]),

  m('signal', 'Signal API', 'Secure messaging protocol via Signal-compatible APIs', 'social', 'basic', basic(),
    [t('new_message', 'New Message', 'Triggers when a new Signal message is received')],
    [a('send_message', 'Send Message', 'Send a Signal message')]),

  m('slack-communities', 'Slack (Communities)', 'Public Slack communities and professional networks', 'social', 'oauth2', oauth2('https://slack.com/oauth/v2/authorize', 'https://slack.com/api/oauth.v2.access', ['channels:read', 'chat:write']),
    [t('new_channel_post', 'New Channel Post', 'Triggers when a message is posted in a public channel')],
    [a('post_message', 'Post Message', 'Post a message to a public Slack channel')]),

  m('clubhouse-audio', 'Clubhouse', 'Audio-based social networking platform', 'social', 'bearer', bearer(),
    [],
    [a('create_room', 'Create Room', 'Create a new Clubhouse audio room')]),

  m('spotify', 'Spotify', 'Music streaming and podcast platform', 'social', 'oauth2', oauth2('https://accounts.spotify.com/authorize', 'https://accounts.spotify.com/api/token', ['playlist-modify-public', 'user-read-recently-played']),
    [t('new_saved_track', 'New Saved Track', 'Triggers when a user saves a new track')],
    [a('create_playlist', 'Create Playlist', 'Create a new Spotify playlist'), a('add_track', 'Add Track to Playlist', 'Add a track to a playlist')]),

  m('soundcloud', 'SoundCloud', 'Music streaming platform for independent artists', 'social', 'oauth2', oauth2('https://secure.soundcloud.com/connect', 'https://secure.soundcloud.com/oauth/token', ['non-expiring']),
    [t('new_track', 'New Track', 'Triggers when a new track is uploaded')],
    [a('upload_track', 'Upload Track', 'Upload a new audio track to SoundCloud')]),

  m('tumblr', 'Tumblr', 'Microblogging and social networking platform', 'social', 'oauth2', oauth2('https://www.tumblr.com/oauth2/authorize', 'https://api.tumblr.com/oauth2/token', ['basic', 'write']),
    [t('new_post', 'New Post', 'Triggers when a new post is published to a blog')],
    [a('create_post', 'Create Post', 'Publish a new post to a Tumblr blog')]),

  m('flickr', 'Flickr', 'Image hosting and social network for photographers', 'social', 'oauth2', oauth2('https://www.flickr.com/services/oauth/authorize', 'https://www.flickr.com/services/oauth/access_token', ['write']),
    [t('new_photo', 'New Photo', 'Triggers when a new photo is uploaded')],
    [a('upload_photo', 'Upload Photo', 'Upload a photo to Flickr'), a('create_album', 'Create Album', 'Create a new Flickr photo album')]),

  m('vimeo', 'Vimeo', 'Professional video hosting and sharing platform', 'social', 'oauth2', oauth2('https://api.vimeo.com/oauth/authorize', 'https://api.vimeo.com/oauth/access_token', ['video_files', 'public']),
    [t('new_video', 'New Video', 'Triggers when a new video is uploaded')],
    [a('upload_video', 'Upload Video', 'Upload a new video to Vimeo'), a('update_video', 'Update Video', 'Update video metadata')]),

  m('dailymotion', 'Dailymotion', 'Video hosting platform for content creators', 'social', 'oauth2', oauth2('https://api.dailymotion.com/oauth/authorize', 'https://api.dailymotion.com/oauth/token', ['read', 'write', 'manage_videos']),
    [t('new_video', 'New Video', 'Triggers when a new video is published')],
    [a('upload_video', 'Upload Video', 'Upload a video to Dailymotion')]),

  m('behance', 'Behance', 'Platform for showcasing and discovering creative work', 'social', 'oauth2', oauth2('https://www.behance.net/v2/oauth/authenticate', 'https://www.behance.net/v2/oauth/token', ['post']),
    [t('new_project', 'New Project', 'Triggers when a new project is published')],
    [a('create_project', 'Create Project', 'Publish a new creative project')]),

  m('dribbble', 'Dribbble', 'Community for UI/UX designers to share work', 'social', 'oauth2', oauth2('https://dribbble.com/oauth/authorize', 'https://dribbble.com/oauth/token', ['public', 'upload']),
    [t('new_shot', 'New Shot', 'Triggers when a new design shot is published')],
    [a('create_shot', 'Create Shot', 'Post a new design shot to Dribbble')]),

  m('devto', 'DEV Community', 'Open-source developer blogging and community platform', 'social', 'api_key', apiKey('api-key'),
    [t('new_article', 'New Article', 'Triggers when you publish a new article')],
    [a('create_article', 'Create Article', 'Publish a new article on DEV.to')]),

  m('hackernews', 'Hacker News', 'Social news website focused on technology and startups', 'social', 'basic', basic(),
    [t('new_story', 'New Story', 'Triggers when a new story is posted by a user')],
    [a('submit_story', 'Submit Story', 'Submit a new story to Hacker News')]),

  m('product-hunt', 'Product Hunt', 'Platform to discover and launch new tech products', 'social', 'oauth2', oauth2('https://api.producthunt.com/v2/oauth/authorize', 'https://api.producthunt.com/v2/oauth/access_token', ['public', 'post:read', 'post:write']),
    [t('new_launch', 'New Launch', 'Triggers when a new product is launched')],
    [a('create_comment', 'Create Comment', 'Comment on a product launch')]),

  m('angellist', 'AngelList Talent', 'Startup job platform and talent network', 'social', 'oauth2', oauth2('https://angel.co/api/oauth/authorize', 'https://angel.co/api/oauth/token', ['email']),
    [],
    [a('create_job', 'Create Job', 'Post a new job listing on AngelList')]),

  m('quora', 'Quora', 'Question and answer knowledge sharing platform', 'social', 'bearer', bearer(),
    [],
    [a('post_answer', 'Post Answer', 'Submit an answer to a Quora question')]),

  m('stack-overflow', 'Stack Overflow for Teams', 'Private Q&A for software development teams', 'social', 'bearer', bearer(),
    [t('new_question', 'New Question', 'Triggers when a new question is posted')],
    [a('post_answer', 'Post Answer', 'Answer a question on Stack Overflow for Teams')]),
];

// ─── AI/ML Tools (50) ────────────────────────────────────────────────────────

export const tier3AiManifests: ConnectorManifest[] = [
  m('openai', 'OpenAI', 'AI research company providing GPT and DALL-E APIs', 'ai', 'bearer', bearer(),
    [],
    [a('chat_completion', 'Chat Completion', 'Generate a response using GPT models'), a('create_image', 'Create Image', 'Generate an image using DALL-E'), a('create_embedding', 'Create Embedding', 'Generate text embeddings for semantic search')]),

  m('anthropic', 'Anthropic', 'AI safety company providing Claude AI models', 'ai', 'api_key', apiKey('x-api-key'),
    [],
    [a('create_message', 'Create Message', 'Generate a response using Claude'), a('create_message_stream', 'Stream Message', 'Stream a Claude response in real time')]),

  m('cohere', 'Cohere', 'NLP platform for text understanding and generation', 'ai', 'bearer', bearer(),
    [],
    [a('generate', 'Generate', 'Generate text using Cohere\'s language models'), a('embed', 'Embed', 'Create text embeddings'), a('classify', 'Classify', 'Classify text into predefined categories')]),

  m('hugging-face', 'Hugging Face', 'Open-source AI and machine learning model hub', 'ai', 'bearer', bearer(),
    [],
    [a('run_inference', 'Run Inference', 'Run inference on any public Hugging Face model'), a('embed_text', 'Embed Text', 'Generate embeddings using a sentence transformer')]),

  m('replicate', 'Replicate', 'Run open-source machine learning models via API', 'ai', 'bearer', bearer(),
    [],
    [a('run_model', 'Run Model', 'Run any model on Replicate and retrieve output'), a('create_prediction', 'Create Prediction', 'Start an asynchronous model prediction')]),

  m('stability-ai', 'Stability AI', 'Open-source generative AI for images, video, and audio', 'ai', 'bearer', bearer(),
    [],
    [a('generate_image', 'Generate Image', 'Generate an image using Stable Diffusion'), a('image_to_image', 'Image to Image', 'Transform an input image using a prompt')]),

  m('elevenlabs', 'ElevenLabs', 'AI-powered voice synthesis and audio cloning', 'ai', 'api_key', apiKey('xi-api-key'),
    [],
    [a('text_to_speech', 'Text to Speech', 'Convert text to realistic AI speech'), a('clone_voice', 'Clone Voice', 'Create a custom voice clone from audio samples')]),

  m('openai-whisper', 'OpenAI Whisper', 'Automatic speech recognition and transcription model', 'ai', 'bearer', bearer(),
    [],
    [a('transcribe', 'Transcribe Audio', 'Transcribe an audio file to text'), a('translate', 'Translate Audio', 'Translate speech in an audio file to English')]),

  m('deepl', 'DeepL', 'High-quality neural machine translation service', 'ai', 'api_key', apiKey('Authorization'),
    [],
    [a('translate_text', 'Translate Text', 'Translate text to another language using DeepL'), a('translate_document', 'Translate Document', 'Translate an entire document file')]),

  m('google-translate', 'Google Translate', 'Automatic multilingual translation service by Google', 'ai', 'api_key', apiKey('key'),
    [],
    [a('translate_text', 'Translate Text', 'Translate text between 100+ languages'), a('detect_language', 'Detect Language', 'Identify the language of input text')]),

  m('azure-cognitive', 'Azure Cognitive Services', 'Collection of AI APIs by Microsoft for vision, language, and speech', 'ai', 'api_key', apiKey('Ocp-Apim-Subscription-Key'),
    [],
    [a('analyze_text', 'Analyze Text', 'Extract entities and sentiment from text'), a('analyze_image', 'Analyze Image', 'Describe objects and extract data from an image'), a('speech_to_text', 'Speech to Text', 'Convert spoken audio to text')]),

  m('google-cloud-ai', 'Google Cloud AI', 'Pre-trained AI models for vision, language, and speech', 'ai', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/cloud-platform']),
    [],
    [a('analyze_text', 'Analyze Text', 'Detect sentiment and entities in text via Natural Language API'), a('transcribe_audio', 'Transcribe Audio', 'Convert audio to text via Speech-to-Text API')]),

  m('aws-bedrock', 'Amazon Bedrock', 'Managed foundation models service by AWS', 'ai', 'api_key', apiKey('X-Amz-Security-Token'),
    [],
    [a('invoke_model', 'Invoke Model', 'Generate a response from a foundation model on Bedrock'), a('embed_text', 'Embed Text', 'Create embeddings using a Bedrock embedding model')], true),

  m('mistral', 'Mistral AI', 'Open and efficient AI models for text generation', 'ai', 'bearer', bearer(),
    [],
    [a('chat', 'Chat', 'Generate a response using Mistral language models'), a('embed', 'Embed', 'Create text embeddings with Mistral')]),

  m('groq', 'Groq', 'Ultra-fast inference for open-source LLMs', 'ai', 'bearer', bearer(),
    [],
    [a('chat_completion', 'Chat Completion', 'Generate fast responses using Groq-hosted models')]),

  m('together-ai', 'Together AI', 'Run open-source AI models in the cloud', 'ai', 'bearer', bearer(),
    [],
    [a('inference', 'Run Inference', 'Run text or image generation on Together AI')]),

  m('perplexity-ai', 'Perplexity AI', 'AI-powered search and question answering engine', 'ai', 'bearer', bearer(),
    [],
    [a('search', 'AI Search', 'Get an AI-generated answer with cited sources')]),

  m('fireworks-ai', 'Fireworks AI', 'Fast and cost-efficient inference for generative AI models', 'ai', 'bearer', bearer(),
    [],
    [a('chat', 'Chat', 'Chat with Fireworks-hosted language models'), a('generate_image', 'Generate Image', 'Create images using Fireworks-hosted diffusion models')]),

  m('google-gemini', 'Google Gemini', 'Multimodal AI model by Google DeepMind', 'ai', 'api_key', apiKey('x-goog-api-key'),
    [],
    [a('generate_content', 'Generate Content', 'Generate text or analyze images with Gemini'), a('embed_content', 'Embed Content', 'Create embeddings using Gemini models')]),

  m('llama', 'Meta Llama API', 'Open-source large language models by Meta', 'ai', 'bearer', bearer(),
    [],
    [a('chat', 'Chat', 'Generate text using Meta\'s Llama models')]),

  m('nvidia-nim', 'NVIDIA NIM', 'Optimized AI model inference microservices by NVIDIA', 'ai', 'bearer', bearer(),
    [],
    [a('run_inference', 'Run Inference', 'Run AI model inference via NVIDIA NIM endpoints')], true),

  m('aws-rekognition', 'Amazon Rekognition', 'Image and video analysis service by AWS', 'ai', 'api_key', apiKey('X-Amz-Security-Token'),
    [],
    [a('detect_labels', 'Detect Labels', 'Identify objects and scenes in an image'), a('recognize_faces', 'Recognize Faces', 'Detect and analyze faces in an image'), a('moderate_image', 'Moderate Image', 'Detect unsafe or inappropriate content')]),

  m('google-vision', 'Google Cloud Vision', 'Image recognition and analysis API by Google', 'ai', 'api_key', apiKey('key'),
    [],
    [a('detect_labels', 'Detect Labels', 'Identify objects, landmarks, and text in images'), a('extract_text', 'Extract Text', 'Extract text from an image using OCR')]),

  m('clarifai', 'Clarifai', 'Full-lifecycle AI platform for computer vision and NLP', 'ai', 'api_key', apiKey('Authorization'),
    [],
    [a('predict', 'Predict', 'Run predictions on images or text using a Clarifai model')]),

  m('roboflow', 'Roboflow', 'Computer vision platform for training and deploying models', 'ai', 'api_key', apiKey('Authorization'),
    [],
    [a('run_inference', 'Run Inference', 'Run object detection on an image using a Roboflow model'), a('upload_image', 'Upload Image', 'Upload an image to a Roboflow dataset')]),

  m('scale-ai', 'Scale AI', 'Data platform for AI training and labeling', 'ai', 'api_key', apiKey('Authorization'),
    [t('task_completed', 'Task Completed', 'Triggers when a labeling task is completed')],
    [a('create_task', 'Create Task', 'Create a new data labeling task on Scale AI')], true),

  m('cohere-classify', 'Cohere Classify', 'Text classification using Cohere AI', 'ai', 'bearer', bearer(),
    [],
    [a('classify', 'Classify Text', 'Classify text into custom categories using Cohere')]),

  m('assemblyai', 'AssemblyAI', 'AI-powered transcription and audio intelligence API', 'ai', 'api_key', apiKey('Authorization'),
    [t('transcript_ready', 'Transcript Ready', 'Triggers when an audio transcription is completed')],
    [a('transcribe', 'Transcribe Audio', 'Submit audio for transcription'), a('apply_lemur', 'Apply LeMUR', 'Run AI-powered analysis on a transcript')]),

  m('deepgram', 'Deepgram', 'Real-time and batch speech recognition API', 'ai', 'api_key', apiKey('Authorization'),
    [],
    [a('transcribe_audio', 'Transcribe Audio', 'Transcribe audio using Deepgram\'s models'), a('transcribe_stream', 'Transcribe Stream', 'Real-time streaming audio transcription')]),

  m('speechmatics', 'Speechmatics', 'Highly accurate ASR for any language or accent', 'ai', 'api_key', apiKey('Authorization'),
    [],
    [a('submit_job', 'Submit Job', 'Submit an audio file for transcription')]),

  m('descript', 'Descript', 'AI-powered audio and video editing platform', 'ai', 'oauth2', oauth2('https://api.descript.com/oauth/authorize', 'https://api.descript.com/oauth/token', ['media.read', 'media.write']),
    [],
    [a('transcribe_media', 'Transcribe Media', 'Upload and transcribe a media file in Descript')]),

  m('murf', 'Murf', 'AI voice generator for text-to-speech content', 'ai', 'api_key', apiKey('api-key'),
    [],
    [a('generate_speech', 'Generate Speech', 'Convert text to speech using Murf AI voices')]),

  m('play-ht', 'Play.ht', 'AI voice synthesis and text-to-speech API', 'ai', 'bearer', bearer(),
    [],
    [a('convert_text', 'Convert Text to Speech', 'Generate realistic audio from text using Play.ht')]),

  m('lmnt', 'LMNT', 'Fast text-to-speech and voice cloning API', 'ai', 'api_key', apiKey('X-API-Key'),
    [],
    [a('synthesize', 'Synthesize Speech', 'Synthesize speech from text using LMNT')]),

  m('resemble-ai', 'Resemble AI', 'Voice cloning and AI speech generation platform', 'ai', 'bearer', bearer(),
    [],
    [a('generate_clip', 'Generate Clip', 'Generate an AI voice audio clip from text')]),

  m('midjourney', 'Midjourney (via Discord)', 'AI image generation via Midjourney Discord bot', 'ai', 'bearer', bearer(),
    [],
    [a('generate_image', 'Generate Image', 'Generate an image using Midjourney prompts')]),

  m('dalle', 'DALL-E', 'AI image generation model by OpenAI', 'ai', 'bearer', bearer(),
    [],
    [a('generate_image', 'Generate Image', 'Create an image from a text prompt'), a('edit_image', 'Edit Image', 'Edit an existing image with a prompt')]),

  m('runway-ml', 'Runway', 'AI-powered creative tools for video editing and generation', 'ai', 'bearer', bearer(),
    [],
    [a('generate_video', 'Generate Video', 'Generate a short video from a text or image prompt'), a('remove_background', 'Remove Background', 'Automatically remove video background')]),

  m('pika', 'Pika', 'AI video generation platform for creative content', 'ai', 'bearer', bearer(),
    [],
    [a('generate_video', 'Generate Video', 'Create a video from a text or image prompt')]),

  m('suno', 'Suno', 'AI music generation from text prompts', 'ai', 'bearer', bearer(),
    [],
    [a('generate_song', 'Generate Song', 'Create a complete AI-generated song from a text prompt')]),

  m('udio', 'Udio', 'AI music creation platform for generating songs', 'ai', 'bearer', bearer(),
    [],
    [a('generate_music', 'Generate Music', 'Generate AI music from a text description')]),

  m('luma-ai', 'Luma AI', 'AI video generation and 3D capture platform', 'ai', 'bearer', bearer(),
    [],
    [a('generate_video', 'Generate Video', 'Create cinematic AI video from text or image')]),

  m('heygen', 'HeyGen', 'AI-powered video generation with realistic avatars', 'ai', 'api_key', apiKey('X-Api-Key'),
    [t('video_completed', 'Video Completed', 'Triggers when a video generation job is finished')],
    [a('generate_video', 'Generate Video', 'Create an AI avatar video from a script')]),

  m('synthesia', 'Synthesia', 'AI video creation platform with digital avatars', 'ai', 'api_key', apiKey('Authorization'),
    [t('video_ready', 'Video Ready', 'Triggers when a video rendering is complete')],
    [a('create_video', 'Create Video', 'Generate a talking head video using a digital avatar')]),

  m('d-id', 'D-ID', 'AI video generation using digital humans and avatars', 'ai', 'basic', basic(),
    [t('talk_created', 'Talk Created', 'Triggers when a D-ID talk video is generated')],
    [a('create_talk', 'Create Talk', 'Animate an image with AI-generated speech')]),

  m('langchain', 'LangChain API', 'Framework for building LLM-powered applications', 'ai', 'bearer', bearer(),
    [],
    [a('run_chain', 'Run Chain', 'Execute a deployed LangChain chain or agent')]),

  m('langfuse', 'Langfuse', 'Open-source LLM engineering and observability platform', 'ai', 'api_key', apiKey('Authorization'),
    [],
    [a('create_trace', 'Create Trace', 'Log an LLM trace to Langfuse'), a('score_trace', 'Score Trace', 'Submit a quality score for an LLM trace')]),

  m('promptlayer', 'PromptLayer', 'Prompt engineering and versioning platform for LLMs', 'ai', 'api_key', apiKey('X-API-KEY'),
    [],
    [a('log_request', 'Log Request', 'Log an LLM API request to PromptLayer')]),

  m('dust', 'Dust', 'AI assistant builder for teams and organizations', 'ai', 'bearer', bearer(),
    [],
    [a('run_agent', 'Run Agent', 'Run a Dust AI agent with a prompt and context')]),

  m('vectorize', 'Vectorize', 'Vector data pipeline and semantic search platform', 'ai', 'api_key', apiKey('Authorization'),
    [],
    [a('upsert_documents', 'Upsert Documents', 'Add or update documents in a vector pipeline'), a('search', 'Search', 'Perform semantic search over vectorized documents')]),
];

// ─── Miscellaneous (50) ──────────────────────────────────────────────────────

export const tier3MiscManifests: ConnectorManifest[] = [
  // IoT
  m('aws-iot', 'AWS IoT Core', 'Managed cloud service for IoT device connectivity', 'utility', 'api_key', apiKey('X-Amz-Security-Token'),
    [t('message_received', 'Message Received', 'Triggers when an IoT device publishes to an MQTT topic')],
    [a('publish_message', 'Publish Message', 'Publish a message to an IoT MQTT topic')]),

  m('azure-iot', 'Azure IoT Hub', 'Cloud gateway for IoT device management by Microsoft', 'utility', 'bearer', bearer(),
    [t('device_message', 'Device Message', 'Triggers when a device sends a telemetry message')],
    [a('send_cloud_to_device', 'Send C2D Message', 'Send a cloud-to-device command')]),

  m('google-cloud-iot', 'Google Cloud IoT', 'Secure device connection and management for IoT fleets', 'utility', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/cloudiotcore']),
    [t('telemetry_event', 'Telemetry Event', 'Triggers when a device sends telemetry data')],
    [a('send_command', 'Send Command', 'Send a command to an IoT device')]),

  m('particle', 'Particle', 'IoT platform for connected hardware products', 'utility', 'bearer', bearer(),
    [t('device_event', 'Device Event', 'Triggers when a Particle device publishes an event')],
    [a('call_function', 'Call Function', 'Invoke a function on a Particle device'), a('get_variable', 'Get Variable', 'Read a variable from a Particle device')]),

  m('arduino-cloud', 'Arduino Cloud', 'Cloud platform for IoT projects with Arduino', 'utility', 'oauth2', oauth2('https://login.arduino.cc/authorize', 'https://login.arduino.cc/oauth/token', ['iot:things:read', 'iot:things:write']),
    [t('property_changed', 'Property Changed', 'Triggers when an IoT device property value changes')],
    [a('update_property', 'Update Property', 'Update the value of an Arduino Cloud property')]),

  // Healthcare
  m('health-gorilla', 'Health Gorilla', 'Clinical data exchange and health information network', 'utility', 'bearer', bearer(),
    [t('new_result', 'New Lab Result', 'Triggers when a new lab result is received')],
    [a('order_lab', 'Order Lab Test', 'Place a new lab test order')], true),

  m('epic-fhir', 'Epic (FHIR)', 'Electronic Health Records integration via FHIR API', 'utility', 'oauth2', oauth2('https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize', 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token', ['openid', 'fhirUser', 'patient/Patient.read']),
    [t('new_appointment', 'New Appointment', 'Triggers when a new patient appointment is created')],
    [a('create_appointment', 'Create Appointment', 'Schedule a new patient appointment')], true),

  m('cerner', 'Cerner (Oracle Health)', 'Healthcare IT solutions and EHR integrations via FHIR', 'utility', 'oauth2', oauth2('https://authorization.cerner.com/tenants/oauth2/profiles/smart-v1/authorize', 'https://authorization.cerner.com/tenants/oauth2/profiles/smart-v1/retrieve', ['openid', 'fhirUser']),
    [t('new_observation', 'New Observation', 'Triggers when a new clinical observation is recorded')],
    [a('create_observation', 'Create Observation', 'Record a new clinical observation')], true),

  m('athenahealth', 'athenahealth', 'Cloud-based clinical and financial healthcare services', 'utility', 'oauth2', oauth2('https://api.athenahealth.com/oauth2/authorize', 'https://api.athenahealth.com/oauth2/token', ['openid', 'athena/service/Athena.API']),
    [t('new_appointment', 'New Appointment', 'Triggers when a new appointment is scheduled')],
    [a('create_patient', 'Create Patient', 'Register a new patient record')], true),

  m('twilio-video', 'Twilio Video', 'Programmable video conferencing for apps', 'communication', 'basic', basic(),
    [t('room_ended', 'Room Ended', 'Triggers when a video room session ends')],
    [a('create_room', 'Create Room', 'Create a new Twilio Video room')]),

  // Legal
  m('clio', 'Clio', 'Practice management software for law firms', 'utility', 'oauth2', oauth2('https://app.clio.com/oauth/authorize', 'https://app.clio.com/oauth/token', ['openid', 'profile']),
    [t('new_matter', 'New Matter', 'Triggers when a new legal matter is created')],
    [a('create_matter', 'Create Matter', 'Open a new matter in Clio'), a('create_task', 'Create Task', 'Add a task to a matter')]),

  m('mycase', 'MyCase', 'Legal practice management and client portal software', 'utility', 'api_key', apiKey('Authorization'),
    [t('new_case', 'New Case', 'Triggers when a new case is created')],
    [a('create_case', 'Create Case', 'Create a new legal case'), a('add_note', 'Add Note', 'Add a note to a case')]),

  m('lawyaw', 'Lawyaw', 'Legal document automation for law firms', 'utility', 'bearer', bearer(),
    [],
    [a('generate_document', 'Generate Document', 'Auto-fill a legal document template')]),

  // Education
  m('canvas-lms', 'Canvas LMS', 'Cloud-based learning management system by Instructure', 'utility', 'bearer', bearer(),
    [t('new_submission', 'New Submission', 'Triggers when a student submits an assignment')],
    [a('create_assignment', 'Create Assignment', 'Create a new assignment in a Canvas course'), a('grade_submission', 'Grade Submission', 'Submit a grade for an assignment')]),

  m('blackboard', 'Blackboard', 'Education technology platform for learning management', 'utility', 'oauth2', oauth2('https://developer.blackboard.com/portal/displayLogin.html', 'https://blackboard.com/learn/api/public/v1/oauth2/token', ['read']),
    [t('new_grade', 'New Grade', 'Triggers when a new grade is posted')],
    [a('create_course', 'Create Course', 'Create a new Blackboard course')]),

  m('moodle', 'Moodle', 'Open-source learning platform for educators', 'utility', 'bearer', bearer(),
    [t('new_enrollment', 'New Enrollment', 'Triggers when a user enrolls in a course')],
    [a('enroll_user', 'Enroll User', 'Enroll a user in a Moodle course'), a('create_user', 'Create User', 'Create a new Moodle user account')]),

  m('google-classroom', 'Google Classroom', 'Digital learning platform by Google for K-12 and higher ed', 'utility', 'oauth2', oauth2('https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', ['https://www.googleapis.com/auth/classroom.courses']),
    [t('new_submission', 'New Submission', 'Triggers when a student submits course work')],
    [a('create_course', 'Create Course', 'Create a new Google Classroom course'), a('create_assignment', 'Create Assignment', 'Post a new assignment')]),

  m('teachable', 'Teachable', 'Online course platform for creators and educators', 'utility', 'bearer', bearer(),
    [t('new_enrollment', 'New Enrollment', 'Triggers when a student enrolls in a course')],
    [a('enroll_student', 'Enroll Student', 'Enroll a user in a Teachable course')]),

  m('thinkific', 'Thinkific', 'Online course creation and membership platform', 'utility', 'api_key', apiKey('X-Auth-API-Key'),
    [t('new_enrollment', 'New Enrollment', 'Triggers when a student enrolls in a course')],
    [a('enroll_user', 'Enroll User', 'Enroll a user in a Thinkific course')]),

  m('kajabi', 'Kajabi', 'All-in-one platform for online courses and memberships', 'utility', 'oauth2', oauth2('https://app.kajabi.com/oauth/authorize', 'https://app.kajabi.com/oauth/token', ['read', 'write']),
    [t('new_purchase', 'New Purchase', 'Triggers when a user purchases an offer')],
    [a('grant_offer', 'Grant Offer', 'Grant access to a Kajabi offer or product')]),

  m('podia', 'Podia', 'Digital storefront for selling courses and memberships', 'utility', 'bearer', bearer(),
    [t('new_sale', 'New Sale', 'Triggers when a new product is purchased')],
    [a('send_message', 'Send Message', 'Send a message to a Podia customer')]),

  // Real Estate
  m('zillow', 'Zillow', 'Real estate marketplace and property valuation platform', 'utility', 'api_key', apiKey('X-RapidAPI-Key'),
    [],
    [a('search_properties', 'Search Properties', 'Search for properties on Zillow'), a('get_zestimate', 'Get Zestimate', 'Retrieve estimated property value')]),

  m('realtor-api', 'Realtor.com API', 'Real estate listings and property search API', 'utility', 'api_key', apiKey('X-RapidAPI-Key'),
    [],
    [a('search_listings', 'Search Listings', 'Search for property listings'), a('get_property_details', 'Get Property Details', 'Retrieve details for a specific property')]),

  m('mls-bridge', 'MLS Bridge', 'Real estate MLS data integration platform', 'utility', 'bearer', bearer(),
    [t('new_listing', 'New Listing', 'Triggers when a new property listing is added')],
    [a('get_listing', 'Get Listing', 'Retrieve listing details by ID')]),

  // Travel
  m('expedia-affiliate', 'Expedia Affiliate', 'Travel booking affiliate APIs for flights and hotels', 'utility', 'api_key', apiKey('apiKey'),
    [],
    [a('search_hotels', 'Search Hotels', 'Search for available hotels'), a('search_flights', 'Search Flights', 'Search for available flights')]),

  m('amadeus', 'Amadeus', 'Travel technology platform with APIs for flights, hotels, and more', 'utility', 'oauth2', oauth2('https://api.amadeus.com/v1/security/oauth2/token', 'https://api.amadeus.com/v1/security/oauth2/token', ['client_credentials']),
    [],
    [a('search_flights', 'Search Flights', 'Search for flight offers'), a('book_flight', 'Book Flight', 'Create a flight order booking')]),

  // Food & Delivery
  m('doordash', 'DoorDash Drive', 'On-demand delivery platform by DoorDash', 'utility', 'bearer', bearer(),
    [t('delivery_status_updated', 'Delivery Status Updated', 'Triggers when delivery status changes')],
    [a('create_delivery', 'Create Delivery', 'Create a new DoorDash delivery request')]),

  m('instacart', 'Instacart', 'Grocery delivery and pickup platform', 'utility', 'bearer', bearer(),
    [t('order_delivered', 'Order Delivered', 'Triggers when an order is delivered')],
    [a('create_order', 'Create Order', 'Place a new grocery order on Instacart')]),

  // Logistics & Shipping
  m('shipstation', 'ShipStation', 'Order management and shipping automation platform', 'utility', 'basic', basic(),
    [t('new_order', 'New Order', 'Triggers when a new order is imported'), t('order_shipped', 'Order Shipped', 'Triggers when an order is marked as shipped')],
    [a('create_order', 'Create Order', 'Create a new order in ShipStation'), a('create_shipment', 'Create Shipment', 'Generate a shipping label')]),

  m('fedex', 'FedEx', 'Global shipping and logistics services', 'utility', 'bearer', bearer(),
    [t('shipment_updated', 'Shipment Updated', 'Triggers when a shipment tracking status changes')],
    [a('create_shipment', 'Create Shipment', 'Create a FedEx shipping label'), a('track_shipment', 'Track Shipment', 'Get the current status of a shipment')]),

  m('ups', 'UPS', 'Package delivery and supply chain management', 'utility', 'oauth2', oauth2('https://onlinetools.ups.com/security/v1/oauth/authorize', 'https://onlinetools.ups.com/security/v1/oauth/token', ['read']),
    [t('package_status_changed', 'Package Status Changed', 'Triggers when a UPS package status changes')],
    [a('create_shipment', 'Create Shipment', 'Rate and create a UPS shipment'), a('track_package', 'Track Package', 'Get tracking information for a package')]),

  m('usps', 'USPS', 'United States Postal Service shipping and tracking', 'utility', 'api_key', apiKey('APIKEY'),
    [t('package_delivered', 'Package Delivered', 'Triggers when a USPS package is delivered')],
    [a('track_package', 'Track Package', 'Track a USPS package by tracking number'), a('create_label', 'Create Label', 'Generate a USPS shipping label')]),

  m('easypost', 'EasyPost', 'Multi-carrier shipping API for eCommerce', 'utility', 'api_key', apiKey('Authorization'),
    [t('tracking_updated', 'Tracking Updated', 'Triggers when a shipment tracking status changes')],
    [a('create_shipment', 'Create Shipment', 'Rate and buy a shipping label'), a('track_shipment', 'Track Shipment', 'Get tracking updates for a shipment')]),

  m('shippo', 'Shippo', 'Multi-carrier shipping rates and label printing API', 'utility', 'bearer', bearer(),
    [t('track_updated', 'Tracking Updated', 'Triggers when tracking info changes for a shipment')],
    [a('create_label', 'Create Label', 'Buy a shipping label'), a('get_rates', 'Get Rates', 'Retrieve shipping rate quotes from carriers')]),

  // Accounting & Finance Extras
  m('plaid', 'Plaid', 'Financial data network connecting apps to bank accounts', 'finance', 'api_key', apiKey('PLAID-CLIENT-ID'),
    [t('transaction_created', 'New Transaction', 'Triggers when a new bank transaction is detected')],
    [a('get_transactions', 'Get Transactions', 'Fetch account transactions via Plaid'), a('get_balance', 'Get Balance', 'Retrieve current account balances')]),

  m('stripe-billing', 'Stripe Billing', 'Subscription and billing management via Stripe', 'finance', 'api_key', apiKey('Authorization'),
    [t('invoice_paid', 'Invoice Paid', 'Triggers when a subscription invoice is paid'), t('subscription_cancelled', 'Subscription Cancelled', 'Triggers when a subscription ends')],
    [a('create_subscription', 'Create Subscription', 'Create a new billing subscription'), a('create_invoice_item', 'Create Invoice Item', 'Add an item to a pending invoice')]),

  m('wise', 'Wise', 'International money transfers and multi-currency accounts', 'finance', 'oauth2', oauth2('https://api.transferwise.com/oauth/authorize/', 'https://api.transferwise.com/oauth/token', ['transfers:read', 'transfers:write']),
    [t('transfer_completed', 'Transfer Completed', 'Triggers when a money transfer is completed')],
    [a('create_quote', 'Create Quote', 'Get a rate quote for a transfer'), a('create_transfer', 'Create Transfer', 'Initiate a new international transfer')]),

  m('brex', 'Brex', 'Corporate cards and financial software for startups', 'finance', 'oauth2', oauth2('https://accounts.brex.com/oauth2/v1/auth', 'https://accounts.brex.com/oauth2/v1/token', ['openid', 'offline_access', 'transactions.card.readonly']),
    [t('new_transaction', 'New Transaction', 'Triggers when a new card transaction is made')],
    [a('create_expense', 'Create Expense', 'Submit an expense claim')]),

  m('ramp', 'Ramp', 'Corporate expense management and corporate cards platform', 'finance', 'oauth2', oauth2('https://api.ramp.com/developer/v1/authorize', 'https://api.ramp.com/developer/v1/token', ['transactions:read', 'users:read']),
    [t('new_transaction', 'New Transaction', 'Triggers when a new corporate card transaction occurs')],
    [a('create_memo', 'Create Memo', 'Add a memo to a transaction')]),

  // Misc Remaining
  m('zapier-webhooks', 'Zapier Webhooks', 'Catch and send webhooks to Zapier workflows', 'utility', 'api_key', apiKey('X-API-Key'),
    [t('webhook_received', 'Webhook Received', 'Triggers when a POST request is received')],
    [a('send_to_zap', 'Send to Zap', 'Send data to a Zapier hook URL')]),

  m('pabbly-connect', 'Pabbly Connect', 'Workflow automation with unlimited tasks', 'utility', 'api_key', apiKey('Authorization'),
    [t('webhook_received', 'Webhook Received', 'Triggers when a webhook is received in Pabbly')],
    [a('trigger_workflow', 'Trigger Workflow', 'Trigger a Pabbly Connect workflow')]),

  m('integrately', 'Integrately', 'Ready-to-use automation workflows for popular apps', 'utility', 'api_key', apiKey('Authorization'),
    [],
    [a('trigger_automation', 'Trigger Automation', 'Trigger an Integrately automation')]),

  m('albato', 'Albato', 'No-code automation platform for business workflows', 'utility', 'bearer', bearer(),
    [t('webhook_received', 'Webhook Received', 'Triggers when a webhook is received')],
    [a('run_scenario', 'Run Scenario', 'Execute an Albato automation scenario')]),

  m('pipedream', 'Pipedream', 'Developer-first workflow automation with code and no-code steps', 'developer', 'bearer', bearer(),
    [t('http_request', 'HTTP Request', 'Triggers when an HTTP request is sent to the workflow URL')],
    [a('run_workflow', 'Run Workflow', 'Invoke a Pipedream workflow')]),
];

// ─── Export all Tier 3 manifests ─────────────────────────────────────────────

export const tier3Manifests: ConnectorManifest[] = [
  ...tier3SaasManifests,
  ...tier3DatabaseManifests,
  ...tier3CloudManifests,
  ...tier3SocialManifests,
  ...tier3AiManifests,
  ...tier3MiscManifests,
];
