// ─── Workflow Folders API ───────────────────────────────────────────────────
// GET    /api/folders       — List folders in workspace
// POST   /api/folders       — Create a new folder
// PATCH  /api/folders/{id}  — Rename or move folder
// DELETE /api/folders/{id}  — Delete folder

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/folders — List folders for workspace
 * Query params: parentId (optional filter)
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

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId') || null;

    let query = db
      .select()
      .from(schema.workflowFolders)
      .where(eq(schema.workflowFolders.workspaceId, session.workspaceId));

    if (parentId) {
      query = db
        .select()
        .from(schema.workflowFolders)
        .where(
          and(
            eq(schema.workflowFolders.workspaceId, session.workspaceId),
            eq(schema.workflowFolders.parentId, parentId)
          )
        );
    }

    const folders = await query;

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('GET /api/folders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/folders — Create a new folder
 * Body: { name: string, parentId?: string }
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
    const name = body.name as string;
    const parentId = body.parentId || null;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Folder name required' },
        { status: 400 }
      );
    }

    const [folder] = await db
      .insert(schema.workflowFolders)
      .values({
        workspaceId: session.workspaceId,
        name: name.trim(),
        parentId,
      })
      .returning();

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('POST /api/folders error:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/folders — Rename or move a folder
 * Body: { id: string, name?: string, parentId?: string | null }
 */
export async function PATCH(request: NextRequest) {
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
    const folderId = body.id as string;
    const newName = body.name as string | undefined;
    const newParentId = body.parentId as string | null | undefined;

    // Verify folder belongs to workspace
    const folder = await db
      .select()
      .from(schema.workflowFolders)
      .where(
        and(
          eq(schema.workflowFolders.id, folderId),
          eq(schema.workflowFolders.workspaceId, session.workspaceId)
        )
      )
      .limit(1);

    if (!folder.length) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (newName !== undefined) {
      updateData.name = newName;
    }
    if (newParentId !== undefined) {
      updateData.parentId = newParentId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(schema.workflowFolders)
      .set(updateData)
      .where(eq(schema.workflowFolders.id, folderId))
      .returning();

    return NextResponse.json({ folder: updated });
  } catch (error) {
    console.error('PATCH /api/folders error:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/folders — Delete a folder
 * Query params: id (folder ID to delete)
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
    const folderId = searchParams.get('id');

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID required' },
        { status: 400 }
      );
    }

    // Verify folder belongs to workspace
    const folder = await db
      .select()
      .from(schema.workflowFolders)
      .where(
        and(
          eq(schema.workflowFolders.id, folderId),
          eq(schema.workflowFolders.workspaceId, session.workspaceId)
        )
      )
      .limit(1);

    if (!folder.length) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Delete cascade is handled by database
    await db
      .delete(schema.workflowFolders)
      .where(eq(schema.workflowFolders.id, folderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/folders error:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
