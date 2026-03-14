// ─── Files API ──────────────────────────────────────────────────────────────
// GET  /api/files      — List files for workspace
// POST /api/files      — Upload a file
// DELETE /api/files    — Delete a file by URL

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { uploadFile, deleteFile, listFiles } from '@/lib/blob';

/**
 * GET /api/files — List files for workspace
 * Query params: prefix (optional, e.g., 'workflows/123/'), cursor (optional for pagination)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix');
    const cursor = searchParams.get('cursor') || undefined;

    // Build prefix with workspace isolation
    const workspacePrefix = `workspaces/${session.workspaceId}/${prefix || ''}`;

    const result = await listFiles(workspacePrefix, cursor);

    return NextResponse.json({ files: result.blobs, cursor: result.cursor, hasMore: result.hasMore });
  } catch (error) {
    console.error('GET /api/files error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files — Upload a file
 * Body: FormData with 'file' field
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileType = file instanceof File ? file.type : 'application/octet-stream';
    const filename = file instanceof File ? file.name : 'unnamed-file';

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Build filename with workspace isolation
    const timestamp = Date.now();
    const safePath = `workspaces/${session.workspaceId}/files/${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const result = await uploadFile(safePath, buffer, {
      contentType: fileType,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/files error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files — Delete a file by URL
 * Query params: url (the blob URL to delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session?.workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter required' },
        { status: 400 }
      );
    }

    // Security: Ensure file belongs to this workspace
    if (!url.includes(`workspaces/${session.workspaceId}`)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await deleteFile(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/files error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
