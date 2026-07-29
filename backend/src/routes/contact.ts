import { createHash, randomUUID } from 'crypto';
import { Router } from 'express';
import type { ResultSetHeader } from 'mysql2';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { PortfolioRow, serializePortfolio } from '../services/portfolioMapper';
import { consumeContactSubmitLimits, consumeRateLimit } from '../utils/rateLimit';

const router = Router();

const submitSchema = z.object({
  name: z
    .string({ required_error: 'Please enter your name.' })
    .trim()
    .min(1, 'Please enter your name.')
    .max(120, 'Name must be 120 characters or fewer.'),
  email: z
    .string({ required_error: 'Please enter your email.' })
    .trim()
    .min(1, 'Please enter your email.')
    .email('Enter a valid email address (e.g. you@example.com).')
    .max(255, 'Email must be 255 characters or fewer.'),
  subject: z
    .string()
    .trim()
    .max(200, 'Subject must be 200 characters or fewer.')
    .optional()
    .default(''),
  message: z
    .string({ required_error: 'Please write a message.' })
    .trim()
    .min(10, 'Message must be at least 10 characters.')
    .max(4000, 'Message must be 4000 characters or fewer.'),
  /** Honeypot — must stay empty (accept legacy `website` too) */
  honeypot: z.string().max(200).optional().default(''),
  website: z.string().max(200).optional().default(''),
  /** Client form open time (ms). Used to reject instant scanner posts. */
  formStartedAt: z.union([z.number(), z.string()]).optional(),
});

function clientIp(req: { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string } }) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex').slice(0, 64);
}

function looksLikeBotTiming(formStartedAt: unknown): boolean {
  const started = typeof formStartedAt === 'string' ? Number(formStartedAt) : Number(formStartedAt);
  if (!Number.isFinite(started) || started <= 0) return true;
  const ageMs = Date.now() - started;
  // Instant posts (< 2.5s) or absurdly old / future timestamps
  if (ageMs < 2500 || ageMs > 6 * 60 * 60 * 1000) return true;
  return false;
}

router.post(
  '/public/portfolios/:userRoute/contact',
  asyncHandler(async (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const userRoute = String(req.params.userRoute || '')
      .trim()
      .toLowerCase();
    const ip = clientIp(req);

    // Cheap early gate before parsing body deeply
    const early = consumeRateLimit(`contact:early:ip:${ip}`, 12, 60_000);
    if (!early.ok) {
      res.setHeader('Retry-After', String(early.retryAfterSec));
      return res.status(429).json({ error: 'Too many messages. Try again later.' });
    }

    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      // Invalid payloads from scanners still burn a tighter bucket
      const bad = consumeRateLimit(`contact:bad:ip:${ip}`, 8, 10 * 60_000);
      if (!bad.ok) {
        res.setHeader('Retry-After', String(bad.retryAfterSec));
        return res.status(429).json({ error: 'Too many messages. Try again later.' });
      }
      const flat = parsed.error.flatten();
      const fields: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flat.fieldErrors)) {
        if (messages?.[0]) fields[key] = messages[0];
      }
      const first = Object.values(fields)[0] || 'Please check the form and try again.';
      return res.status(400).json({
        error: first,
        fields,
      });
    }

    const honeypot = (parsed.data.honeypot || parsed.data.website || '').trim();
    // Honeypot / timing bots: pretend success so scanners do not adapt
    if (honeypot || looksLikeBotTiming(parsed.data.formStartedAt)) {
      return res.json({ ok: true });
    }

    const contentHash = createHash('sha256')
      .update(
        `${userRoute}|${parsed.data.email.toLowerCase()}|${parsed.data.message.trim().toLowerCase()}`
      )
      .digest('hex')
      .slice(0, 32);

    const limit = consumeContactSubmitLimits({
      ip,
      scope: userRoute,
      email: parsed.data.email,
      contentHash,
    });
    if (!limit.ok) {
      res.setHeader('Retry-After', String(limit.retryAfterSec));
      return res.status(429).json({ error: 'Too many messages. Try again later.' });
    }

    const rows = await query<PortfolioRow[]>(
      `SELECT * FROM portfolios
       WHERE user_route = :userRoute AND is_published = 1
       LIMIT 1`,
      { userRoute }
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const portfolio = serializePortfolio(rows[0]);
    const contact = portfolio.plugins.contactForm;
    if (!contact.enabled || contact.mode !== 'adawwa') {
      return res.status(403).json({ error: 'Contact form is not enabled for this portfolio' });
    }

    const id = randomUUID();
    const ua = String(req.headers['user-agent'] || '').slice(0, 255);
    await query(
      `INSERT INTO contact_messages
        (id, portfolio_id, name, email, subject, message, ip_hash, user_agent, is_read)
       VALUES
        (:id, :portfolioId, :name, :email, :subject, :message, :ipHash, :userAgent, 0)`,
      {
        id,
        portfolioId: rows[0].id,
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject || '',
        message: parsed.data.message,
        ipHash: hashIp(ip),
        userAgent: ua || null,
      }
    );

    return res.status(201).json({ ok: true });
  })
);

