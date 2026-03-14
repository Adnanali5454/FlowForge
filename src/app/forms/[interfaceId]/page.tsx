import { db, schema } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import PublicForm from './public-form';

export default async function PublicFormPage({ params }: { params: { interfaceId: string } }) {
  const [iface] = await db
    .select()
    .from(schema.flowforgeInterfaces)
    .where(eq(schema.flowforgeInterfaces.id, params.interfaceId));

  if (!iface || !iface.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-500">This form is not available or has been unpublished.</p>
        </div>
      </div>
    );
  }

  const fields = await db
    .select()
    .from(schema.flowforgeInterfaceFields)
    .where(eq(schema.flowforgeInterfaceFields.interfaceId, params.interfaceId))
    .orderBy(asc(schema.flowforgeInterfaceFields.position));

  const typedFields = fields.map(f => ({
    ...f,
    config: (f.config as Record<string, unknown>) || {},
  }));
  return <PublicForm interfaceId={params.interfaceId} config={iface.config as Record<string, unknown>} fields={typedFields} branding={iface.brandingConfig as Record<string, unknown>} />;
}
