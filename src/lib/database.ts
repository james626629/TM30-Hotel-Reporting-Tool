import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      // In a real app, you'd want to handle this more gracefully.
      // For local dev, this will throw an error if the .env file is missing.
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Necessary for Neon DB
      },
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const client = getPool();
  return client.query(text, params);
}
