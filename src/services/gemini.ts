import { config } from '../config.js';
import { runVerification, type VerificationResult } from './geminiCore.js';
import { logError as persistError } from './logger.js';

export type { VerificationResult } from './geminiCore.js';

const PRODUCTION_MODEL = 'gemini-3.1-pro-preview';

export async function verifyReference(reference: string): Promise<VerificationResult> {
  const { result } = await runVerification({
    apiKey: config.geminiApiKey,
    model: PRODUCTION_MODEL,
    reference,
    logError: (entry) => { void persistError(entry); },
  });
  return result;
}
