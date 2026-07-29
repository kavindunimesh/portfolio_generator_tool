import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { env } from '../config';
import {
  MAX_UPLOAD_BYTES,
  MAX_USER_STORAGE_BYTES,
  getUserStorageUsage,
  isAllowedImageMime,
  uploadUserImage,
} from '../services/imageUpload';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedImageMime(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
});

router.get(
  '/quota',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!env.r2.enabled) {
      return res.status(503).json({ error: 'Image uploads are not configured on this server' });
    }

    const usedBytes = await getUserStorageUsage(req.user!.id);
    res.json({
      usedBytes,
      maxBytes: MAX_USER_STORAGE_BYTES,
      remainingBytes: Math.max(0, MAX_USER_STORAGE_BYTES - usedBytes),
    });
  })
);

router.post(
  '/image',
  requireAuth,
  (req, res, next) => {
    if (!env.r2.enabled) {
      return res.status(503).json({ error: 'Image uploads are not configured on this server' });
    }
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image must be 8MB or smaller' });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const purpose =
      req.body.purpose === 'avatar'
        ? 'avatar'
        : req.body.purpose === 'logo'
          ? 'logo'
          : req.body.purpose === 'favicon'
            ? 'favicon'
            : 'project';
    const replaceUrl = typeof req.body.replaceUrl === 'string' ? req.body.replaceUrl.trim() : '';

    try {
      const result = await uploadUserImage({
        userId: req.user!.id,
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        purpose,
        replaceUrl: replaceUrl || undefined,
      });

      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      return res.status(400).json({ error: message });
    }
  })
);

export default router;
