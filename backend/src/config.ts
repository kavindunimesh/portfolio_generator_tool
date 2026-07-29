import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '0.0.0.0',
  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE || 'portfolio_generator',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  storagePath: path.resolve(process.cwd(), process.env.STORAGE_PATH || './storage'),
  templatesPath: path.resolve(process.cwd(), process.env.TEMPLATES_PATH || './templates'),
  zipTtlDays: Number(process.env.ZIP_TTL_DAYS || 7),
  publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  r2: {
    region: process.env.FILE_BUCKET_PUB_REGION || 'auto',
    secretAccessKey: process.env.FILE_BUCKET_PUB_SECRET_ACCESS_KEY || '',
    accessKeyId: process.env.FILE_BUCKET_PUB_ACCESS_KEY_ID || '',
    url: process.env.FILE_BUCKET_PUB_URL || '',
    bucket: process.env.FILE_BUCKET_PUB_NAME || '',
    domain: process.env.FILE_BUCKET_PUB_DOMAIN || '',
    get enabled() {
      return Boolean(
        this.accessKeyId &&
          this.secretAccessKey &&
          this.url &&
          this.bucket &&
          this.domain
      );
    },
  },
};
