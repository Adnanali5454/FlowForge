// ─── Workspace Variables API ────────────────────────────────────────────────
// GET    /api/variables     — List all variables (secrets masked)
// POST   /api/variables     — Create a new variable
// PUT    /api/variables/{id} — Update a variable
// DELETE /api/variables/{id} — Delete a variable

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/variables — List all variables for workspace (secrets masked)
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

    const variables = await db
      .select()
      .from(schema.workspaceVariables)
      .where(eq(schema.workspaceVariables.workspaceId, session.workspaceId));

    // Mask secret values
    const masked = variables.map((v) => ({
      ...v,
      value: v.isSecret ? '***' : v.value,
    }));

    return NextResponse.json({ variables: masked });
  } catch (error) {
    console.error('GET /api/variables error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variables' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/variables — Create a new variable
 * Body: { key: string, value: string, type?: string, isSecret?: boolean, environment?: string }
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
    const key = body.key as string;
    const value = body.value as string;
    const type = body.type || 'string';
    const isSecret = body.isSecret || false;
    const environment = body.environment || 'all';

    if (!key || key.trim().length === 0) {
      return NextResponse.json(
        { error: 'Variable key required' },
        { status: 400 }
      );
    }

    const [variable] = await db
      .insert(schema.workspaceVariables)
      .values({
        workspaceId: session.workspaceId,
        key: key.trim().toUpperCase(),
        value,
        type,
        isSecret,
        environment,
      })
      .returning();

    // Mask secret in response
    return NextResponse.json(
      {
        variable: {
          ...variable,
          value: variable.isSecret ? '***' : variable.value,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/variables error:', error);
    return NextResponse.json(
      { error: 'Failed to create variable' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/variables — Update a variable
 * Body: { id: string, value?: string, isSecret?: boolean, environment?: string }
 */
export async function PUT(request: NextRequest) {
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
    const variableId = body.id as string;

    // Verify variable belongs to workspace
    const variable = await db
      .select()
      .from(schema.workspaceVariables)
      .where(
        and(
          eq(schema.workspaceVariables.id, variableId),
          eq(schema.workspaceVariables.workspaceId, session.workspaceId)
        )
      )
      .limit(1);

    if (!variable.length) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.value !== undefined) {
      updateData.value = body.value;
    }
    if (body.isSecret !== undefined) {
      updateData.isSecret = body.isSecret;
    }
    if (body.environment !== undefined) {
      updateData.environment = body.environment;
    }
    if (body.type !== undefined) {
      updateData.type = body.type;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(schema.workspaceVariables)
      .set(updateData)
      .where(eq(schema.workspaceVariables.id, variableId))
      .returning();

    // Mask secret in response
    return NextResponse.json({
      variable: {
        ...updated,
        value: updated.isSecret ? '***' : updated.value,
      },
    });
  } catch (error) {
    console.error('PUT /api/variables error:', error);
    return NextResponse.json(
      { error: 'Failed to update variable' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/variables — Delete a variable
 * Query params: id (variable ID)
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
    const variableId = searchParams.get('id');

    if (!variableId) {
      return NextResponse.json(
        { error: 'Variable ID required' },
        { status: 400 }
      );
    }

    // Verify variable belongs to workspace
    const variable = await db
      .select()
      .from(schema.workspaceVariables)
      .where(
        and(
          eq(schema.workspaceVariables.id, variableId),
          eq(schema.workspaceVariables.workspaceId, session.workspaceId)
        )
      )
      .limit(1);

    if (!variable.length) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
    }

    await db
      .delete(schema.workspaceVariables)
      .where(eq(schema.workspaceVariables.id, variableId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/variables error:', error);
    return NextResponse.json(
      { error: 'Failed to delete variable' },
      { status: 500 }
    );
  }
}
