// ─── App Connections API ────────────────────────────────────────────────────
// GET    /api/connections       — List connections for workspace
// POST   /api/connections       — Create a new connection
// DELETE /api/connections       — Delete a connection
// POST   /api/connections/test  — Test a connection

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/connections — List connections for workspace
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const connections = await db
      .select()
      .from(schema.appConnections)
      .where(eq(schema.appConnections.workspaceId, session.workspaceId));

    // Don't expose raw credentials in API response
    const safe = connections.map(({ credentials, ...rest }) => rest);

    return NextResponse.json({ connections: safe });
  } catch (error) {
    console.error('GET /api/connections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/connections — Create a new connection
 * Body: { connectorId: string, name: string, credentials: object }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) {
      return NextResponse.json({ error: 'No workspace or user' }, { status: 400 });
    }

    const body = await request.json();
    const connectorId = body.connectorId as string;
    const name = body.name as string;
    const credentials = body.credentials as Record<string, unknown>;

    if (!connectorId || !name || !credentials) {
      return NextResponse.json(
        { error: 'connectorId, name, and credentials required' },
        { status: 400 }
      );
    }

    // Verify connector exists
    const connector = await db
      .select()
      .from(schema.connectorRegistry)
      .where(eq(schema.connectorRegistry.id, connectorId))
      .limit(1);

    if (!connector.length) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    // Store credentials (in production, these should be encrypted)
    const [connection] = await db
      .insert(schema.appConnections)
      .values({
        workspaceId: session.workspaceId,
        connectorId,
        name: name.trim(),
        credentials,
        isValid: true,
        createdBy: session.userId,
      })
      .returning();

    // Don't expose credentials
    const { credentials: _, ...safe } = connection;

    return NextResponse.json({ connection: safe }, { status: 201 });
  } catch (error) {
    console.error('POST /api/connections error:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/connections — Delete a connection
 * Query params: id (connection ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID required' },
        { status: 400 }
      );
    }

    // Verify connection belongs to workspace
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

    await db
      .delete(schema.appConnections)
      .where(eq(schema.appConnections.id, connectionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/connections error:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
