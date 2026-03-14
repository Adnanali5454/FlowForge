// ─── Connector Registry ─────────────────────────────────────────────────────
// Central export + initialization for all built-in connectors.
// 50 priority connectors + dynamic HTTP connector for 6,000+ apps.

export {
  type ConnectorPlugin,
  type PollResult,
  type WebhookResult,
  type ActionResult,
  type DynamicFieldResult,
  registerConnector,
  registerConnectorManifest,
  registerConnectorManifests,
  getConnector,
  getAllConnectors,
  getAllConnectorManifests,
} from './base';

import { registerConnector, registerConnectorManifests, getAllConnectorManifests } from './base';
import { webhookConnector } from './webhook';
import { schedulerConnector } from './scheduler';
import { dynamicHttpConnector } from './dynamic';
import { priorityConnectorManifests } from './manifests';
import { tier2Manifests } from './manifests/tier2';
import { tier3Manifests } from './manifests/tier3';
import gmailConnector from './implementations/gmail';
import slackConnector from './implementations/slack';
import stripeConnector from './implementations/stripe';
import openaiConnector from './implementations/openai';
import anthropicConnector from './implementations/anthropic';
import pipedriveConnector from './implementations/pipedrive';
import zendeskConnector from './implementations/zendesk';
import airtableConnector from './implementations/airtable';
import mailchimpConnector from './implementations/mailchimp';
import twilioConnector from './implementations/twilio';
import shopifyConnector from './implementations/shopify';
import jiraConnector from './implementations/jira';
import linearConnector from './implementations/linear';
import notionConnector from './implementations/notion';
import googleSheetsConnector from './implementations/google-sheets';
import discordConnector from './implementations/discord';
import githubConnector from './implementations/github';
import hubspotConnector from './implementations/hubspot';
import salesforceConnector from './implementations/salesforce';
import microsoftTeamsConnector from './implementations/microsoft-teams';
import googleCalendarConnector from './implementations/google-calendar';
import dropboxConnector from './implementations/dropbox';
import zoomConnector from './implementations/zoom';
import intercomConnector from './implementations/intercom';
import asanaConnector from './implementations/asana';

/**
 * Register all built-in connectors.
 * Called once at application startup.
 */
export function initializeBuiltInConnectors(): void {
  // Core utility connectors (full implementations)
  registerConnector(webhookConnector);
  registerConnector(schedulerConnector);
  registerConnector(dynamicHttpConnector);

  // Priority connector full implementations
  registerConnector(gmailConnector);
  registerConnector(slackConnector);
  registerConnector(stripeConnector);
  registerConnector(openaiConnector);
  registerConnector(anthropicConnector);

  // Tier 1 connector implementations
  registerConnector(pipedriveConnector);
  registerConnector(zendeskConnector);
  registerConnector(airtableConnector);
  registerConnector(mailchimpConnector);
  registerConnector(twilioConnector);
  registerConnector(shopifyConnector);
  registerConnector(jiraConnector);
  registerConnector(linearConnector);
  registerConnector(notionConnector);
  registerConnector(googleSheetsConnector);

  // Tier 1 connector implementations (batch 2)
  registerConnector(discordConnector);
  registerConnector(githubConnector);
  registerConnector(hubspotConnector);
  registerConnector(salesforceConnector);
  registerConnector(microsoftTeamsConnector);
  registerConnector(googleCalendarConnector);
  registerConnector(dropboxConnector);
  registerConnector(zoomConnector);
  registerConnector(intercomConnector);
  registerConnector(asanaConnector);

  // 50 priority connector manifests (metadata only)
  // Full implementations for each will be added incrementally
  // Users can still integrate with these apps via the dynamic HTTP connector
  registerConnectorManifests(priorityConnectorManifests);

  // Tier 2: 100 additional connector manifests
  registerConnectorManifests(tier2Manifests);

  // Tier 3: 300 additional connector manifests (databases, cloud, social, AI, misc)
  registerConnectorManifests(tier3Manifests);
}

/**
 * Get total count of available connectors.
 * Includes 50+ built-in priority connectors + dynamic HTTP for 6,000+ apps.
 */
export function getConnectorCount(): number {
  return getAllConnectorManifests().length;
}

export { webhookConnector } from './webhook';
export { schedulerConnector } from './scheduler';
export { dynamicHttpConnector } from './dynamic';
export { priorityConnectorManifests } from './manifests';
export { tier2Manifests } from './manifests/tier2';
export { tier3Manifests } from './manifests/tier3';
