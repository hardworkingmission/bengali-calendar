const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.REMINDER_FROM_EMAIL || "Bangla Calendar <onboarding@resend.dev>";

async function sendReminderEmail(to, message, noteDate) {
  if (!resend) throw new Error("RESEND_API_KEY not configured");

  // The Resend SDK resolves with { data, error } instead of throwing on API-level failures.
  const result = await resend.emails.send({
    from: FROM,
    to,
    subject: "রিমাইন্ডার — বাংলা পঞ্জিকা",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e3ded0; border-radius: 10px;">
        <h2 style="margin: 0 0 4px; color: #16231f;">রিমাইন্ডার</h2>
        <p style="margin: 0 0 16px; color: #6b7a74; font-size: 13px;">তারিখ: ${noteDate}</p>
        <p style="margin: 0; font-size: 16px; color: #16231f;">${message}</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(`${result.error.name || "ResendError"}: ${result.error.message}`);
  }
  return result;
}

module.exports = { sendReminderEmail };
