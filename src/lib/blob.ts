// ─── Vercel Blob Storage Integration ────────────────────────────────────────
// Handles file uploads, deletions, and listing for workflow artifacts.
// Uses Vercel Blob API with BLOB_READ_WRITE_TOKEN (provided automatically on Vercel).

import { put, del, list } from '@vercel/blob';

export interface BlobUploadResult {
  url: string;
  downloadUrl: string;
  contentType: string;
  size: number;
}

export interface BlobListResult {
  blobs: Array<{
    url: string;
    downloadUrl: string;
    pathname: string;
    uploadedAt: Date;
    contentType?: string;
    contentDisposition?: string;
    size?: number;
  }>;
  cursor: string;
  hasMore: boolean;
}

/**
 * Upload a file to Vercel Blob storage
 * @param filename - Name of the file to store
 * @param data - File content (Buffer or Blob)
 * @param options - Additional options (contentType, etc.)
 */
export async function uploadFile(
  filename: string,
  data: Buffer | Blob,
  options?: {
    contentType?: string;
  }
): Promise<BlobUploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not set. This is auto-provided by Vercel.'
    );
  }

  const blob = await put(filename, data, {
    access: 'public',
    token,
    contentType: options?.contentType,
  });

  return {
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    contentType: blob.contentType || 'application/octet-stream',
    size: (blob as unknown as Record<string, unknown>).size as number || 0,
  };
}

/**
 * Delete a file from Vercel Blob storage by URL
 * @param url - The blob URL to delete
 */
export async function deleteFile(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }

  await del(url, { token });
}

/**
 * List files in Vercel Blob storage with optional prefix filtering
 * @param prefix - Optional prefix to filter results (e.g., 'workflows/123/')
 * @param cursor - Optional cursor for pagination
 */
export async function listFiles(
  prefix?: string,
  cursor?: string
): Promise<BlobListResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }

  const result = await list({
    token,
    prefix,
    cursor,
  });

  return {
    blobs: result.blobs,
    cursor: result.cursor || '',
    hasMore: result.hasMore,
  };
}
