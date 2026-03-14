// ─── Connectors API ─────────────────────────────────────────────────────────
// GET /api/connectors — List all available connectors
// Query params:
//   - category: Filter by category (communication, crm, productivity, etc.)

import '@/lib/startup';
import { NextRequest, NextResponse } from 'next/server';
import { getAllConnectorManifests } from '@/lib/connectors';

/**
 * GET /api/connectors — List all available connectors
 * Supports category filtering via query param
 */
export async function GET(request: NextRequest) {
  try {
    let manifests = getAllConnectorManifests();

    // Support category filtering
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');

    if (categoryFilter) {
      manifests = manifests.filter((m) => m.category === categoryFilter);
    }

    return NextResponse.json({
      connectors: manifests.map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        description: m.description,
        icon: m.icon,
        category: m.category,
        authType: m.authType,
        triggers: m.triggers.map((t) => ({
          key: t.key,
          name: t.name,
          description: t.description,
          type: t.type,
        })),
        actions: m.actions.map((a) => ({
          key: a.key,
          name: a.name,
          description: a.description,
        })),
        version: m.version,
        isBuiltIn: m.isBuiltIn,
        isPremium: m.isPremium,
      })),
      total: manifests.length,
    });
  } catch (error) {
    console.error('GET /api/connectors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connectors' },
      { status: 500 }
    );
  }
}
