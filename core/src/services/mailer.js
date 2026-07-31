import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (env.otp.gmailUser && env.otp.gmailAppPassword) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.otp.gmailUser, pass: env.otp.gmailAppPassword },
    });
  }
  return transporter;
}

/**
 * Send an email via Gmail SMTP. In dev, if no Gmail App Password is
 * configured, the email is logged to the console instead (so the app is
 * fully runnable without credentials) and `{ delivered:false }` is returned.
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    logger.warn(`[mailer] SMTP not configured — email to ${to} NOT sent. Subject: "${subject}"`);
    logger.info(`[mailer:dev] ${text || subject}`);
    return { delivered: false };
  }
  await t.sendMail({
    from: `"${env.otp.fromName}" <${env.otp.gmailUser}>`,
    to,
    subject,
    text,
    html,
  });
  return { delivered: true };
}
