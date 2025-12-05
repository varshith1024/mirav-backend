// src/routes/auth.routes.js
import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  me,
  verifyEmail
} from '../controllers/auth.controller.js';

import { authenticate } from '../middleware/auth.middleware.js';

import bcrypt from "bcrypt";
import pool from "../db/index.js";

// ✅ Import JWT utilities (YOU MISSED THIS)
import {
  signAccessToken,
  signRefreshToken
} from "../utils/jwt.js";

const router = express.Router();

// ======================
// ✅ Public Auth Routes
// ======================
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.get('/verify-email', verifyEmail);

// ======================
// ✅ Admin / Hospital Registration
// ======================
router.post("/admin-register", async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      confirmPassword,
      userType,
      registrationKey
    } = req.body;

    if (!userType || !registrationKey)
      return res.status(400).json({ error: "User type and registration key are required." });

    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match." });

    // ✅ Validate key based on user type
    if (
      (userType === "Admin" && registrationKey !== process.env.ADMIN_REG_KEY) ||
      (userType === "Hospital" && registrationKey !== process.env.HOSPITAL_REG_KEY)
    ) {
      return res.status(403).json({ error: "Invalid registration key." });
    }

    // ✅ Determine role
    const role_id = userType === "Admin" ? 1 : 2;

    // ✅ Check email exists
    const exist = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email.toLowerCase()]
    );

    if (exist.rows.length > 0)
      return res.status(409).json({ error: "Email already registered." });

    // ✅ Hash password
    const hashed = await bcrypt.hash(password, 10);

    // ✅ Generate registration ID
    const regId = "TRUST-" + Math.floor(Math.random() * 1000000);

    // ✅ Insert user into DB
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id, registration_id, is_verified)
       VALUES ($1,$2,$3,$4,$5,TRUE)
       RETURNING id, full_name, email, role_id, registration_id`,
      [full_name, email.toLowerCase(), hashed, role_id, regId]
    );

    const user = result.rows[0];

    // ✅ Generate tokens
    const accessToken = signAccessToken({ userId: user.id, roleId: user.role_id });
    const refreshToken = await signRefreshToken(user.id);

    // ✅ Response
    res.status(201).json({
      message: `${userType} registered successfully`,
      user,
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error("Admin Register Error:", err);
    res.status(500).json({ error: "Server error during admin/hospital registration" });
  }
});

export default router;
