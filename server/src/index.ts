import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { pool } from './db.ts'

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
)

app.use(express.json())

// API health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'DataPulse API',
    timestamp: new Date().toISOString(),
  })
})

// Database health check
app.get('/api/health/db', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT current_database() AS database, current_user AS user',
    )

    res.json({
      status: 'ok',
      database: result.rows[0].database,
      user: result.rows[0].user,
    })
  } catch (error) {
    console.error(
      'Database health check failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    })
  }
})

// Get all vehicles from PostgreSQL
app.get('/api/vehicles', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, vin, make, model, model_year, status, created_at
       FROM vehicles
       ORDER BY id ASC`,
    )

    res.json({
      count: result.rowCount ?? 0,
      vehicles: result.rows,
    })
  } catch (error) {
    console.error(
      'Failed to fetch vehicles:',
      error instanceof Error ? error.message : 'Unknown error',
    )

    res.status(500).json({
      error: 'Failed to fetch vehicles',
    })
  }
})

// Create a new vehicle
app.post('/api/vehicles', async (req, res) => {
  const { vin, make, model, model_year, status } = req.body ?? {}

  if (
    typeof vin !== 'string' ||
    typeof make !== 'string' ||
    typeof model !== 'string' ||
    !Number.isInteger(model_year)
  ) {
    res.status(400).json({
      error: 'VIN, make, model and a valid model_year are required',
    })
    return
  }

  const cleanVin = vin.trim().toUpperCase()
  const cleanMake = make.trim()
  const cleanModel = model.trim()
  const vehicleStatus = status ?? 'active'

  if (
    cleanVin.length !== 17 ||
    !/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)
  ) {
    res.status(400).json({
      error: 'VIN must contain 17 valid characters',
    })
    return
  }

  if (!cleanMake || cleanMake.length > 100) {
    res.status(400).json({
      error: 'Make must be between 1 and 100 characters',
    })
    return
  }

  if (!cleanModel || cleanModel.length > 100) {
    res.status(400).json({
      error: 'Model must be between 1 and 100 characters',
    })
    return
  }

  if (model_year < 1886 || model_year > 2100) {
    res.status(400).json({
      error: 'Model year must be between 1886 and 2100',
    })
    return
  }

  if (!['active', 'sold', 'in_service'].includes(vehicleStatus)) {
    res.status(400).json({
      error: 'Status must be active, sold or in_service',
    })
    return
  }

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (vin, make, model, model_year, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, vin, make, model, model_year, status, created_at`,
      [cleanVin, cleanMake, cleanModel, model_year, vehicleStatus],
    )

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle: result.rows[0],
    })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      res.status(409).json({
        error: 'A vehicle with this VIN already exists',
      })
      return
    }

    console.error(
      'Failed to create vehicle:',
      error instanceof Error ? error.message : 'Unknown error',
    )

    res.status(500).json({
      error: 'Failed to create vehicle',
    })
  }
})

// Export the app so tests can exercise endpoints without starting a port.
export { app }

// Start the server only when this file is executed directly.
const isMainModule = process.argv[1]
  ? import.meta.url === new URL(`file://${process.argv[1]}`).href
  : false

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`DataPulse API running at http://localhost:${PORT}`)
  })
}