import nodemailer from "nodemailer";

/**
 * Sends a generic email using SMTP configuration.
 * Logs a warning if SMTP configuration is missing, avoiding application crashes.
 */
export async function sendEmail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const passRaw = process.env.SMTP_PASS;
  const pass = typeof passRaw === "string" ? passRaw.replace(/\s+/g, "") : passRaw;
  const from = process.env.MAIL_FROM;

  if (!host || !user || !pass || !from) {
    console.warn("SMTP configuration missing in .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM). Skipping email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
  }
}