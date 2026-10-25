
import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../index.ts'
import { pool } from '../db.ts'

const makeTestVin = () =>
  `DP${Date.now().toString().padStart(15, '0').slice(-15)}`

const createdVehicleIds = new Set<number>()

function trackCreatedVehicle(id: unknown): number {
  const parsedId = Number(id)

  if (Number.isSafeInteger(parsedId) && parsedId > 0) {
    createdVehicleIds.add(parsedId)
  }

  return parsedId
}

function vehiclePayload(overrides: Record<string, unknown> = {}) {
  return {
    vin: makeTestVin(),
    make: 'DataPulseTest',
    model: 'Integration',
    model_year: 2024,
    status: 'active',
    ...overrides,
  }
}

describe('DataPulse API', () => {
  afterAll(async () => {
    try {
      if (createdVehicleIds.size > 0) {
        await pool.query(
          'DELETE FROM vehicles WHERE id = ANY($1::int[])',
          [[...createdVehicleIds]],
        )
      }
    } finally {
      await pool.end()
    }
  })

  describe('Health and database', () => {
    it('returns a healthy API status', async () => {
      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'DataPulse API',
      })
      expect(response.body.timestamp).toBeDefined()
    })

    it('confirms the database connection', async () => {
      const response = await request(app).get('/api/health/db')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        status: 'ok',
        database: 'datapulse',
        user: 'datapulse_user',
      })
    })

    it('returns vehicle statistics', async () => {
      const response = await request(app).get('/api/vehicles/stats')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('active')
      expect(response.body).toHaveProperty('sold')
      expect(response.body).toHaveProperty('in_service')
    })
  })

  describe('GET /api/vehicles', () => {
    it('returns a vehicle array', async () => {
      const response = await request(app).get('/api/vehicles')

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('filters vehicles by status', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .query({ status: 'active' })

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(
        response.body.every(
          (vehicle: { status: string }) => vehicle.status === 'active',
        ),
      ).toBe(true)
    })

    it('rejects an invalid status filter', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .query({ status: 'invalid_status' })

      expect(response.status).toBe(400)
    })

    it('searches for a matching vehicle', async () => {
      const payload = vehiclePayload({
        make: 'DataPulseSearchTest',
      })

      const created = await request(app)
        .post('/api/vehicles')
        .send(payload)

      expect(created.status).toBe(201)
      trackCreatedVehicle(created.body.id)

      const response = await request(app)
        .get('/api/vehicles')
        .query({ search: 'DataPulseSearchTest' })

      expect(response.status).toBe(200)
      expect(
        response.body.some(
          (vehicle: { vin: string }) => vehicle.vin === payload.vin,
        ),
      ).toBe(true)
    })
  })

  describe('POST /api/vehicles', () => {
    it('creates a vehicle with valid data', async () => {
      const payload = vehiclePayload()
      const response = await request(app)
        .post('/api/vehicles')
        .send(payload)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        vin: payload.vin,
        make: payload.make,
        model: payload.model,
        model_year: payload.model_year,
        status: payload.status,
      })

      trackCreatedVehicle(response.body.id)
    })

    it('rejects an invalid VIN', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send(vehiclePayload({ vin: 'INVALID' }))

      expect(response.status).toBe(400)
      expect(response.body.error).toBe(
        'VIN must contain 17 valid characters',
      )
    })

    it('rejects missing required fields', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send({
          vin: makeTestVin(),
          make: 'Honda',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe(
        'VIN, make, model and a valid model_year are required',
      )
    })

    it('rejects a model year below the supported range', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send(vehiclePayload({ model_year: 1800 }))

      expect(response.status).toBe(400)
    })

    it('rejects a model year above the supported range', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send(vehiclePayload({ model_year: 2200 }))

      expect(response.status).toBe(400)
    })

    it('rejects an invalid status', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send(vehiclePayload({ status: 'unknown' }))

      expect(response.status).toBe(400)
    })

    it('rejects a duplicate VIN', async () => {
      const payload = vehiclePayload()

      const firstResponse = await request(app)
        .post('/api/vehicles')
        .send(payload)

      expect(firstResponse.status).toBe(201)
      trackCreatedVehicle(firstResponse.body.id)

      const duplicateResponse = await request(app)
        .post('/api/vehicles')
        .send(payload)

      expect(duplicateResponse.status).toBe(409)
    })
  })

  describe('GET /api/vehicles/:id', () => {
    it('retrieves a vehicle by ID', async () => {
      const payload = vehiclePayload()

      const created = await request(app)
        .post('/api/vehicles')
        .send(payload)

      expect(created.status).toBe(201)
      const id = trackCreatedVehicle(created.body.id)

      const response = await request(app).get(`/api/vehicles/${id}`)

      expect(response.status).toBe(200)
      expect({
        ...response.body,
        id: Number(response.body.id),
      }).toMatchObject({
        id,
        vin: payload.vin,
        make: payload.make,
        model: payload.model,
      })
    })

    it('rejects a non-numeric ID', async () => {
      const response = await request(app).get('/api/vehicles/abc')

      expect(response.status).toBe(400)
    })

    it('returns 404 for a missing vehicle', async () => {
      const response = await request(app).get('/api/vehicles/999999999')

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/vehicles/:id', () => {
    it('updates a vehicle', async () => {
      const created = await request(app)
        .post('/api/vehicles')
        .send(vehiclePayload())

      expect(created.status).toBe(201)
      const id = trackCreatedVehicle(created.body.id)

      const response = await request(app)
        .patch(`/api/vehicles/${id}`)
        .send({
          status: 'sold',
          model: 'IntegrationUpdated',
        })

      expect(response.status).toBe(200)
      expect({
        ...response.body,
        id: Number(response.body.id),
      }).toMatchObject({
        id,
        status: 'sold',
        model: 'IntegrationUpdated',
      })
    })

    it('rejects an unsupported update field', async () => {
      const created = await request(app)
        .post('/api/vehicles')
        .send(vehiclePayload())

      expect(created.status).toBe(201)
      const id = trackCreatedVehicle(created.body.id)

      const response = await request(app)
        .patch(`/api/vehicles/${id}`)
        .send({ unsupported_field: 'value' })

      expect(response.status).toBe(400)
    })

    it('returns 404 when updating a missing vehicle', async () => {
      const response = await request(app)
        .patch('/api/vehicles/999999999')
        .send({ status: 'sold' })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/vehicles/:id', () => {
    it('deletes a vehicle', async () => {
      const created = await request(app)
        .post('/api/vehicles')
        .send(vehiclePayload())

      expect(created.status).toBe(201)
      const id = trackCreatedVehicle(created.body.id)

      const response = await request(app).delete(`/api/vehicles/${id}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')

      const missingResponse = await request(app).get(
        `/api/vehicles/${id}`,
      )

      expect(missingResponse.status).toBe(404)
      createdVehicleIds.delete(id)
    })

    it('returns 404 when deleting a missing vehicle', async () => {
      const response = await request(app).delete(
        '/api/vehicles/999999999',
      )

      expect(response.status).toBe(404)
    })
  })
})
