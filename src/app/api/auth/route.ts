// ─── Auth API ───────────────────────────────────────────────────────────────
// POST /api/auth — Login / Register / Logout

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  verifyPassword,
  createToken,
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from '@/lib/auth';
import { logAudit, getClientIpAddress } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const ipAddress = getClientIpAddress(request.headers);

    switch (action) {
      case 'register':
        return handleRegister(body, ipAddress);
      case 'login':
        return handleLogin(body, ipAddress);
      case 'logout':
        return handleLogout();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

async function handleRegister(
  body: {
    email: string;
    password: string;
    name: string;
  },
  ipAddress: string | null
) {
  const { email, password, name } = body;

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: 'Email, password, and name are required' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  // Check if user exists
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()));

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    );
  }

  // Create user
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(schema.users)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      emailVerified: false,
    })
    .returning({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
    });

  // Create default workspace
  const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const [workspace] = await db
    .insert(schema.workspaces)
    .values({
      name: `${name}'s Workspace`,
      slug: `${slug}-${Date.now().toString(36)}`,
      ownerId: user.id,
      plan: 'free',
    })
    .returning();

  // Add user as workspace owner
  await db.insert(schema.workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: 'owner',
  });

  // Log audit event
  await logAudit(
    workspace.id,
    user.id,
    'register',
    'user',
    user.id,
    { email: user.email, name: user.name },
    ipAddress
  );

  // Create session token
  const token = await createToken({
    userId: user.id,
    email: user.email,
    workspaceId: workspace.id,
    role: 'owner',
  });

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
  }, { status: 201 });

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return response;
}

async function handleLogin(
  body: { email: string; password: string },
  ipAddress: string | null
) {
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  // Find user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()));

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Get user's workspace(s)
  const memberships = await db
    .select({
      workspaceId: schema.workspaceMembers.workspaceId,
      role: schema.workspaceMembers.role,
      workspaceName: schema.workspaces.name,
      workspaceSlug: schema.workspaces.slug,
    })
    .from(schema.workspaceMembers)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.workspaceMembers.workspaceId))
    .where(eq(schema.workspaceMembers.userId, user.id));

  const primaryWorkspace = memberships[0];

  // Log audit event
  if (primaryWorkspace) {
    await logAudit(
      primaryWorkspace.workspaceId,
      user.id,
      'login',
      'user',
      user.id,
      { email: user.email },
      ipAddress
    );
  }

  // Create session token
  const token = await createToken({
    userId: user.id,
    email: user.email,
    workspaceId: primaryWorkspace?.workspaceId,
    role: primaryWorkspace?.role ?? 'viewer',
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    workspaces: memberships,
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return response;
}

function handleLogout() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
