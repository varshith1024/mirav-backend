// src/controllers/auth.controller.js
import  pool  from '../db/index.js';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import dotenv from 'dotenv';
dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// helper to strip sensitive fields
const sanitizeUser = (u) => {
  const { password_hash, ...user } = u;
  return user;
};

export const register = async (req, res) => {
  try {
    const { full_name, email, password, contact_number, profession, category } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'full_name, email and password are required' });
    }

    // check duplicate
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    // generate registration_id (human readable)
    const regId = 'TRUST-' + Math.random().toString(36).slice(2,8).toUpperCase();

    const insertQ = `INSERT INTO users (full_name, email, password_hash, contact_number, profession, category, registration_id, role_id, is_verified)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, full_name, email, registration_id, role_id, is_verified, created_at`;
    const values = [full_name, email.toLowerCase(), hashed, contact_number||null, profession||null, category||null, regId, 3, false];
    const { rows } = await pool.query(insertQ, values);
    const user = rows[0];

    // Issue tokens
    const accessToken = signAccessToken({ userId: user.id, roleId: user.role_id || 3 });
    const refreshToken = await signRefreshToken(user.id);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const { rows } = await pool.query('SELECT id, full_name, email, password_hash, role_id, is_verified FROM users WHERE email=$1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccessToken({ userId: user.id, roleId: user.role_id });
    const refreshToken = await signRefreshToken(user.id);

    res.json({
      user: { id: user.id, full_name: user.full_name, email: user.email, role_id: user.role_id, is_verified: user.is_verified },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const refreshToken = async (req, res) => {
  const client = await pool.connect();

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Refresh token required"
      });
    }

    // 1. Verify JWT signature + expiration
    const payload = await verifyRefreshToken(token);

    await client.query("BEGIN");

    // 2. Find the refresh token in DB
    const { rows } = await client.query(
      `SELECT user_id, expires_at
       FROM refresh_tokens
       WHERE token = $1
       FOR UPDATE`,
      [token]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        error: "Invalid refresh token"
      });
    }

    const storedToken = rows[0];

    // 3. Make sure token belongs to same user
    if (String(storedToken.user_id) !== String(payload.userId)) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        error: "Invalid refresh token"
      });
    }

    // 4. Check DB expiration
    if (new Date(storedToken.expires_at) <= new Date()) {
      await client.query(
        `DELETE FROM refresh_tokens
         WHERE token = $1`,
        [token]
      );

      await client.query("COMMIT");

      return res.status(401).json({
        error: "Refresh token expired"
      });
    }

    // 5. Get user's current role from DB
    const { rows: users } = await client.query(
      `SELECT id, role_id
       FROM users
       WHERE id = $1`,
      [payload.userId]
    );

    if (users.length === 0) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        error: "User not found"
      });
    }

    const user = users[0];

    // 6. Revoke OLD refresh token
    await client.query(
      `DELETE FROM refresh_tokens
       WHERE token = $1`,
      [token]
    );

    // 7. Create NEW access token WITH roleId
    const accessToken = signAccessToken({
      userId: user.id,
      roleId: user.role_id
    });

    // 8. Create NEW refresh token
    const refresh = await signRefreshToken(user.id, client);

    await client.query("COMMIT");

    // 9. Return new token pair
    return res.json({
      accessToken,
      refreshToken: refresh
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("refresh error", err);

    return res.status(401).json({
      error: "Invalid refresh token"
    });

  } finally {
    client.release();
  }
};
export const logout = async (req, res) => {
  try {
    const { token } = req.body; // client sends refresh token to revoke
    if (token) {
      await pool.query('DELETE FROM refresh_tokens WHERE token=$1', [token]);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('logout error', err);
    res.status(500).json({ error: 'Logout error' });
  }
};

export const me = async (req, res) => {
  try {
    // authenticate middleware sets req.user = { userId, roleId }
    const { userId } = req.user;
    const { rows } = await pool.query('SELECT id, full_name, email, contact_number, registration_id, role_id, is_verified, created_at FROM users WHERE id=$1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Simple placeholder for clicked email verification link
export const verifyEmail = async (req, res) => {
  // Example: /api/auth/verify-email?token=abc
  // For now, just return a success message — integrate with email provider later
  res.json({ message: 'This is a placeholder for email verification. Implement sending & verifying tokens via email provider (SendGrid, Nodemailer).' });
};
