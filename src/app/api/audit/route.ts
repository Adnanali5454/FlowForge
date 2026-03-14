// ─── Audit Log API ──────────────────────────────────────────────────────────
// GET /api/audit — List audit log entries with pagination & filtering

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME, PERMISSIONS, hasPermission } from '@/lib/auth';

/**
 * GET /api/audit — List audit log entries with pagination and filtering
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 50, max 100)
 *   - action: string (optional filter by action)
 *   - resourceType: string (optional filter by resource type)
 *   - startDate: ISO timestamp (optional)
 *   - endDate: ISO timestamp (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.role) {
      return NextResponse.json({ error: 'No workspace or role' }, { status: 400 });
    }

    // Check permission: admin or above
    if (!hasPermission(session.role, PERMISSIONS.viewAuditLog)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions: (typeof and extends (a: infer T, ...rest: infer R) => infer U ? T | R[number] : never)[] = [
      eq(schema.auditLog.workspaceId, session.workspaceId),
    ];

    if (action) {
      conditions.push(eq(schema.auditLog.action, action));
    }
    if (resourceType) {
      conditions.push(eq(schema.auditLog.resourceType, resourceType));
    }
    if (startDate) {
      conditions.push(gte(schema.auditLog.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(schema.auditLog.createdAt, new Date(endDate)));
    }

    // Fetch entries
    const entries = await db
      .select()
      .from(schema.auditLog)
      .where(and(...conditions))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch total count for pagination
    const countResult = await db
      .select({ count: count().mapWith(Number) })
      .from(schema.auditLog)
      .where(and(...conditions));

    const totalCount = countResult.length > 0 ? (countResult[0].count as number) : 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/audit error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
