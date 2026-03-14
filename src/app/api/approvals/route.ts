import { NextRequest, NextResponse } from 'next/server';

interface Approval {
  id: string;
  workflowName: string;
  stepName: string;
  requestor: {
    name: string;
    email: string;
    avatar: string;
  };
  requestedAt: string;
  priority: 'high' | 'medium' | 'low';
  context: Record<string, string>;
}

const MOCK_APPROVALS: Approval[] = [
  {
    id: 'appr-001',
    workflowName: 'Finance Automation',
    stepName: 'Approve Payment Transfer',
    requestor: { name: 'Sarah Chen', email: 'sarah@acme.com', avatar: 'SC' },
    requestedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    priority: 'high',
    context: { Amount: '$4,200.00', Recipient: 'Acme Corp', Account: '****4892', Reference: 'INV-2026-0441' },
  },
  {
    id: 'appr-002',
    workflowName: 'User Offboarding',
    stepName: 'Confirm User Deletion',
    requestor: { name: 'Alex Johnson', email: 'alex@acme.com', avatar: 'AJ' },
    requestedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    priority: 'high',
    context: { User: 'john.doe@acme.com', Department: 'Engineering', 'Data Retention': '90 days', 'Access Revoked': 'Pending' },
  },
  {
    id: 'appr-003',
    workflowName: 'Marketing Campaign',
    stepName: 'Authorize Bulk Email Send',
    requestor: { name: 'Marcus Rivera', email: 'marcus@acme.com', avatar: 'MR' },
    requestedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    context: { Recipients: '42,300 contacts', Campaign: 'Spring Product Launch', Scheduled: 'Mar 15, 2026 09:00 AM', Subject: 'Introducing FlowForge 2.0' },
  },
  {
    id: 'appr-004',
    workflowName: 'Legal Workflow',
    stepName: 'Sign Contract',
    requestor: { name: 'Priya Patel', email: 'priya@acme.com', avatar: 'PP' },
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    context: { Contract: 'Vendor Agreement v3.pdf', Value: '$120,000/yr', Counterparty: 'TechVendor Inc.', Expires: 'Mar 20, 2026' },
  },
];

export async function GET() {
  return NextResponse.json({ approvals: MOCK_APPROVALS });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { approvalId?: string; action?: string; comment?: string };
  const { approvalId, action, comment } = body;

  if (!approvalId || !action) {
    return NextResponse.json({ error: 'approvalId and action are required' }, { status: 400 });
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
