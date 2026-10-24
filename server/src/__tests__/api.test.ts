import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../index.ts'
import { pool } from '../db.ts'

describe('DataPulse API', () => {
  afterAll(async () => {
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
})
