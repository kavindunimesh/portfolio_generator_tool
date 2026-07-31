import { v4 as uuidv4 } from 'uuid';
import { query } from '../db';
import { deleteFromR2, uploadToR2 } from './r2';

export const MAX_USER_STORAGE_BYTES = 10 * 1024 * 1024;
/** Client compresses first; this is a safety cap against oversized uploads. */
export const MAX_UPLOAD_BYTES = 1 * 1024 * 1024;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type UploadPurpose = 'avatar' | 'project' | 'logo' | 'favicon';

type UserUploadRow = {
  id: string;
  object_key: string;
  size_bytes: number;
};

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');
  }
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
    throw new Error('Image must be 1MB or smaller after compression');
  }

  if (fileBuffer.length === 0) {
    throw new Error('Invalid image file');
  }

  let freedBytes = 0;
  if (replaceUrl) {
    freedBytes = await deleteUserUpload(userId, replaceUrl);
  } else if (purpose === 'avatar' || purpose === 'favicon') {
    const oldRows = await query<UserUploadRow[]>(
      `SELECT id, object_key, size_bytes
       FROM user_uploads
       WHERE user_id = :userId AND purpose = :purpose`,
      { userId, purpose }
    );
    for (const row of oldRows) {
      try {
        await deleteFromR2(row.object_key);
      } catch (err) {
        console.error(`Failed to delete old ${purpose} from R2:`, err);
      }
      await removeUploadRecord(userId, row.id);
      freedBytes += row.size_bytes;
    }
  }

  const usedBefore = await getUserStorageUsage(userId);
  const usedAfter = usedBefore - freedBytes + fileBuffer.length;

  if (usedAfter > MAX_USER_STORAGE_BYTES) {
    throw new Error('Storage limit reached (10MB per account). Remove an image or replace an existing one.');
  }

  const extension = extensionForMime(mimeType);
  const fileName = `${uuidv4()}${extension}`;
  const objectKey = `portfolio/${userId}/${fileName}`;
  const publicUrl = await uploadToR2(objectKey, fileBuffer, mimeType);
  const uploadId = uuidv4();

  await query(
    `INSERT INTO user_uploads (id, user_id, object_key, public_url, size_bytes, mime_type, purpose)
     VALUES (:id, :userId, :objectKey, :publicUrl, :sizeBytes, :mimeType, :purpose)`,
    {
      id: uploadId,
      userId,
      objectKey,
      publicUrl,
      sizeBytes: fileBuffer.length,
      mimeType,
      purpose,
    }
  );

  return {
    url: publicUrl,
    sizeBytes: fileBuffer.length,
    usedBytes: usedAfter,
    maxBytes: MAX_USER_STORAGE_BYTES,
  };
}
