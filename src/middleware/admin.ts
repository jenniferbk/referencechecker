import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { config } from '../config.js';

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  // Must already be authenticated (run authMiddleware first)
  if (!req.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', req.userId)
      .single();

    if (!profile || !config.adminEmails.includes(profile.email)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  } catch {
    res.status(403).json({ error: 'Forbidden' });
  }
}
