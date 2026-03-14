// ─── Digest API (Email/SMS Digest Buffer) ───────────────────────────────────
// GET    /api/digest              — List digest entries for a key
// POST   /api/digest/release      — Manually release a digest
// DELETE /api/digest              — Clear digest entries

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/digest — List digest entries for a workspace
 * Query params: digestKey (optional filter by digest key)
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
    const digestKey = searchParams.get('digestKey');

    let query = db
      .select()
      .from(schema.digestEntries)
      .where(eq(schema.digestEntries.workspaceId, session.workspaceId));

    if (digestKey) {
      query = db
        .select()
        .from(schema.digestEntries)
        .where(
          and(
            eq(schema.digestEntries.workspaceId, session.workspaceId),
            eq(schema.digestEntries.digestKey, digestKey)
          )
        );
    }

    const entries = await query;

    // Group by digestKey
    const grouped = entries.reduce(
      (acc, entry) => {
        if (!acc[entry.digestKey]) {
          acc[entry.digestKey] = [];
        }
        acc[entry.digestKey].push(entry);
        return acc;
      },
      {} as Record<string, typeof entries>
    );

    return NextResponse.json({ digestEntries: grouped });
  } catch (error) {
    console.error('GET /api/digest error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch digest entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/digest — Add an entry to digest buffer
 * Body: { digestKey: string, data: object }
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
    const digestKey = body.digestKey as string;
    const data = body.data as Record<string, unknown>;

    if (!digestKey || !data) {
      return NextResponse.json(
        { error: 'digestKey and data required' },
        { status: 400 }
      );
    }

    const [entry] = await db
      .insert(schema.digestEntries)
      .values({
        workspaceId: session.workspaceId,
        digestKey,
        data,
      })
      .returning();

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('POST /api/digest error:', error);
    return NextResponse.json(
      { error: 'Failed to add digest entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/digest — Clear digest entries for a key
 * Query params: digestKey (required)
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
    const digestKey = searchParams.get('digestKey');

    if (!digestKey) {
      return NextResponse.json(
        { error: 'digestKey query parameter required' },
        { status: 400 }
      );
    }

    const result = await db
      .delete(schema.digestEntries)
      .where(
        and(
          eq(schema.digestEntries.workspaceId, session.workspaceId),
          eq(schema.digestEntries.digestKey, digestKey)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      deletedCount: result.length,
    });
  } catch (error) {
    console.error('DELETE /api/digest error:', error);
    return NextResponse.json(
      { error: 'Failed to clear digest entries' },
      { status: 500 }
    );
  }
}
