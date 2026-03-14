import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { interfaceId: string } }) {
  try {
    const body = await request.json();
    const [submission] = await db
      .insert(schema.flowforgeInterfaceSubmissions)
      .values({
        interfaceId: params.interfaceId,
        data: body.data ?? {},
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
        userAgent: request.headers.get('user-agent') ?? null,
      })
      .returning();

    return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
