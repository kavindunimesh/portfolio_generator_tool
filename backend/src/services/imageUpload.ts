import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db';
import { deleteFromR2, uploadToR2 } from './r2';

export const MAX_USER_STORAGE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type UploadPurpose = 'avatar' | 'project' | 'logo';

type UserUploadRow = {
  id: string;
  object_key: string;
  size_bytes: number;
};

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export async function getUserStorageUsage(userId: string): Promise<number> {
  const rows = await query<Array<{ total: number | null }>>(
    'SELECT COALESCE(SUM(size_bytes), 0) AS total FROM user_uploads WHERE user_id = :userId',
    { userId }
  );
  return Number(rows[0]?.total || 0);
}

async function findUploadByUrl(userId: string, publicUrl: string): Promise<UserUploadRow | null> {
  const rows = await query<UserUploadRow[]>(
    'SELECT id, object_key, size_bytes FROM user_uploads WHERE user_id = :userId AND public_url = :publicUrl LIMIT 1',
    { userId, publicUrl }
  );
  return rows[0] || null;
}

async function removeUploadRecord(userId: string, uploadId: string): Promise<void> {
  await query('DELETE FROM user_uploads WHERE id = :uploadId AND user_id = :userId', {
    uploadId,
    userId,
  });
}

export async function deleteUserUpload(userId: string, publicUrl: string): Promise<number> {
  const existing = await findUploadByUrl(userId, publicUrl);
  if (!existing) {
    return 0;
  }

  try {
    await deleteFromR2(existing.object_key);
  } catch (err) {
    console.error('Failed to delete object from R2:', err);
  }

  await removeUploadRecord(userId, existing.id);
  return existing.size_bytes;
}

export async function compressImage(
  buffer: Buffer,
  purpose: UploadPurpose
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  const image = sharp(buffer, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();

  const resizeOptions =
    purpose === 'avatar'
      ? { width: 512, height: 512, fit: 'cover' as const, withoutEnlargement: true }
      : purpose === 'logo'
        ? { width: 192, height: 192, fit: 'inside' as const, withoutEnlargement: true }
        : { width: 1280, fit: 'inside' as const, withoutEnlargement: true };

  const quality = purpose === 'avatar' ? 80 : purpose === 'logo' ? 85 : 82;

  let output = await sharp(buffer)
    .rotate()
    .resize(resizeOptions)
    .webp({ quality, effort: 5, smartSubsample: true })
    .toBuffer();

  if (output.length > 350_000 && purpose === 'project') {
    output = await sharp(buffer)
      .rotate()
      .resize({ width: 960, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72, effort: 5, smartSubsample: true })
      .toBuffer();
  }

  if (output.length > 120_000 && purpose === 'avatar') {
    output = await sharp(buffer)
      .rotate()
      .resize({ width: 384, height: 384, fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 75, effort: 5, smartSubsample: true })
      .toBuffer();
  }

  if (output.length > 40_000 && purpose === 'logo') {
    output = await sharp(buffer)
      .rotate()
      .resize({ width: 128, height: 128, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 5, smartSubsample: true })
      .toBuffer();
  }

  if (!metadata.width && output.length === 0) {
    throw new Error('Invalid image file');
  }

  return { buffer: output, mimeType: 'image/webp', extension: '.webp' };
}

export async function uploadUserImage(params: {
  userId: string;
  fileBuffer: Buffer;
  mimeType: string;
  purpose: UploadPurpose;
  replaceUrl?: string;
}): Promise<{ url: string; sizeBytes: number; usedBytes: number; maxBytes: number }> {
  const { userId, fileBuffer, mimeType, purpose, replaceUrl } = params;

  if (!isAllowedImageMime(mimeType)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');
  }

  if (fileBuffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('Image must be 8MB or smaller before upload');
  }

  let freedBytes = 0;
  if (replaceUrl) {
    freedBytes = await deleteUserUpload(userId, replaceUrl);
  } else if (purpose === 'avatar') {
    const avatarRows = await query<UserUploadRow[]>(
      `SELECT id, object_key, size_bytes
       FROM user_uploads
       WHERE user_id = :userId AND purpose = 'avatar'`,
      { userId }
    );
    for (const row of avatarRows) {
      try {
        await deleteFromR2(row.object_key);
      } catch (err) {
        console.error('Failed to delete old avatar from R2:', err);
      }
      await removeUploadRecord(userId, row.id);
      freedBytes += row.size_bytes;
    }
  }

  const compressed = await compressImage(fileBuffer, purpose);
  const usedBefore = await getUserStorageUsage(userId);
  const usedAfter = usedBefore - freedBytes + compressed.buffer.length;

  if (usedAfter > MAX_USER_STORAGE_BYTES) {
    throw new Error('Storage limit reached (10MB per account). Remove an image or replace an existing one.');
  }

  const fileName = `${uuidv4()}${compressed.extension}`;
  const objectKey = `portfolio/${userId}/${fileName}`;
  const publicUrl = await uploadToR2(objectKey, compressed.buffer, compressed.mimeType);
  const uploadId = uuidv4();

  await query(
    `INSERT INTO user_uploads (id, user_id, object_key, public_url, size_bytes, mime_type, purpose)
     VALUES (:id, :userId, :objectKey, :publicUrl, :sizeBytes, :mimeType, :purpose)`,
    {
      id: uploadId,
      userId,
      objectKey,
      publicUrl,
      sizeBytes: compressed.buffer.length,
      mimeType: compressed.mimeType,
      purpose,
    }
  );

  return {
    url: publicUrl,
    sizeBytes: compressed.buffer.length,
    usedBytes: usedAfter,
    maxBytes: MAX_USER_STORAGE_BYTES,
  };
}
