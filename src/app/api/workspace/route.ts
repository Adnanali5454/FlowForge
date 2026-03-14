// ─── Workspace API ──────────────────────────────────────────────────────────
// GET  /api/workspace  — Get current workspace info
// PATCH /api/workspace — Update workspace settings

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { logAudit, getClientIpAddress } from '@/lib/audit';

/**
 * GET /api/workspace — Get the current workspace's info
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

    const [workspace] = await db
      .select({
        id: schema.workspaces.id,
        name: schema.workspaces.name,
        slug: schema.workspaces.slug,
        plan: schema.workspaces.plan,
        usedTasksThisMonth: schema.workspaces.usedTasksThisMonth,
        maxTasksPerMonth: schema.workspaces.maxTasksPerMonth,
        taskResetDate: schema.workspaces.taskResetDate,
        settings: schema.workspaces.settings,
        createdAt: schema.workspaces.createdAt,
      })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, session.workspaceId));

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('GET /api/workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workspace — Update workspace name and/or settings
 */
export async function PATCH(request: NextRequest) {
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
    const {
      workspaceName,
      errorNotificationEmail,
      autoReplay,
      floodProtectionMaxTasks,
      floodProtectionWindowMinutes,
    } = body as {
      workspaceName?: string;
      errorNotificationEmail?: string;
      autoReplay?: 'never' | 'always' | 'on_transient';
      floodProtectionMaxTasks?: number;
      floodProtectionWindowMinutes?: number;
    };

    // Fetch existing workspace to merge settings
    const [existing] = await db
      .select({
        id: schema.workspaces.id,
        name: schema.workspaces.name,
        settings: schema.workspaces.settings,
      })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, session.workspaceId));

    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Merge incoming settings into existing JSONB settings
    const existingSettings = (existing.settings ?? {}) as Record<string, unknown>;
    const updatedSettings: Record<string, unknown> = { ...existingSettings };

    if (errorNotificationEmail !== undefined) {
      updatedSettings.errorNotificationEmail = errorNotificationEmail || null;
    }
    if (autoReplay !== undefined) {
      updatedSettings.autoReplay = autoReplay;
    }
    if (floodProtectionMaxTasks !== undefined || floodProtectionWindowMinutes !== undefined) {
      const existingFlood = (existingSettings.floodProtection ?? {}) as Record<string, unknown>;
      updatedSettings.floodProtection = {
        ...existingFlood,
        ...(floodProtectionMaxTasks !== undefined
          ? { maxTasksPerWindow: floodProtectionMaxTasks }
          : {}),
        ...(floodProtectionWindowMinutes !== undefined
          ? { windowMinutes: floodProtectionWindowMinutes }
          : {}),
      };
    }

    // Build update payload
    const updateValues: Record<string, unknown> = {
      settings: updatedSettings,
      updatedAt: new Date(),
    };
    if (workspaceName !== undefined && workspaceName.trim()) {
      updateValues.name = workspaceName.trim();
    }

    const [updatedWorkspace] = await db
      .update(schema.workspaces)
      .set(updateValues)
      .where(eq(schema.workspaces.id, session.workspaceId))
      .returning({
        id: schema.workspaces.id,
        name: schema.workspaces.name,
        slug: schema.workspaces.slug,
        plan: schema.workspaces.plan,
        usedTasksThisMonth: schema.workspaces.usedTasksThisMonth,
        maxTasksPerMonth: schema.workspaces.maxTasksPerMonth,
        taskResetDate: schema.workspaces.taskResetDate,
        settings: schema.workspaces.settings,
        createdAt: schema.workspaces.createdAt,
      });

    // Log audit event
    const ipAddress = getClientIpAddress(request.headers);
    await logAudit(
      session.workspaceId,
      session.userId,
      'update',
      'workspace',
      session.workspaceId,
      { name: updatedWorkspace.name },
      ipAddress
    );

    return NextResponse.json({ workspace: updatedWorkspace });
  } catch (error) {
    console.error('PATCH /api/workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}
