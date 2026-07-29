import mysql from 'mysql2/promise';
import { env } from './config';

export const pool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

export async function query<T = unknown>(sql: string, params?: Record<string, unknown> | unknown[]) {
  const [rows] = await pool.query(sql, params as never);
  return rows as T;
}
