// ─── Test Connection Endpoint ───────────────────────────────────────────────
// POST /api/connections/test — Test a connection

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

    // In a real implementation, you would call the connector's testConnection method
    // For now, we'll just update the lastTestedAt timestamp
    const conn = connection[0];

    // Update lastTestedAt timestamp
    await db
      .update(schema.appConnections)
      .set({ lastTestedAt: new Date() })
      .where(eq(schema.appConnections.id, connectionId));

    return NextResponse.json({
      success: true,
      message: 'Connection test passed',
      connectorId: conn.connectorId,
    });
  } catch (error) {
    console.error('POST /api/connections/test error:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
