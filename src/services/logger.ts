import { supabase } from '../lib/supabase.js';

type ErrorType =
  | 'gemini_quota'
  | 'gemini_error'
  | 'gemini_parse_error'
  | 'credit_error'
  | 'stripe_error'
  | 'job_error'
  | 'auth_error'
  | 'unknown_error';

interface LogEntry {
  userId?: string;
  endpoint: string;
  errorType: ErrorType;
  message: string;
  details?: Record<string, any>;
}

export async function logError(entry: LogEntry): Promise<void> {
  // Always log to console for immediate visibility
  console.error(`[${entry.errorType}] ${entry.endpoint}: ${entry.message}`, entry.details || '');

  // Persist to database (fire-and-forget, don't block the request)
  try {
    await supabase.from('error_logs').insert({
      user_id: entry.userId || null,
      endpoint: entry.endpoint,
      error_type: entry.errorType,
      message: entry.message,
      details: entry.details || null,
    });
  } catch (err) {
    // If logging itself fails, just console it — don't crash
    console.error('Failed to persist error log:', err);
  }
}
