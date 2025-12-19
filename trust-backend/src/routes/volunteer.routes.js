import express from "express";
import pool from "../db/index.js";
import puppeteer from "puppeteer";

const router = express.Router();

/* =================================
   UTILITY: Generate Volunteer ID
================================= */
function generateVolunteerId(id) {
  return `SECT-VOL-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
}

/* =================================
   1️⃣ SUBMIT VOLUNTEER FORM
================================= */
router.post("/submit-volunteer", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      occupation,
      interests,
      availability,
      skills
    } = req.body;

    if (!fullName || !email || !phone || !availability) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // Insert volunteer
    const result = await pool.query(
      `INSERT INTO volunteers
       (full_name, email, phone, occupation, interests, availability, skills)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [fullName, email, phone, occupation, interests, availability, skills]
    );

    const dbId = result.rows[0].id;
    const volunteerId = generateVolunteerId(dbId);

    // Store FULL ID in DB
    await pool.query(
      `UPDATE volunteers SET volunteer_id=$1 WHERE id=$2`,
      [volunteerId, dbId]
    );

    res.status(201).json({
      success: true,
      volunteer_id: volunteerId, // frontend will shorten
      message: "Volunteer registered successfully"
    });

  } catch (err) {
    console.error("Volunteer submit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =================================
   2️⃣ DOWNLOAD VIRTUAL ID (PDF)
================================= */
router.get("/id-card/:volunteerId", async (req, res) => {
  try {
    const { volunteerId } = req.params;

    const result = await pool.query(
      "SELECT * FROM volunteers WHERE volunteer_id=$1",
      [volunteerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    const v = result.rows[0];

    // ✅ SHORT ID FOR DISPLAY ONLY
    const shortId = v.volunteer_id.split("-").pop();

    // 🔹 HTML MATCHING FRONTEND CARD EXACTLY
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="flex items-center justify-center min-h-screen bg-white">
      <div class="w-80 bg-white rounded-xl shadow-lg border-2 border-amber-700 overflow-hidden">
        
        <!-- Header -->
        <div class="bg-green-100 py-3 px-3 flex items-center gap-3">
          <div class="w-14 h-14">
            <img src="https://mirav-nu.vercel.app/logo.png" class="w-full h-full object-contain"/>
          </div>
          <div>
            <h2 class="text-amber-800 text-base font-semibold leading-tight">
              Sri Ekadanta Charitable Trust
            </h2>
            <p class="text-green-700 text-sm">
              Volunteer Identification Card
            </p>
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 flex flex-col items-center">
          <img
            src="${v.photo_url || "https://via.placeholder.com/120"}"
            class="w-28 h-28 rounded-full border-4 border-stone-600 mb-3 object-cover"
          />

          <h3 class="text-lg font-semibold text-stone-700">
            ${v.full_name}
          </h3>

          <p class="text-sm text-gray-500 mb-3">
            ID: ${shortId}
          </p>

          <div class="text-sm text-gray-700 w-full space-y-1">
            <p><strong>Email:</strong> ${v.email}</p>
            <p><strong>Phone:</strong> ${v.phone}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-100 text-center py-2 text-xs text-gray-600">
          Authorized Volunteer • Trust Verified
        </div>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    const pdf = await page.pdf({
      format: "A6",
      printBackground: true
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${shortId}.pdf`
    );

    res.send(pdf);

  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: "Failed to generate ID card" });
  }
});

export default router;
