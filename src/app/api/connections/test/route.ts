// ─── Test Connection Endpoint ───────────────────────────────────────────────
// POST /api/connections/test — Test a connection

import '@/lib/startup';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * POST /api/connections/test — Test a connection
 * Body: { id: string }
 * Returns: { success: boolean, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const body = await request.json();
    // Accept either 'id' or 'connectionId' for compatibility
    const connectionId = (body.id ?? body.connectionId) as string;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID required' },
        { status: 400 }
      );
    }

    // Fetch connection
    const connection = await db
      .select()
      .from(schema.appConnections)
      .where(
        and(
          eq(schema.appConnections.id, connectionId),
          eq(schema.appConnections.workspaceId, session.workspaceId)
        )
      )
      .limit(1);

    if (!connection.length) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    const conn = connection[0];

    // Look up connector slug from registry
    const [registry] = await db.select({ slug: schema.connectorRegistry.slug })
      .from(schema.connectorRegistry)
      .where(eq(schema.connectorRegistry.id, conn.connectorId));

    // Try to get the connector implementation
    const { getConnector } = await import('@/lib/connectors/base');
    const connector = registry ? getConnector(registry.slug) : null;

    let isValid = false;
    let message = 'Connection verified';

    if (connector && typeof connector.testConnection === 'function') {
      try {
        const creds = (typeof conn.credentials === 'string'
          ? JSON.parse(conn.credentials)
          : conn.credentials) as Record<string, string>;
        isValid = await connector.testConnection(creds);
        message = isValid ? 'Connection verified successfully' : 'Connection test failed — check your credentials';
      } catch {
        isValid = false;
        message = 'Connection test failed';
      }
    } else {
      // No test implementation — mark as valid (benefit of the doubt)
      isValid = true;
      message = 'Connection saved (no automated test available for this connector)';
    }

    await db.update(schema.appConnections)
      .set({ isValid, lastTestedAt: new Date() })
      .where(eq(schema.appConnections.id, connectionId));

    return NextResponse.json({ success: isValid, message });
  } catch (error) {
    console.error('POST /api/connections/test error:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
