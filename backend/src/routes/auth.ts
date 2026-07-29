import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { query } from '../db';
import { loginSchema, registerSchema } from '../types/schemas';
import { requireAuth, signToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { PortfolioRow, serializePortfolio } from '../services/portfolioMapper';
import { isReservedRoute, isValidUserRoute } from '../utils/routes';

const router = Router();

async function pickUserRoute(username: string): Promise<string | null> {
  const suggested = username.toLowerCase().replace(/_/g, '-');
  if (!isValidUserRoute(suggested) || isReservedRoute(suggested)) {
    return null;
  }
  const taken = await query<{ id: string }[]>(
    'SELECT id FROM portfolios WHERE user_route = :route LIMIT 1',
    { route: suggested }
  );
  return taken.length ? null : suggested;
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { username, password } = parsed.data;
    const existing = await query<{ id: string }[]>(
      'SELECT id FROM users WHERE username = :username LIMIT 1',
      { username }
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const userId = uuid();
    const portfolioId = uuid();
    const passwordHash = await bcrypt.hash(password, 10);
    const userRoute = await pickUserRoute(username);

    await query(
      `INSERT INTO users (id, username, password_hash) VALUES (:id, :username, :passwordHash)`,
      { id: userId, username, passwordHash }
    );
    await query(
      `INSERT INTO portfolios (id, user_id, user_route, template_slug, full_name)
     VALUES (:id, :userId, :userRoute, 'minimal', :fullName)`,
      { id: portfolioId, userId, userRoute, fullName: username }
    );

    const token = signToken({ id: userId, username });
    return res.status(201).json({ token, user: { id: userId, username } });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { username, password } = parsed.data;
    const rows = await query<{ id: string; username: string; password_hash: string }[]>(
      'SELECT id, username, password_hash FROM users WHERE username = :username LIMIT 1',
      { username }
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = signToken({ id: user.id, username: user.username });
    return res.json({ token, user: { id: user.id, username: user.username } });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query<PortfolioRow[]>(
      'SELECT * FROM portfolios WHERE user_id = :userId LIMIT 1',
      { userId: req.user!.id }
    );
    return res.json({
      user: req.user,
      portfolio: rows[0] ? serializePortfolio(rows[0]) : null,
    });
  })
);

export default router;
