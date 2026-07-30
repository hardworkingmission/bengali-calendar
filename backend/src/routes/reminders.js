const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.use(requireAuth);

function toMysqlUtcDatetime(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

// GET /api/reminders -> all reminders for the signed-in user, across all dates
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, note_date, remind_at, message, sent FROM reminders WHERE user_id = ? ORDER BY remind_at",
      [req.user.id],
    );
    res.json({ reminders: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/reminders { date, remindAt, message }
// `remindAt` is an ISO datetime string already converted to UTC by the client.
router.post("/", async (req, res, next) => {
  try {
    const { date, remindAt, message } = req.body || {};
    if (!date || !DATE_RE.test(date)) {
      return res.status(400).json({ error: "তারিখের ফরম্যাট ভুল (invalid date format)" });
    }
    const mysqlDatetime = toMysqlUtcDatetime(remindAt);
    if (!mysqlDatetime) {
      return res.status(400).json({ error: "রিমাইন্ডারের সময় অবৈধ (invalid reminder time)" });
    }
    const text = (message || "").trim();
    if (!text) {
      return res.status(400).json({ error: "রিমাইন্ডারের বার্তা প্রয়োজন (reminder message required)" });
    }

    const [result] = await pool.query(
      "INSERT INTO reminders (user_id, note_date, remind_at, message) VALUES (?, ?, ?, ?)",
      [req.user.id, date, mysqlDatetime, text],
    );
    res.status(201).json({
      id: result.insertId,
      note_date: date,
      remind_at: mysqlDatetime,
      message: text,
      sent: 0,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM reminders WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
