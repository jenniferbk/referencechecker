import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { logError } from './logger.js';

export interface VerificationResult {
  original: string;
  status: 'verified' | 'corrected' | 'hallucinated' | 'unknown';
  corrected?: string;
  notes?: string;
}

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 5000;

// Global rate limiter for Gemini API calls.
// Search grounding likely counts as multiple requests against the quota,
// so we throttle conservatively. With a 25 RPM quota and grounding potentially
// using 3-5x multiplier, we limit to ~8 effective RPM (one call every 8 seconds).
const MIN_DELAY_MS = parseInt(process.env.GEMINI_MIN_DELAY_MS || '8000', 10);
let lastCallTime = 0;
const pendingQueue: Array<{ resolve: () => void }> = [];
let processing = false;

async function acquireSlot(): Promise<void> {
  return new Promise<void>(resolve => {
    pendingQueue.push({ resolve });
    processQueue();
  });
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  while (pendingQueue.length > 0) {
    const now = Date.now();
    const elapsed = now - lastCallTime;
    if (elapsed < MIN_DELAY_MS) {
      await sleep(MIN_DELAY_MS - elapsed);
    }
    lastCallTime = Date.now();
    const next = pendingQueue.shift();
    if (next) next.resolve();
  }

  processing = false;
}

function isQuotaError(error: any): boolean {
  const msg = error.message || '';
  return msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function verifyReference(reference: string): Promise<VerificationResult> {
  // Wait for our turn in the global rate limiter
  await acquireSlot();
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-preview',
    // @ts-ignore - googleSearch is valid but types might be missing
    tools: [{ googleSearch: {} }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
  You are an expert APA 7th Edition Reference Checker.
  Your goal is to verify if a given reference exists and is formatted correctly using Google Search.

  Reference to check: "${reference}"

  Instructions:
  1. Use Google Search to verify if this paper/book/source actually exists.
  2. If it does NOT exist (hallucinated), mark status as 'hallucinated'.
  3. If it DOES exist, check the APA 7th formatting.
     - If the user's input is perfect, mark status as 'verified'.
     - If there are errors (typos, punctuation, italics, missing info), mark status as 'corrected' and provide the fixed version.
  4. IMPORTANT: In the "corrected" field, use markdown formatting (*text*) for italics according to APA 7th Edition rules:
     - For journal articles: Italicize the journal title and volume number
     - For books: Italicize the book title
     - For chapters in edited books: Italicize the book title (NOT the chapter title)
     - For conference proceedings: Italicize the proceedings title

  Return ONLY a JSON object with this structure:
  {
    "status": "verified" | "corrected" | "hallucinated",
    "corrected": "The definitive APA 7th citation with *markdown italics* for proper formatting (if verified or corrected)",
    "notes": "Brief explanation of what was found or fixed."
  }
  `;

  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let data;
      try {
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        data = JSON.parse(jsonString);
      } catch {
        logError({
        endpoint: 'gemini/verifyReference',
        errorType: 'gemini_parse_error',
        message: 'Failed to parse Gemini JSON response',
        details: { reference: reference.substring(0, 100), rawText: text.substring(0, 500) },
      });
        data = {
          status: 'unknown',
          corrected: '',
          notes: `Raw Response: ${text}`,
        };
      }

      return {
        original: reference,
        status: data.status || 'unknown',
        corrected: data.corrected,
        notes: data.notes,
      };
    } catch (error: any) {
      lastError = error;

      // Retry on quota/rate limit errors with exponential backoff
      if (isQuotaError(error) && attempt < MAX_RETRIES) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(`Gemini quota hit, retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(backoff);
        continue;
      }

      // Non-retryable error or retries exhausted
      break;
    }
  }

  // All retries failed
  const quotaFailed = isQuotaError(lastError);
  logError({
    endpoint: 'gemini/verifyReference',
    errorType: quotaFailed ? 'gemini_quota' : 'gemini_error',
    message: lastError.message || 'Unknown Gemini error',
    details: { reference: reference.substring(0, 100), retries: MAX_RETRIES },
  });

  let errorMessage = 'Error connecting to Gemini.';
  if (quotaFailed) {
    errorMessage = 'Gemini API quota exhausted. Please try again later.';
  } else if (lastError.message?.includes('403') || lastError.message?.includes('PERMISSION_DENIED')) {
    errorMessage = 'Gemini API permission denied.';
  } else if (lastError.message?.includes('404') || lastError.message?.includes('NOT_FOUND')) {
    errorMessage = 'Gemini model not found.';
  } else {
    errorMessage += ` Details: ${lastError.message || JSON.stringify(lastError)}`;
  }

  return {
    original: reference,
    status: 'unknown',
    notes: errorMessage,
  };
}
