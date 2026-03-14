// ─── Workflow Versions API ──────────────────────────────────────────────────
// GET  /api/workflows/[workflowId]/versions  — List all versions
// POST /api/workflows/[workflowId]/versions  — Create a new version

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/workflows/[workflowId]/versions — List all versions for a workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    // Verify workflow belongs to workspace
    const workflow = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(
        and(
          eq(schema.workflowDefinitions.id, params.workflowId),
          eq(schema.workflowDefinitions.workspaceId, session.workspaceId)
        )
      )
      .limit(1);

    if (!workflow.length) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const versions = await db
      .select()
      .from(schema.workflowVersions)
      .where(eq(schema.workflowVersions.workflowId, params.workflowId))
      .orderBy(desc(schema.workflowVersions.version));

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('GET /api/workflows/[workflowId]/versions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows/[workflowId]/versions — Create a new version (snapshot)
 * Body: { changeLog?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) {
      return NextResponse.json({ error: 'No workspace or user' }, { status: 400 });
    }

    // Fetch current workflow
    const workflow = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(
        and(
          eq(schema.workflowDefinitions.id, params.workflowId),
          eq(schema.workflowDefinitions.workspaceId, session.workspaceId)
        )
      )
      .limit(1);

    if (!workflow.length) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const currentWorkflow = workflow[0];
    const body = await request.json();

    // Calculate next version number
    const latestVersion = await db
      .select()
      .from(schema.workflowVersions)
      .where(eq(schema.workflowVersions.workflowId, params.workflowId))
      .orderBy(desc(schema.workflowVersions.version))
      .limit(1);

    const nextVersion = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1;

    // Create new version record
    const [version] = await db
      .insert(schema.workflowVersions)
      .values({
        workflowId: params.workflowId,
        version: nextVersion,
        trigger: currentWorkflow.trigger,
        steps: currentWorkflow.steps,
        variables: currentWorkflow.variables,
        settings: currentWorkflow.settings,
        publishedBy: session.userId,
        changeLog: body.changeLog || null,
      })
      .returning();

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workflows/[workflowId]/versions error:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
