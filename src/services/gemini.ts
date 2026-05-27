import { config } from '../config.js';
import { runVerification, type VerificationResult } from './geminiCore.js';
import { logError as persistError } from './logger.js';

export type { VerificationResult } from './geminiCore.js';

// Switched from gemini-3.1-pro-preview on 2026-05-27 after the model A/B eval:
// accuracy was a statistical tie (n=60), while 3.5-flash is ~30% faster and cheaper.
// See docs/superpowers/results/2026-05-27-eval-post-jsonfix.md.
const PRODUCTION_MODEL = 'gemini-3.5-flash';

export async function verifyReference(reference: string): Promise<VerificationResult> {
  const { result } = await runVerification({
    apiKey: config.geminiApiKey,
    model: PRODUCTION_MODEL,
    reference,
    logError: (entry) => { void persistError(entry); },
  });
  return result;
}
