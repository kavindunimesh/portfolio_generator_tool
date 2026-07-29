import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

type JobRow = {
  id: string;
  user_id: string;
  status: string;
  zip_filename: string | null;
  zip_path: string | null;
  zip_size_bytes: number | null;
  error_message: string | null;
  expires_at: Date | string | null;
};

router.get('/:id', requireAuth, async (req, res) => {
  const rows = await query<JobRow[]>(
    'SELECT * FROM download_jobs WHERE id = :id AND user_id = :userId LIMIT 1',
    { id: req.params.id, userId: req.user!.id }
  );
  if (!rows.length) {
    return res.status(404).json({ error: 'Download not found' });
  }
  const job = rows[0];
  return res.json({
    id: job.id,
    status: job.status,
    filename: job.zip_filename,
    sizeBytes: job.zip_size_bytes,
    error: job.error_message,
    downloadUrl: job.status === 'ready' ? `/api/downloads/${job.id}/file` : null,
  });
});

router.get('/:id/file', requireAuth, async (req, res) => {
  const rows = await query<JobRow[]>(
    'SELECT * FROM download_jobs WHERE id = :id AND user_id = :userId LIMIT 1',
    { id: req.params.id, userId: req.user!.id }
  );
  if (!rows.length) {
    return res.status(404).json({ error: 'Download not found' });
  }
  const job = rows[0];
  if (job.status !== 'ready' || !job.zip_path) {
    return res.status(409).json({ error: 'Zip not ready' });
  }
  if (!fs.existsSync(job.zip_path)) {
    return res.status(404).json({ error: 'Zip file missing' });
  }
  const filename = job.zip_filename || path.basename(job.zip_path);
  res.download(job.zip_path, filename);
});

export default router;
