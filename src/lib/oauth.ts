// OAuth2 utilities for FlowForge connectors

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// ─── Encryption config ───────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || 'default-32-byte-key-for-dev-only!',
  'utf8'
).slice(0, 32);

// ─── encryptCredentials ──────────────────────────────────────────────────────
// Encrypts a credentials object to a base64 string using AES-256-GCM.
// Output format (base64): iv (16 bytes) | authTag (16 bytes) | ciphertext

export function encryptCredentials(credentials: Record<string, string>): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  const plaintext = JSON.stringify(credentials);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Concatenate: iv | authTag | encrypted
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

// ─── decryptCredentials ──────────────────────────────────────────────────────
// Decrypts a base64-encoded AES-256-GCM payload back to a credentials object.

export function decryptCredentials(encrypted: string): Record<string, string> {
  const combined = Buffer.from(encrypted, 'base64');

  const iv = combined.subarray(0, 16);
  const authTag = combined.subarray(16, 32);
  const ciphertext = combined.subarray(32);

  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8')) as Record<string, string>;
}

// ─── resolveCredentials ──────────────────────────────────────────────────────
// Looks up the appConnections row for the given connector slug + workspaceId,
// decrypts the credentials field, and returns the key/value map.

export async function resolveCredentials(
  connectorId: string,
  workspaceId: string
): Promise<Record<string, string>> {
  // Join appConnections with connectorRegistry on slug = connectorId
  const rows = await db
    .select({
      credentials: schema.appConnections.credentials,
    })
    .from(schema.appConnections)
    .innerJoin(
      schema.connectorRegistry,
      eq(schema.appConnections.connectorId, schema.connectorRegistry.id)
    )
    .where(
      and(
        eq(schema.connectorRegistry.slug, connectorId),
        eq(schema.appConnections.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (rows.length === 0) {
    return {};
  }

  const raw = rows[0].credentials;

  // If the stored value is already an object (not yet encrypted), return as-is
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }

  // If stored as a base64 encrypted string, decrypt it
  if (typeof raw === 'string') {
    try {
      return decryptCredentials(raw);
    } catch {
      return {};
    }
  }

  return {};
}
