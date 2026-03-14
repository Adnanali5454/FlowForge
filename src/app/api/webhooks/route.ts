// ─── Webhooks Registration API ──────────────────────────────────────────────
// POST /api/webhooks — Register a new webhook (generate token, return URL)
// GET /api/webhooks — List registered webhooks for workspace

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { logAudit, getClientIpAddress } from '@/lib/audit';

/**
 * GET /api/webhooks — List registered webhooks for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    // Fetch all webhook registrations for this workspace
    // Webhooks are stored in workflowStorage with namespace 'webhooks'
    const webhookRecords = await db
      .select()
      .from(schema.workflowStorage)
      .where(
        and(
          eq(schema.workflowStorage.workspaceId, session.workspaceId),
          eq(schema.workflowStorage.namespace, 'webhooks')
        )
      );

    const webhooks = webhookRecords.map((record) => ({
      token: record.key,
      workflowId: record.value,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/${record.key}`,
      createdAt: record.updatedAt,
    }));

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('GET /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks — Register a new webhook
 * Body: { workflowId: string }
 * Returns: { token: string, webhookUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const body = await request.json();
    const { workflowId } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    // Verify workflow exists
    const [workflow] = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(
        and(
          eq(schema.workflowDefinitions.id, workflowId),
          eq(schema.workflowDefinitions.workspaceId, session.workspaceId)
        )
      );

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Generate webhook token
    const webhookToken = generateId('wh');

    // Store webhook token -> workflowId mapping in workflowStorage
    await db
      .insert(schema.workflowStorage)
      .values({
        workspaceId: session.workspaceId,
        namespace: 'webhooks',
        key: webhookToken,
        value: workflowId,
      })
      .onConflictDoUpdate({
        target: [
          schema.workflowStorage.workspaceId,
          schema.workflowStorage.namespace,
          schema.workflowStorage.key,
        ],
        set: {
          value: workflowId,
          updatedAt: new Date(),
        },
      });

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/${webhookToken}`;

    // Log audit event
    const ipAddress = getClientIpAddress(request.headers);
    await logAudit(
      session.workspaceId,
      session.userId,
      'register',
      'webhook',
      webhookToken,
      { workflowId, webhookUrl },
      ipAddress
    );

    return NextResponse.json(
      {
        token: webhookToken,
        webhookUrl,
        message: 'Webhook registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Failed to register webhook' },
      { status: 500 }
    );
  }
}
