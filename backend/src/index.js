require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");
const pushRoutes = require("./routes/push");
const remindersRoutes = require("./routes/reminders");
const { startReminderCron } = require("./reminderCron");

const app = express();

// Next.js's dev CLI hops to the next free port (3000, 3001, 3002, ...) whenever
// another project is already bound to one, so allow any localhost port in dev
// rather than hard-coding a single one. Set FRONTEND_ORIGIN (comma-separated
// for multiple) to lock this down in production.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // curl/server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (isDev && /^http:\/\/localhost:\d+$/.test(origin))
        return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/reminders", remindersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .json({ error: "সার্ভারে একটি সমস্যা হয়েছে (internal server error)" });
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`Bangla calendar API listening on :${port}`);
  startReminderCron();
});
