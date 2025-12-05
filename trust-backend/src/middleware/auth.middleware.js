// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Missing authorization header' });
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    // payload expected to include userId and optionally roleId
    req.user = { userId: payload.userId || payload.userId, roleId: payload.roleId || payload.roleId };
    next();
  } catch (err) {
    console.error('auth error', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
