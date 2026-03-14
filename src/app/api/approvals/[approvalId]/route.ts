import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { approvalId: string } }
) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session?.workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action, comment } = body as { action: 'approve' | 'reject'; comment?: string };

  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  const approvalId = params.approvalId;

  const [record] = await db.select().from(schema.workflowStorage)
    .where(and(
      eq(schema.workflowStorage.key, approvalId),
      eq(schema.workflowStorage.namespace, 'hitl_requests'),
      eq(schema.workflowStorage.workspaceId, session.workspaceId)
    ));

  if (!record) return NextResponse.json({ error: 'Approval not found' }, { status: 404 });

  let data: Record<string, unknown>;
  try { data = JSON.parse(record.value as string); } catch { return NextResponse.json({ error: 'Invalid approval data' }, { status: 500 }); }

  const decidedAt = new Date().toISOString();
  const updated = { ...data, status: action, decidedAt, comment: comment ?? null };

  await db.update(schema.workflowStorage)
    .set({ value: JSON.stringify(updated) })
    .where(eq(schema.workflowStorage.key, approvalId));

  if (data.executionId && action === 'approve') {
    await db.update(schema.workflowExecutions)
      .set({ status: 'running' })
      .where(eq(schema.workflowExecutions.id, data.executionId as string));
  }

  return NextResponse.json({ success: true, approvalId, action, decidedAt });
}
