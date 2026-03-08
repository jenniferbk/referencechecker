import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  corsOrigin: process.env.CORS_ORIGIN || 'https://jenkleiman.com',
  adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  alertEmailTo: process.env.ALERT_EMAIL_TO || '',
};

// Validate required config on startup
const required = [
  'geminiApiKey',
  'supabaseUrl',
  'supabaseServiceRoleKey',
  'stripeSecretKey',
  'stripeWebhookSecret',
] as const;

for (const key of required) {
  if (!config[key]) {
    console.error(`Missing required env var for: ${key}`);
    process.exit(1);
  }
}
