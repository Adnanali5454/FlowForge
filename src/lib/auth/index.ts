// ─── FlowForge Auth System ──────────────────────────────────────────────────
// JWT-based session management with workspace context.
// Handles: login, registration, session validation, RBAC checks.

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { hash, compare } from 'bcryptjs';
import type { UserRole } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  workspaceId?: string;
  role?: UserRole;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

// ─── Password Hashing ──────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// ─── JWT Token Management ───────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// ─── RBAC Permission Checks ────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Check if a user's role has at least the minimum required role level.
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Permission presets for common operations.
 */
export const PERMISSIONS = {
  viewWorkflows: 'viewer' as UserRole,
  editWorkflows: 'editor' as UserRole,
  publishWorkflows: 'editor' as UserRole,
  deleteWorkflows: 'admin' as UserRole,
  manageConnections: 'editor' as UserRole,
  manageMembers: 'admin' as UserRole,
  manageSettings: 'admin' as UserRole,
  manageWorkspace: 'owner' as UserRole,
  viewExecutions: 'viewer' as UserRole,
  viewAuditLog: 'admin' as UserRole,
} as const;

// ─── Cookie Helpers ─────────────────────────────────────────────────────────

export const AUTH_COOKIE_NAME = 'ff_session';
export const WORKSPACE_COOKIE_NAME = 'ff_workspace';

export function getAuthCookieOptions(secure = true) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };
}
