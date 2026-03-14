// ─── Connectors API ─────────────────────────────────────────────────────────
// GET /api/connectors — List all available connectors

import { NextRequest, NextResponse } from 'next/server';
import { getAllConnectorManifests, initializeBuiltInConnectors } from '@/lib/connectors';

// Initialize connectors on module load
initializeBuiltInConnectors();

/**
 * GET /api/connectors — List all available connectors
 */
export async function GET(_request: NextRequest) {
  try {
    const manifests = getAllConnectorManifests();

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
