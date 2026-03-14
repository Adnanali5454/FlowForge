// ─── Workflows API ──────────────────────────────────────────────────────────
// GET  /api/workflows      — List all workflows in workspace
// POST /api/workflows      — Create a new workflow

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import type { TriggerConfig, WorkflowSettings } from '@/types';

/**
 * GET /api/workflows — List workflows for the active workspace
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

    const workflows = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(eq(schema.workflowDefinitions.workspaceId, session.workspaceId))
      .orderBy(desc(schema.workflowDefinitions.updatedAt));

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('GET /api/workflows error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows — Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const body = await request.json();
    const name = body.name || 'Untitled Workflow';
    const description = body.description || '';

    const defaultTrigger: TriggerConfig = {
      id: generateId('trg'),
      type: 'manual',
      connectorId: null,
      eventKey: 'manual_trigger',
      config: {},
      outputSchema: { type: 'object', properties: {} },
      position: { x: 250, y: 50 },
    };

    const defaultSettings: WorkflowSettings = {
      errorNotificationEmail: null,
      autoReplay: 'never',
      errorRatioThreshold: 80,
      maxConcurrentRuns: 5,
      timeout: 300000,        // 5 minutes
      retentionDays: 30,
      floodProtection: {
        enabled: true,
        maxTasksPerWindow: 100,
        windowMinutes: 10,
      },
    };

    const [workflow] = await db
      .insert(schema.workflowDefinitions)
      .values({
        workspaceId: session.workspaceId,
        name,
        description,
        status: 'draft',
        version: 1,
        trigger: defaultTrigger,
        steps: [],
        variables: {},
        settings: defaultSettings,
        tags: body.tags ?? [],
        createdBy: session.userId,
        folderId: body.folderId ?? null,
      })
      .returning();

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workflows error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
