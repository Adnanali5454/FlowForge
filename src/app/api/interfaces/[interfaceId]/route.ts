import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, asc } from 'drizzle-orm';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { interfaceId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [iface] = await db.select().from(schema.flowforgeInterfaces)
      .where(and(eq(schema.flowforgeInterfaces.id, params.interfaceId), eq(schema.flowforgeInterfaces.workspaceId, session.workspaceId)));
    if (!iface) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const fields = await db
      .select()
      .from(schema.flowforgeInterfaceFields)
      .where(eq(schema.flowforgeInterfaceFields.interfaceId, params.interfaceId))
      .orderBy(asc(schema.flowforgeInterfaceFields.position));

    return NextResponse.json({ interface: iface, fields });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch interface' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { interfaceId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.config !== undefined) updates.config = body.config;
    if (body.brandingConfig !== undefined) updates.brandingConfig = body.brandingConfig;
    if (body.isPublished !== undefined) updates.isPublished = body.isPublished;

    const [iface] = await db
      .update(schema.flowforgeInterfaces)
      .set(updates as Parameters<typeof db.update>[0] extends unknown ? never : never)
      .where(and(eq(schema.flowforgeInterfaces.id, params.interfaceId), eq(schema.flowforgeInterfaces.workspaceId, session.workspaceId)))
      .returning();

    if (!iface) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Handle fields update
    if (body.fields) {
      await db.delete(schema.flowforgeInterfaceFields).where(eq(schema.flowforgeInterfaceFields.interfaceId, params.interfaceId));
      if (body.fields.length > 0) {
        await db.insert(schema.flowforgeInterfaceFields).values(
          body.fields.map((f: Record<string, unknown>, i: number) => ({
            interfaceId: params.interfaceId,
            type: f.type as string,
            label: f.label as string || 'Field',
            placeholder: f.placeholder as string || '',
            helpText: f.helpText as string || '',
            isRequired: f.isRequired as boolean || false,
            config: f.config as Record<string, unknown> || {},
            conditionalLogic: f.conditionalLogic as Record<string, unknown> || {},
            position: i,
          }))
        );
      }
    }

    return NextResponse.json({ interface: iface });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update interface' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { interfaceId: string } }) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session?.workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db.delete(schema.flowforgeInterfaces)
      .where(and(eq(schema.flowforgeInterfaces.id, params.interfaceId), eq(schema.flowforgeInterfaces.workspaceId, session.workspaceId)));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete interface' }, { status: 500 });
  }
}
