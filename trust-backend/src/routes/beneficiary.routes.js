import express from "express";
import pool from "../db/index.js";

const router = express.Router();

router.post("/submit", async (req, res) => {
  try {
    const {
      fullName, dob, gender, aadhaar,
      email, phone,
      address, city, state, pincode,
      category,
      landSize, cropType,
      institution, course,
      incomeCertificateNo,
      landDocumentNo,
      studentIdNo
    } = req.body;

    await pool.query(
      `INSERT INTO beneficiaries (
        full_name, dob, gender, aadhaar,
        email, phone,
        address, city, state, pincode,
        category,
        land_size, crop_type,
        institution, course,
        income_certificate_no,
        land_document_no,
        student_id_no
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,
        $7,$8,$9,$10,
        $11,
        $12,$13,
        $14,$15,
        $16,$17,$18
      )`,
      [
        fullName, dob, gender, aadhaar,
        email, phone,
        address, city, state, pincode,
        category,
        landSize || null, cropType || null,
        institution || null, course || null,
        incomeCertificateNo,
        landDocumentNo || null,
        studentIdNo || null
      ]
    );

    res.status(201).json({ message: "Registration submitted successfully" });

  } catch (err) {
    console.error("Beneficiary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
