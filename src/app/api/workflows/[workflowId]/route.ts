// ─── Workflow by ID API ──────────────────────────────────────────────────────
// GET    /api/workflows/[workflowId]      — Fetch a single workflow by ID
// PUT    /api/workflows/[workflowId]      — Update a workflow
// DELETE /api/workflows/[workflowId]      — Delete a workflow

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

interface RouteParams {
  params: {
    workflowId: string;
  };
}

/**
 * GET /api/workflows/[workflowId] — Fetch a single workflow by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const { workflowId } = params;

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

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('GET /api/workflows/[workflowId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/[workflowId] — Update a workflow
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const { workflowId } = params;
    const body = await request.json();

    // Fetch current workflow to verify it exists
    const [currentWorkflow] = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(
        and(
          eq(schema.workflowDefinitions.id, workflowId),
          eq(schema.workflowDefinitions.workspaceId, session.workspaceId)
        )
      );

    if (!currentWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Update workflow
    const [updatedWorkflow] = await db
      .update(schema.workflowDefinitions)
      .set({
        name: body.name ?? currentWorkflow.name,
        description: body.description ?? currentWorkflow.description,
        status: body.status ?? currentWorkflow.status,
        trigger: body.trigger ?? currentWorkflow.trigger,
        steps: body.steps ?? currentWorkflow.steps,
        variables: body.variables ?? currentWorkflow.variables,
        settings: body.settings ?? currentWorkflow.settings,
        tags: body.tags ?? currentWorkflow.tags,
        updatedAt: new Date(),
      })
      .where(eq(schema.workflowDefinitions.id, workflowId))
      .returning();

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    console.error('PUT /api/workflows/[workflowId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[workflowId] — Delete a workflow
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const { workflowId } = params;

    // Verify workflow exists in this workspace
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

    // Delete workflow
    await db
      .delete(schema.workflowDefinitions)
      .where(eq(schema.workflowDefinitions.id, workflowId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/workflows/[workflowId] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
