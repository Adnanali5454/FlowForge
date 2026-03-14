// ─── Audit Logging Helper ───────────────────────────────────────────────────
// Centralized audit logging for all user actions
// Log calls: logAudit(workspaceId, userId, action, resourceType, resourceId, details, ipAddress)

import { db, schema } from '@/lib/db';

/**
 * Log an audit event
 * @param workspaceId The workspace where the action occurred
 * @param userId The user performing the action
 * @param action The type of action (e.g., 'create', 'update', 'delete', 'login')
 * @param resourceType The type of resource affected (e.g., 'workflow', 'user', 'connection')
 * @param resourceId The ID of the resource affected (optional)
 * @param details Additional details about the action (optional)
 * @param ipAddress The IP address of the request (optional)
 */
export async function logAudit(
  workspaceId: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null = null,
  details: Record<string, unknown> = {},
  ipAddress: string | null = null
): Promise<void> {
  try {
    await db.insert(schema.auditLog).values({
      workspaceId,
      userId: userId || undefined,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
    });
  } catch (error) {
    // Log to console but don't throw — audit logging should not block main operations
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Extract IP address from a NextRequest
 */
export function getClientIpAddress(headers: Headers): string | null {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
}
