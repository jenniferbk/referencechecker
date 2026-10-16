import app from './app.js';
import { config } from './config.js';
import { supabase } from './lib/supabase.js';
import { scheduleRetention } from './services/retention.js';

app.listen(config.port, () => {
  console.log(`Reference Checker API running on port ${config.port}`);
  scheduleRetention(supabase);
});
