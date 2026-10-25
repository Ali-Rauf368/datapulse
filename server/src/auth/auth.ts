import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import { pool } from '../db.ts'

export type Role = 'admin' | 'operator' | 'viewer'

export type AuthUser = {
  id: string
  email?: string
  role: Role
  kind: 'user' | 'machine'
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthUser
  }
}

const JWT_ISSUER = 'datapulse-api'
const MAX_TOKEN_LENGTH = 4096

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters')
  }

  return secret
}

function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'operator' || value === 'viewer'
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function issueToken(user: AuthUser): string {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
      kind: user.kind,
    },
    getJwtSecret(),
    {
      subject: user.id,
      expiresIn: '8h',
      issuer: JWT_ISSUER,
      algorithm: 'HS256',
    },
  )
}

export async function login(
  email: string,
  password: string,
): Promise<{
  token: string
  user: { id: string; email: string; role: Role }
} | null> {
  const normalizedEmail = email?.trim().toLowerCase()

  if (
    !normalizedEmail ||
    normalizedEmail.length > 254 ||
    !password ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return null
  }

  const result = await pool.query(
    `SELECT id, email, password_hash, role
     FROM app_users
     WHERE lower(email) = $1 AND active = TRUE`,
    [normalizedEmail],
  )

  const user = result.rows[0]

  if (!user || !isRole(user.role)) {
    return null
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash,
  )

  if (!passwordMatches) {
    return null
  }

  const publicUser = {
    id: String(user.id),
    email: String(user.email),
    role: user.role,
  }

  return {
    user: publicUser,
    token: issueToken({ ...publicUser, kind: 'user' }),
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header('authorization')

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const token = header.slice(7).trim()

  if (!token || token.length > MAX_TOKEN_LENGTH) {
    res.status(401).json({ error: 'Invalid authentication token' })
    return
  }

  try {
    // Machine credentials are random secrets. Only their SHA-256 hashes
    // are stored in the database.
    const credential = await pool.query(
      `SELECT id, role
       FROM api_credentials
       WHERE token_hash = $1 AND active = TRUE`,
      [hashToken(token)],
    )

    if (credential.rowCount) {
      const row = credential.rows[0]

      if (!isRole(row.role)) {
        res.status(401).json({ error: 'Invalid authentication token' })
        return
      }

      req.auth = {
        id: String(row.id),
        role: row.role,
        kind: 'machine',
      }

      next()
      return
    }

    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: JWT_ISSUER,
      algorithms: ['HS256'],
    })

    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'string' ||
      decoded.kind !== 'user'
    ) {
      res.status(401).json({ error: 'Invalid authentication token' })
      return
    }

    // Check the database on every request so that deactivation and role
    // changes take effect without waiting for the JWT to expire.
    const activeUser = await pool.query(
      `SELECT id, email, role
       FROM app_users
       WHERE id = $1 AND active = TRUE`,
      [decoded.sub],
    )

    const user = activeUser.rows[0]

    if (!user || !isRole(user.role)) {
      res.status(401).json({
        error: 'Account is inactive or unavailable',
      })
      return
    }

    req.auth = {
      id: String(user.id),
      email: String(user.email),
      role: user.role,
      kind: 'user',
    }

    next()
  } catch {
    res.status(401).json({
      error: 'Invalid or expired authentication token',
    })
  }
}

export function requireRole(...allowed: Role[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (!allowed.includes(req.auth.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}

export function requireHuman(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.auth || req.auth.kind !== 'user') {
    res.status(403).json({
      error: 'A user account is required for this action',
    })
    return
  }

  next()
}

export async function createMachineCredential(
  name: string,
  role: Role = 'operator',
): Promise<string> {
  const normalizedName = name.trim()

  if (
    !normalizedName ||
    normalizedName.length > 100 ||
    !isRole(role)
  ) {
    throw new Error('A valid credential name and role are required')
  }

  const token = `dp_live_${randomBytes(32).toString('base64url')}`

  await pool.query(
    `INSERT INTO api_credentials (name, token_hash, role)
     VALUES ($1, $2, $3)`,
    [normalizedName, hashToken(token), role],
  )

  // Return the raw token once for secure provisioning.
  // Never store it in plaintext or write it to application logs.
  return token
}