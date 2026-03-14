import { NextRequest, NextResponse } from 'next/server';

interface PatchBody {
  action?: string;
  comment?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { approvalId: string } }
) {
  const { approvalId } = params;
  const body = await request.json() as PatchBody;
  const { action, comment } = body;

  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    approvalId,
    action,
    comment: comment ?? null,
    decidedAt: new Date().toISOString(),
  });
}