router.get(
  '/portfolio/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const portfolios = await query<{ id: string }[]>(
      'SELECT id FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!portfolios.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));
    const status = String(req.query.status || 'all').toLowerCase();
    const qRaw = String(req.query.q || '')
      .trim()
      .slice(0, 120);
    const offset = (page - 1) * pageSize;
    const portfolioId = portfolios[0].id;

    let where = 'portfolio_id = :portfolioId';
    const params: Record<string, unknown> = { portfolioId };

    if (status === 'hidden') {
      where += ' AND is_hidden = 1';
    } else {
      where += ' AND is_hidden = 0';
      if (status === 'unread') where += ' AND is_read = 0';
      if (status === 'read') where += ' AND is_read = 1';
    }

    if (qRaw) {
      const like = `%${qRaw.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
      where +=
        ' AND (name LIKE :q ESCAPE :esc OR email LIKE :q ESCAPE :esc OR subject LIKE :q ESCAPE :esc OR message LIKE :q ESCAPE :esc)';
      params.q = like;
      params.esc = '\\';
    }

    const totalRows = await query<{ c: number }[]>(
      `SELECT COUNT(*) AS c FROM contact_messages WHERE ${where}`,
      params
    );
    const total = Number(totalRows[0]?.c || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const messages = await query<
      Array<{
        id: string;
        name: string;
        email: string;
        subject: string;
        message: string;
        is_read: number | boolean;
        is_hidden: number | boolean;
        created_at: Date | string;
      }>
    >(
      `SELECT id, name, email, subject, message, is_read, is_hidden, created_at
       FROM contact_messages
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    const unread = await query<{ c: number }[]>(
      `SELECT COUNT(*) AS c FROM contact_messages
       WHERE portfolio_id = :portfolioId AND is_read = 0 AND is_hidden = 0`,
      { portfolioId }
    );

    return res.json({
      page,
      pageSize,
      total,
      totalPages,
      unreadCount: Number(unread[0]?.c || 0),
      q: qRaw,
      messages: messages.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject || '',
        message: m.message,
        isRead: Boolean(m.is_read),
        isHidden: Boolean(m.is_hidden),
        createdAt: m.created_at,
      })),
    });
  })
);

router.patch(
  '/portfolio/messages/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const portfolios = await query<{ id: string }[]>(
      'SELECT id FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!portfolios.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const result = await query<ResultSetHeader>(
      `UPDATE contact_messages
       SET is_read = 1
       WHERE id = :id AND portfolio_id = :portfolioId`,
      { id: req.params.id, portfolioId: portfolios[0].id }
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Message not found' });
    }
    return res.json({ ok: true });
  })
);

router.patch(
  '/portfolio/messages/:id/hide',
  requireAuth,
  asyncHandler(async (req, res) => {
    const portfolios = await query<{ id: string }[]>(
      'SELECT id FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!portfolios.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const result = await query<ResultSetHeader>(
      `UPDATE contact_messages
       SET is_hidden = 1, is_read = 1
       WHERE id = :id AND portfolio_id = :portfolioId`,
      { id: req.params.id, portfolioId: portfolios[0].id }
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Message not found' });
    }
    return res.json({ ok: true });
  })
);

router.patch(
  '/portfolio/messages/:id/unhide',
  requireAuth,
  asyncHandler(async (req, res) => {
    const portfolios = await query<{ id: string }[]>(
      'SELECT id FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    if (!portfolios.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const result = await query<ResultSetHeader>(
      `UPDATE contact_messages
       SET is_hidden = 0
       WHERE id = :id AND portfolio_id = :portfolioId`,
      { id: req.params.id, portfolioId: portfolios[0].id }
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Message not found' });
    }
    return res.json({ ok: true });
  })
);

export default router;
