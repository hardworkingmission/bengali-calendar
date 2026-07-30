const cron = require("node-cron");
const pool = require("./db");
const webpush = require("./push");
const { sendReminderEmail } = require("./email");

async function dispatchDueReminders() {
  const [due] = await pool.query(
    `SELECT r.id, r.user_id, r.message, r.note_date, u.email
     FROM reminders r JOIN users u ON u.id = r.user_id
     WHERE r.sent = 0 AND r.remind_at <= UTC_TIMESTAMP()`,
  );
  if (!due.length) return;

  for (const reminder of due) {
    const [subs] = await pool.query(
      "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
      [reminder.user_id],
    );

    const payload = JSON.stringify({
      title: "বাংলা পঞ্জিকা — রিমাইন্ডার",
      body: reminder.message,
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          const result = await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          console.log(
            `Reminder ${reminder.id}: push accepted by ${new URL(sub.endpoint).host} (status ${result.statusCode})`,
          );
        } catch (err) {
          // 404/410 means the browser dropped this subscription; stop trying it.
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`Reminder ${reminder.id}: subscription ${sub.id} gone, removing.`);
            await pool.query("DELETE FROM push_subscriptions WHERE id = ?", [sub.id]);
          } else {
            console.error(`Reminder ${reminder.id}: push failed for subscription ${sub.id}:`, err.statusCode, err.body || err.message);
          }
        }
      }),
    );

    try {
      const result = await sendReminderEmail(reminder.email, reminder.message, reminder.note_date);
      console.log(`Reminder ${reminder.id}: email sent to ${reminder.email} (id ${result.data?.id})`);
    } catch (err) {
      console.error(`Reminder ${reminder.id}: email failed for ${reminder.email}:`, err.message);
    }

    await pool.query("UPDATE reminders SET sent = 1 WHERE id = ?", [reminder.id]);
  }
}

function startReminderCron() {
  cron.schedule("* * * * *", () => {
    dispatchDueReminders().catch((err) => console.error("Reminder dispatch failed:", err));
  });
  console.log("Reminder cron scheduled (every minute).");
}

module.exports = { startReminderCron, dispatchDueReminders };
