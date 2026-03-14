import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const transfers = await db
      .select()
      .from(schema.flowforgeTransfers)
      .where(eq(schema.flowforgeTransfers.workspaceId, session.workspaceId))
      .orderBy(desc(schema.flowforgeTransfers.createdAt));

    return NextResponse.json({ transfers });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId || !session?.userId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const body = await request.json();
    const [transfer] = await db
      .insert(schema.flowforgeTransfers)
      .values({
        workspaceId: session.workspaceId,
        name: body.name || 'New Transfer',
        sourceConnectorId: body.sourceConnectorId || '',
        sourceConfig: body.sourceConfig ?? {},
        destConnectorId: body.destConnectorId || '',
        destConfig: body.destConfig ?? {},
        fieldMapping: body.fieldMapping ?? {},
        createdBy: session.userId,
      })
      .returning();

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
