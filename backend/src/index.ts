import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import { env } from './config';
import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import downloadRoutes from './routes/downloads';
import publicRoutes from './routes/public';
import uploadRoutes from './routes/uploads';

fs.mkdirSync(`${env.storagePath}/zips`, { recursive: true });
fs.mkdirSync(`${env.storagePath}/tmp`, { recursive: true });

const app = express();
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const corsOrigins = env.corsOrigin
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const allowAllOrigins = corsOrigins.includes('*');

app.use(
  cors({
    origin: allowAllOrigins
      ? true
      : (origin, callback) => {
          if (!origin || corsOrigins.includes(origin)) {
            callback(null, true);
            return;
          }
          callback(new Error(`CORS blocked for origin: ${origin}`));
        },
    credentials: !allowAllOrigins,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (message.startsWith('CORS blocked')) {
    return res.status(403).json({ error: message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.port, env.host, () => {
  console.log(`API listening on http://${env.host}:${env.port}`);
});
