// ─── OAuth Authorize Route ───────────────────────────────────────────────────
// GET /api/oauth/authorize?connectorId=<slug>
// Builds the OAuth2 authorization URL for a connector and redirects the user.

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { getConnector } from '@/lib/connectors/base';
import type { OAuthConfig } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    // ── Connector lookup ──────────────────────────────────────────────────────
    const connectorId = request.nextUrl.searchParams.get('connectorId');
    if (!connectorId) {
      return NextResponse.json({ error: 'connectorId is required' }, { status: 400 });
    }

    const connector = getConnector(connectorId);
    if (!connector) {
      return NextResponse.json({ error: `Connector '${connectorId}' not found` }, { status: 404 });
    }

    const { manifest } = connector;

    if (manifest.authType !== 'oauth2') {
      return NextResponse.json(
        { error: `Connector '${connectorId}' does not use OAuth2` },
        { status: 400 }
      );
    }

    const authConfig = manifest.authConfig as OAuthConfig;

    // ── Build state ───────────────────────────────────────────────────────────
    const statePayload = {
      connectorId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      nonce: randomBytes(16).toString('hex'),
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

    // ── Build authorization URL ───────────────────────────────────────────────
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authConfig.clientId ?? '',
      redirect_uri: redirectUri,
      scope: authConfig.scopes.join(' '),
      state,
    });

    const authorizationUrl = `${authConfig.authorizationUrl}?${params.toString()}`;

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('GET /api/oauth/authorize error:', error);
    return NextResponse.json({ error: 'Failed to initiate OAuth flow' }, { status: 500 });
  }
}
