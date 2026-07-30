const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "একটি বৈধ ইমেইল দিন (invalid email)" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (password must be at least 6 characters)" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ error: "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে (email already registered)" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
      email,
      passwordHash,
    ]);

    const user = { id: result.insertId, email };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "ইমেইল ও পাসওয়ার্ড দিন (email and password required)" });
    }

    const [rows] = await pool.query("SELECT id, email, password_hash FROM users WHERE email = ?", [email]);
    if (!rows.length) {
      return res.status(401).json({ error: "ভুল ইমেইল অথবা পাসওয়ার্ড (invalid email or password)" });
    }

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: "ভুল ইমেইল অথবা পাসওয়ার্ড (invalid email or password)" });
    }

    const user = { id: rows[0].id, email: rows[0].email };
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
