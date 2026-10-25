
import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../index.ts'
import { pool } from '../db.ts'

const testVin = `DP${Date.now().toString().padStart(15, '0').slice(-15)}`

let createdVehicleId: number | undefined

describe('DataPulse API', () => {
  afterAll(async () => {
    // Clean up the test record if a test failed before deleting it.
    if (createdVehicleId !== undefined) {
      await pool.query('DELETE FROM vehicles WHERE id = $1', [
        createdVehicleId,
      ])
    }

    await pool.end()
  })

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

  it('lists vehicles from the database', async () => {
    const response = await request(app).get('/api/vehicles')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })

  it('rejects an invalid vehicle status filter', async () => {
    const response = await request(app)
      .get('/api/vehicles')
      .query({ status: 'invalid_status' })

    expect(response.status).toBe(400)
  })

  it('rejects a vehicle with an invalid VIN', async () => {
    const response = await request(app)
      .post('/api/vehicles')
      .send({
        vin: 'INVALID',
        make: 'Honda',
        model: 'Accord',
        model_year: 2023,
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe(
      'VIN must contain 17 valid characters',
    )
  })

  it('rejects a vehicle with missing required fields', async () => {
    const response = await request(app)
      .post('/api/vehicles')
      .send({
        vin: '1HGCM82633A123456',
        make: 'Honda',
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe(
      'VIN, make, model and a valid model_year are required',
    )
  })

  it('creates, retrieves, searches, updates, and deletes a vehicle', async () => {
    expect(testVin).toHaveLength(17)

    // Create a vehicle.
    const createResponse = await request(app)
      .post('/api/vehicles')
      .send({
        vin: testVin,
        make: 'DataPulseTest',
        model: 'Integration',
        model_year: 2024,
        status: 'active',
      })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body).toHaveProperty('id')

    createdVehicleId = Number(createResponse.body.id)
    expect(Number.isSafeInteger(createdVehicleId)).toBe(true)

    // Retrieve the vehicle by ID.
    const getResponse = await request(app).get(
      `/api/vehicles/${createdVehicleId}`,
    )

    expect(getResponse.status).toBe(200)
    expect({
      ...getResponse.body,
      id: Number(getResponse.body.id),
    }).toMatchObject({
      id: createdVehicleId,
      vin: testVin,
      make: 'DataPulseTest',
      model: 'Integration',
      model_year: 2024,
      status: 'active',
    })

    // Search for the newly created vehicle.
    const searchResponse = await request(app)
      .get('/api/vehicles')
      .query({ search: 'DataPulseTest' })

    expect(searchResponse.status).toBe(200)
    expect(Array.isArray(searchResponse.body)).toBe(true)
    expect(
      searchResponse.body.some(
        (vehicle: { id: string | number }) =>
          Number(vehicle.id) === createdVehicleId,
      ),
    ).toBe(true)

    // Update the vehicle.
    const updateResponse = await request(app)
      .patch(`/api/vehicles/${createdVehicleId}`)
      .send({
        status: 'sold',
        model: 'IntegrationUpdated',
      })

    expect(updateResponse.status).toBe(200)
    expect({
      ...updateResponse.body,
      id: Number(updateResponse.body.id),
    }).toMatchObject({
      id: createdVehicleId,
      status: 'sold',
      model: 'IntegrationUpdated',
    })

    // Delete the vehicle.
    const deleteResponse = await request(app).delete(
      `/api/vehicles/${createdVehicleId}`,
    )

    expect(deleteResponse.status).toBe(200)

    // It has been deleted, so the cleanup hook no longer needs to remove it.
    createdVehicleId = undefined

    // Confirm the vehicle no longer exists.
    const missingResponse = await request(app).get(
      `/api/vehicles/${Number(createResponse.body.id)}`,
    )

    expect(missingResponse.status).toBe(404)
  })

  it('rejects an invalid vehicle ID', async () => {
    const response = await request(app).get('/api/vehicles/abc')

    expect(response.status).toBe(400)
  })

  it('returns 404 when updating a missing vehicle', async () => {
    const response = await request(app)
      .patch('/api/vehicles/999999999')
      .send({ status: 'sold' })

    expect(response.status).toBe(404)
  })

  it('rejects an unsupported update field', async () => {
    const response = await request(app)
      .patch('/api/vehicles/1')
      .send({ unsupported_field: 'value' })

    expect(response.status).toBe(400)
  })
})
