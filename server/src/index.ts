
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { pool } from './db.ts'

const app = express()
const PORT = Number(process.env.PORT) || 3000

const VALID_STATUSES = ['active', 'sold', 'in_service'] as const
type VehicleStatus = (typeof VALID_STATUSES)[number]

const VEHICLE_COLUMNS =
  'id, vin, make, model, model_year, status, created_at'

function isValidStatus(value: unknown): value is VehicleStatus {
  return (
    typeof value === 'string' &&
    VALID_STATUSES.includes(value as VehicleStatus)
  )
}

function isValidId(value: string): boolean {
  return (
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0
  )
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
}

function logError(message: string, error: unknown): void {
  console.error(
    message,
    error instanceof Error ? error.message : 'Unknown error',
  )
}

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
    logError('Database health check failed:', error)
    res.status(500).json({ error: 'Database connection failed' })
  }
})

// Vehicle statistics
app.get('/api/vehicles/stats', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'sold')::int AS sold,
        COUNT(*) FILTER (WHERE status = 'in_service')::int AS in_service
      FROM vehicles
    `)

    res.json(result.rows[0])
  } catch (error) {
    logError('Failed to fetch vehicle statistics:', error)
    res.status(500).json({ error: 'Failed to fetch vehicle statistics' })
  }
})

// List and search vehicles
app.get('/api/vehicles', async (req, res) => {
  const search =
    typeof req.query.search === 'string'
      ? req.query.search.trim()
      : ''

  const status =
    typeof req.query.status === 'string'
      ? req.query.status
      : undefined

  if (status !== undefined && !isValidStatus(status)) {
    res.status(400).json({
      error: 'Status must be active, sold or in_service',
    })
    return
  }

  try {
    const conditions: string[] = []
    const values: unknown[] = []

    if (status) {
      values.push(status)
      conditions.push(`status = $${values.length}`)
    }

    if (search) {
      values.push(`%${search}%`)
      const parameter = `$${values.length}`

      conditions.push(
        `(vin ILIKE ${parameter}
          OR make ILIKE ${parameter}
          OR model ILIKE ${parameter})`,
      )
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : ''

    const result = await pool.query(
      `SELECT ${VEHICLE_COLUMNS}
       FROM vehicles
       ${whereClause}
       ORDER BY id ASC`,
      values,
    )

    // Return an array directly so clients can use response.body.map(...).
    res.json(result.rows)
  } catch (error) {
    logError('Failed to fetch vehicles:', error)
    res.status(500).json({ error: 'Failed to fetch vehicles' })
  }
})

// Get one vehicle
app.get('/api/vehicles/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ error: 'Invalid vehicle ID' })
    return
  }

  try {
    const result = await pool.query(
      `SELECT ${VEHICLE_COLUMNS}
       FROM vehicles
       WHERE id = $1`,
      [Number(req.params.id)],
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vehicle not found' })
      return
    }

    res.json(result.rows[0])
  } catch (error) {
    logError('Failed to fetch vehicle:', error)
    res.status(500).json({ error: 'Failed to fetch vehicle' })
  }
})

// Create a vehicle
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
  const vehicleStatus = status === undefined ? 'active' : status

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
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

  if (!isValidStatus(vehicleStatus)) {
    res.status(400).json({
      error: 'Status must be active, sold or in_service',
    })
    return
  }

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (vin, make, model, model_year, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${VEHICLE_COLUMNS}`,
      [cleanVin, cleanMake, cleanModel, model_year, vehicleStatus],
    )

    // Return the created vehicle directly, including its generated ID.
    res.status(201).json(result.rows[0])
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({
        error: 'A vehicle with this VIN already exists',
      })
      return
    }

    logError('Failed to create vehicle:', error)
    res.status(500).json({ error: 'Failed to create vehicle' })
  }
})

// Update a vehicle
app.patch('/api/vehicles/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ error: 'Invalid vehicle ID' })
    return
  }

  const body = req.body

  if (
    body === null ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    res.status(400).json({ error: 'Request body must be a JSON object' })
    return
  }

  const allowedFields = ['vin', 'make', 'model', 'model_year', 'status']
  const suppliedFields = Object.keys(body)

  if (
    suppliedFields.length === 0 ||
    suppliedFields.some((field) => !allowedFields.includes(field))
  ) {
    res.status(400).json({
      error:
        'Provide at least one supported field: vin, make, model, model_year, status',
    })
    return
  }

  const updates: string[] = []
  const values: unknown[] = []

  if (Object.hasOwn(body, 'vin')) {
    if (typeof body.vin !== 'string') {
      res.status(400).json({ error: 'VIN must be a string' })
      return
    }

    const vin = body.vin.trim().toUpperCase()

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      res.status(400).json({
        error: 'VIN must contain 17 valid characters',
      })
      return
    }

    values.push(vin)
    updates.push(`vin = $${values.length}`)
  }

  for (const field of ['make', 'model'] as const) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== 'string') {
        res.status(400).json({ error: `${field} must be a string` })
        return
      }

      const value = body[field].trim()

      if (!value || value.length > 100) {
        res.status(400).json({
          error: `${field} must be between 1 and 100 characters`,
        })
        return
      }

      values.push(value)
      updates.push(`${field} = $${values.length}`)
    }
  }

  if (Object.hasOwn(body, 'model_year')) {
    if (
      !Number.isInteger(body.model_year) ||
      body.model_year < 1886 ||
      body.model_year > 2100
    ) {
      res.status(400).json({
        error: 'Model year must be an integer between 1886 and 2100',
      })
      return
    }

    values.push(body.model_year)
    updates.push(`model_year = $${values.length}`)
  }

  if (Object.hasOwn(body, 'status')) {
    if (!isValidStatus(body.status)) {
      res.status(400).json({
        error: 'Status must be active, sold or in_service',
      })
      return
    }

    values.push(body.status)
    updates.push(`status = $${values.length}`)
  }

  values.push(Number(req.params.id))

  try {
    const result = await pool.query(
      `UPDATE vehicles
       SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING ${VEHICLE_COLUMNS}`,
      values,
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vehicle not found' })
      return
    }

    res.json(result.rows[0])
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({
        error: 'A vehicle with this VIN already exists',
      })
      return
    }

    logError('Failed to update vehicle:', error)
    res.status(500).json({ error: 'Failed to update vehicle' })
  }
})

// Delete a vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ error: 'Invalid vehicle ID' })
    return
  }

  try {
    const result = await pool.query(
      `DELETE FROM vehicles
       WHERE id = $1
       RETURNING ${VEHICLE_COLUMNS}`,
      [Number(req.params.id)],
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vehicle not found' })
      return
    }

    res.json({
      message: 'Vehicle deleted successfully',
      vehicle: result.rows[0],
    })
  } catch (error) {
    logError('Failed to delete vehicle:', error)
    res.status(500).json({ error: 'Failed to delete vehicle' })
  }
})

// Handle malformed JSON bodies
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      error.type === 'entity.parse.failed'
    ) {
      res.status(400).json({ error: 'Invalid JSON request body' })
      return
    }

    next(error)
  },
)

export { app }

// Start the server only when executed directly.
const isMainModule = process.argv[1]
  ? import.meta.url === new URL(`file://${process.argv[1]}`).href
  : false

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`DataPulse API running at http://localhost:${PORT}`)
  })
}
