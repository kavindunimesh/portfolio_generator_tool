import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { portfolioUpdateSchema } from '../types/schemas';
import { PortfolioRow, serializePortfolio } from '../services/portfolioMapper';
import { isReservedRoute, isValidUserRoute } from '../utils/routes';
import { env } from '../config';
import { renderPortfolioFiles, zipDirectory } from '../services/zipService';
import { buildCvPdf, cvFilenameFor } from '../services/cvPdfService';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    return res.json(serializePortfolio(rows[0]));
  })
);

router.put(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = portfolioUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const data = parsed.data;
    const rows = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    const current = rows[0];

    let userRoute = data.userRoute === undefined ? current.user_route : data.userRoute;
    if (userRoute) {
      if (!isValidUserRoute(userRoute)) {
        return res.status(400).json({ error: 'Invalid userRoute format' });
      }
      if (isReservedRoute(userRoute)) {
        return res.status(400).json({ error: 'This route is reserved' });
      }
      const taken = await query<{ id: string }[]>(
        'SELECT id FROM portfolios WHERE user_route = :route AND user_id <> :userId LIMIT 1',
        { route: userRoute, userId: req.user!.id }
      );
      if (taken.length) {
        return res.status(409).json({ error: 'userRoute already taken' });
      }
    }

    await query(
      `UPDATE portfolios SET
      user_route = :userRoute,
      template_slug = :templateSlug,
      full_name = :fullName,
      email = :email,
      phone = :phone,
      whatsapp = :whatsapp,
      headline = :headline,
      bio = :bio,
      location = :location,
      avatar_url = :avatarUrl,
      primary_color = :primaryColor,
      theme_mode = :themeMode,
      socials_json = :socialsJson,
      skills_json = :skillsJson,
      projects_json = :projectsJson,
      payload_json = :payloadJson
     WHERE user_id = :userId`,
      {
        userRoute,
        templateSlug: data.templateSlug,
        fullName: data.personal.fullName || null,
        email: data.personal.email || null,
        phone: data.personal.phone || null,
        whatsapp: data.personal.whatsapp || null,
        headline: data.personal.headline || null,
        bio: data.personal.bio || null,
        location: data.personal.location || null,
        avatarUrl: data.personal.avatarUrl || null,
        primaryColor: data.theme.primaryColor,
        themeMode: data.theme.mode,
        socialsJson: JSON.stringify(data.socials),
        skillsJson: JSON.stringify(data.skills),
        projectsJson: JSON.stringify(data.projects),
        payloadJson: JSON.stringify(data),
        userId: req.user!.id,
      }
    );

    const updated = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    return res.json(serializePortfolio(updated[0]));
  })
);

router.post(
  '/publish',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    const portfolio = rows[0];
    if (!portfolio.user_route) {
      return res.status(400).json({ error: 'Set a userRoute before publishing' });
    }
    if (!portfolio.full_name) {
      return res.status(400).json({ error: 'Add your name before publishing' });
    }

    await query(
      `UPDATE portfolios SET is_published = 1, published_at = NOW() WHERE user_id = :userId`,
      { userId: req.user!.id }
    );
    const updated = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    return res.json(serializePortfolio(updated[0]));
  })
);

router.post(
  '/unpublish',
  requireAuth,
  asyncHandler(async (req, res) => {
    await query(`UPDATE portfolios SET is_published = 0 WHERE user_id = :userId`, {
      userId: req.user!.id,
    });
    const updated = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!updated.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    return res.json(serializePortfolio(updated[0]));
  })
);

router.get(
  '/cv',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    const portfolio = serializePortfolio(rows[0]);
    if (!portfolio.personal.fullName.trim()) {
      return res.status(400).json({ error: 'Add your name before downloading a CV' });
    }
    const pdf = await buildCvPdf(portfolio);
    const filename = cvFilenameFor(portfolio);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(pdf.length));
    return res.send(pdf);
  })
);

router.post(
  '/download',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    const portfolio = rows[0];
    const jobId = uuid();
    const expires = new Date();
    expires.setDate(expires.getDate() + env.zipTtlDays);

    await query(
      `INSERT INTO download_jobs (id, portfolio_id, user_id, status, expires_at)
     VALUES (:id, :portfolioId, :userId, 'processing', :expiresAt)`,
      {
        id: jobId,
        portfolioId: portfolio.id,
        userId: req.user!.id,
        expiresAt: expires,
      }
    );

    const workDir = path.join(env.storagePath, 'tmp', jobId);
    const safeName =
      (portfolio.full_name || 'portfolio')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'portfolio';
    const zipFilename = `${safeName}-portfolio.zip`;
    const zipPath = path.join(env.storagePath, 'zips', `${jobId}.zip`);

    try {
      await renderPortfolioFiles(portfolio, workDir);
      const size = await zipDirectory(workDir, zipPath);
      await query(
        `UPDATE download_jobs SET status = 'ready', zip_filename = :zipFilename, zip_path = :zipPath, zip_size_bytes = :size
       WHERE id = :id`,
        { zipFilename, zipPath, size, id: jobId }
      );
      await fs.rm(workDir, { recursive: true, force: true });
      return res.status(201).json({
        id: jobId,
        status: 'ready',
        downloadUrl: `/api/downloads/${jobId}/file`,
        filename: zipFilename,
        sizeBytes: size,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Zip failed';
      await query(
        `UPDATE download_jobs SET status = 'failed', error_message = :message WHERE id = :id`,
        { message, id: jobId }
      );
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
      return res.status(500).json({ error: 'Failed to generate zip', detail: message });
    }
  })
);

export default router;
