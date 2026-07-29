import { Router } from 'express';
import { query } from '../db';
import { PortfolioRow, serializePortfolio } from '../services/portfolioMapper';
import { TEMPLATES } from '../templates/catalog';
import { isReservedRoute, isValidUserRoute } from '../utils/routes';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.get('/templates', (_req, res) => {
  res.json(TEMPLATES);
});

router.get('/routes/check', requireAuth, async (req, res) => {
  const userRoute = String(req.query.userRoute || '').trim().toLowerCase();
  if (!userRoute) {
    return res.status(400).json({ available: false, error: 'userRoute required' });
  }
  if (!isValidUserRoute(userRoute)) {
    return res.json({ available: false, reason: 'invalid' });
  }
  if (isReservedRoute(userRoute)) {
    return res.json({ available: false, reason: 'reserved' });
  }
  const taken = await query<{ id: string }[]>(
    'SELECT id FROM portfolios WHERE user_route = :route AND user_id <> :userId LIMIT 1',
    { route: userRoute, userId: req.user!.id }
  );
  return res.json({ available: taken.length === 0, reason: taken.length ? 'taken' : null });
});

router.get('/public/portfolios/:userRoute', async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const userRoute = req.params.userRoute.toLowerCase();
  const rows = await query<PortfolioRow[]>(
    `SELECT * FROM portfolios
     WHERE user_route = :userRoute AND is_published = 1
     LIMIT 1`,
    { userRoute }
  );
  if (!rows.length) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  return res.json(serializePortfolio(rows[0]));
});

export default router;
