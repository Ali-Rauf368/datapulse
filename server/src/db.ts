import 'dotenv/config'
import { Pool } from 'pg'

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'datapulse',
  user: process.env.DB_USER || 'datapulse_user',
  password: process.env.DB_PASSWORD,
})

pool.on('error', (error) => {
  console.error('Unexpected database connection error:', error.message)
})