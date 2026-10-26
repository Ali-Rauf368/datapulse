import 'dotenv/config'
import { Pool } from 'pg'

const isRenderDatabase =
  process.env.DB_HOST?.endsWith('.render.com') ?? false

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'datapulse',
  user: process.env.DB_USER || 'datapulse_user',
  password: process.env.DB_PASSWORD,
  ...(isRenderDatabase ? { ssl: { rejectUnauthorized: false } } : {}),
})

pool.on('error', (error) => {
  console.error('Unexpected database connection error:', error.message)
})
