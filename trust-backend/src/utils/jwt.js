import jwt from "jsonwebtoken";
import pool from "../db/index.js";

// =============================
// ✅ ACCESS TOKEN (15 minutes)
// =============================
export const signAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// =============================
// ✅ REFRESH TOKEN (7 days)
// =============================
export const signRefreshToken = async (userId) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [userId, token]
  );

  return token;
};

// =============================
// ✅ VERIFY ACCESS TOKEN
// =============================
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// =============================
// ✅ VERIFY REFRESH TOKEN
// =============================
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
