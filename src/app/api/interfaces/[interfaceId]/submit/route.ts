import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: { interfaceId: string } }) {
  try {
    const body = await request.json();

    const [iface] = await db.select()
      .from(schema.flowforgeInterfaces)
      .where(eq(schema.flowforgeInterfaces.id, params.interfaceId));
    if (!iface) return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    if (!iface.isPublished) return NextResponse.json({ error: 'This form is not currently accepting submissions' }, { status: 403 });

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
