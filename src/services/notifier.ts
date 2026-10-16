import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { supabase } from '../lib/supabase.js';

// SMTP_HOST selects a transactional provider (e.g. smtp.resend.com, user "resend", pass = API key).
// Without it this falls back to Gmail, which Google may flag for automated sending.
const transporter = config.smtpUser
  ? nodemailer.createTransport(config.smtpHost
      ? {
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpPort === 465 || config.smtpPort === 2465, // implicit TLS; 587 uses STARTTLS
          auth: { user: config.smtpUser, pass: config.smtpPass },
        }
      : {
          service: 'gmail',
          auth: { user: config.smtpUser, pass: config.smtpPass },
        })
  : null;

async function lookupUserEmail(userId: string): Promise<string> {
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    return data?.user?.email || userId;
  } catch {
    return userId;
  }
}

export async function notifyError(entry: {
  userId?: string;
  endpoint: string;
  errorType: string;
  message: string;
  details?: Record<string, any>;
}): Promise<void> {
  if (!transporter || !config.alertEmailTo) return;

  try {
    const who = entry.userId
      ? await lookupUserEmail(entry.userId)
      : 'anonymous';

    const timestamp = new Date().toISOString();
    const detailsStr = entry.details
      ? JSON.stringify(entry.details, null, 2)
      : 'none';

    await transporter.sendMail({
      from: `"RefCheck Alerts" <${config.smtpFrom || config.smtpUser}>`,
      to: config.alertEmailTo,
      subject: `[RefCheck] ${entry.errorType}: ${entry.message.slice(0, 80)}`,
      text: [
        `Error Type:  ${entry.errorType}`,
        `Endpoint:    ${entry.endpoint}`,
        `User:        ${who}`,
        `Time:        ${timestamp}`,
        `Message:     ${entry.message}`,
        ``,
        `Details:`,
        detailsStr,
      ].join('\n'),
    });
  } catch (err) {
    console.error('Failed to send error notification email:', err);
  }
}
