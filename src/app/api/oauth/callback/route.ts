// ─── OAuth Callback Route ────────────────────────────────────────────────────
// GET /api/oauth/callback?code=<code>&state=<state>
// Exchanges the authorization code for tokens and stores them in appConnections.

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getConnector } from '@/lib/connectors/base';
import { encryptCredentials } from '@/lib/oauth';
import type { OAuthConfig } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');

    if (!code || !stateParam) {
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
    }

    // ── Decode state ──────────────────────────────────────────────────────────
    let statePayload: {
      connectorId: string;
      workspaceId: string;
      userId: string;
      nonce: string;
    };

    try {
      statePayload = JSON.parse(Buffer.from(stateParam, 'base64').toString('utf8'));
    } catch {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const storedNonce = request.cookies.get('ff_oauth_nonce')?.value;
    if (!storedNonce || storedNonce !== statePayload.nonce) {
      return NextResponse.json({ error: 'Invalid OAuth state — request may have been tampered with' }, { status: 400 });
    }

    const { connectorId, workspaceId, userId } = statePayload;

    // ── Connector lookup ──────────────────────────────────────────────────────
    const connector = getConnector(connectorId);
    if (!connector) {
      return NextResponse.json({ error: `Connector '${connectorId}' not found` }, { status: 404 });
    }

    const { manifest } = connector;
    const authConfig = manifest.authConfig as OAuthConfig;

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`;

    // ── Exchange code for token ───────────────────────────────────────────────
    const tokenResponse = await fetch(authConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: authConfig.clientId ?? '',
        client_secret: authConfig.clientSecret ?? '',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 502 });
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    };

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token ?? '';
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : '';

    // ── Look up connectorRegistry row id by slug ───────────────────────────────
    const [registryRow] = await db
      .select({ id: schema.connectorRegistry.id })
      .from(schema.connectorRegistry)
      .where(eq(schema.connectorRegistry.slug, connectorId));

    if (!registryRow) {
      return NextResponse.json(
        { error: `Connector '${connectorId}' not found in registry` },
        { status: 404 }
      );
    }

    // ── Encrypt and store credentials ─────────────────────────────────────────
    const credentials = encryptCredentials({ accessToken, refreshToken, expiresAt });

    await db.insert(schema.appConnections).values({
      workspaceId,
      connectorId: registryRow.id,
      name: `${manifest.name} Connection`,
      credentials,
      isValid: true,
      createdBy: userId,
    });

    // ── Redirect to connections page ──────────────────────────────────────────
    const finalResponse = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connections?connected=true`
    );
    finalResponse.cookies.delete('ff_oauth_nonce');
    return finalResponse;
  } catch (error) {
    console.error('GET /api/oauth/callback error:', error);
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
  }
}
