import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Admin client using service role key — bypasses RLS
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
