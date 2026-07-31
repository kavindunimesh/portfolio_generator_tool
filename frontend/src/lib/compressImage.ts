export type UploadPurpose = 'avatar' | 'project' | 'logo' | 'favicon';

export const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

type CompressPass = {
  width: number;
  height?: number;
  fit: 'cover' | 'inside';
  mimeType: 'image/webp' | 'image/png';
  quality: number;
  maxBytes: number;
};

function passesFor(purpose: UploadPurpose): CompressPass[] {
  if (purpose === 'favicon') {
    return [
      { width: 64, height: 64, fit: 'cover', mimeType: 'image/png', quality: 1, maxBytes: 24_000 },
      { width: 48, height: 48, fit: 'cover', mimeType: 'image/png', quality: 1, maxBytes: Number.POSITIVE_INFINITY },
    ];
  }
  if (purpose === 'avatar') {
    return [
      { width: 512, height: 512, fit: 'cover', mimeType: 'image/webp', quality: 0.8, maxBytes: 120_000 },
      { width: 384, height: 384, fit: 'cover', mimeType: 'image/webp', quality: 0.75, maxBytes: Number.POSITIVE_INFINITY },
    ];
  }
  if (purpose === 'logo') {
    return [
      { width: 192, height: 192, fit: 'inside', mimeType: 'image/webp', quality: 0.85, maxBytes: 40_000 },
      { width: 128, height: 128, fit: 'inside', mimeType: 'image/webp', quality: 0.78, maxBytes: Number.POSITIVE_INFINITY },
    ];
  }
  return [
    { width: 1280, fit: 'inside', mimeType: 'image/webp', quality: 0.82, maxBytes: 350_000 },
    { width: 960, fit: 'inside', mimeType: 'image/webp', quality: 0.72, maxBytes: Number.POSITIVE_INFINITY },
  ];
}

function extensionFor(mimeType: string): string {
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/gif') return '.gif';
  return '.webp';
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress image in this browser'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/** Cover crop into target box, never enlarging the source. */
function drawCover(source: ImageBitmap, targetW: number, targetH: number): HTMLCanvasElement {
  const srcW = source.width;
  const srcH = source.height;
  const targetRatio = targetW / targetH;
  const srcRatio = srcW / srcH;

  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;

  if (srcRatio > targetRatio) {
    sw = srcH * targetRatio;
    sx = (srcW - sw) / 2;
  } else {
    sh = srcW / targetRatio;
    sy = (srcH - sh) / 2;
  }

  const scale = Math.min(1, targetW / sw, targetH / sh);
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser');
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas;
}

/** Fit inside max box, never enlarging. */
function drawInside(source: ImageBitmap, maxW: number, maxH: number): HTMLCanvasElement {
  const srcW = source.width;
  const srcH = source.height;
  const scale = Math.min(1, maxW / srcW, maxH / srcH);
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser');
  ctx.drawImage(source, 0, 0, outW, outH);
  return canvas;
}

async function encodePass(source: ImageBitmap, pass: CompressPass): Promise<Blob> {
  const canvas =
    pass.fit === 'cover' && pass.height
      ? drawCover(source, pass.width, pass.height)
      : drawInside(source, pass.width, pass.height ?? pass.width);

  try {
    const preferred = await canvasToBlob(canvas, pass.mimeType, pass.quality);
    if (pass.mimeType === 'image/webp' && preferred.type !== 'image/webp') {
      return canvasToBlob(canvas, 'image/jpeg', pass.quality);
    }
    return preferred;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Resize + compress in the browser (canvas). Mirrors the old server-side sharp rules.
 */
export async function compressImageForUpload(file: File, purpose: UploadPurpose): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Images must be 8MB or smaller before upload');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Could not read this image file');
  }

  try {
    const attempts = passesFor(purpose);
    let best: Blob | null = null;

    for (const pass of attempts) {
      best = await encodePass(bitmap, pass);
      if (best.size <= pass.maxBytes) break;
    }

    if (!best || best.size === 0) {
      throw new Error('Invalid image file');
    }

    const ext = extensionFor(best.type);
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([best], `${base}${ext}`, { type: best.type, lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
