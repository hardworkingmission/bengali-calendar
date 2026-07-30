const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.use(requireAuth);

// GET /api/notes -> { "2026-04-14": "note text", ... }
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT note_date, body FROM notes WHERE user_id = ? ORDER BY note_date",
      [req.user.id],
    );
    const notes = {};
    for (const row of rows) {
      notes[row.note_date] = row.body;
    }
    res.json({ notes });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:date  { text }  -- upserts, or deletes the row when text is blank
router.put("/:date", async (req, res, next) => {
  try {
    const { date } = req.params;
    const text = (req.body && req.body.text ? String(req.body.text) : "").trim();
    if (!DATE_RE.test(date)) {
      return res.status(400).json({ error: "তারিখের ফরম্যাট ভুল, YYYY-MM-DD প্রয়োজন (invalid date format)" });
    }

    if (!text) {
      await pool.query("DELETE FROM notes WHERE user_id = ? AND note_date = ?", [req.user.id, date]);
      return res.json({ date, text: "" });
    }

    await pool.query(
      "INSERT INTO notes (user_id, note_date, body) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE body = VALUES(body)",
      [req.user.id, date, text],
    );
    res.json({ date, text });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
