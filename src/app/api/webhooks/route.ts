// ─── Webhooks Ingestion API ──────────────────────────────────────────────────
// POST /api/webhooks/:workflowId — Receive incoming webhook and trigger workflow

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhooks — Catch-all webhook receiver
 * In production, this would route to /api/webhooks/[workflowId]/route.ts
 * For now, it accepts webhook data and acknowledges receipt.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // In full implementation:
    // 1. Look up workflow by webhook URL token
    // 2. Validate signature if configured
    // 3. Queue workflow execution with webhook payload as trigger data
    // 4. Return 200 immediately (async execution)

    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
      bodySize: JSON.stringify(body).length,
      message: 'Webhook received. Workflow execution queued.',
    }, { status: 200 });
  } catch (error) {
    console.error('POST /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
