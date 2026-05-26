import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VerificationResult {
  original: string;
  status: 'verified' | 'corrected' | 'hallucinated' | 'unknown';
  corrected?: string;
  notes?: string;
}

export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface RunResult {
  result: VerificationResult;
  latencyMs: number;
  usage?: TokenUsage;
}

export interface GenerateOutput { text: string; usage?: TokenUsage; }
export type GenerateFn = (args: { apiKey: string; model: string; prompt: string }) => Promise<GenerateOutput>;

export interface LogEntry {
  endpoint: string;
  errorType: 'gemini_parse_error' | 'gemini_quota' | 'gemini_network' | 'gemini_error';
  message: string;
  details?: Record<string, any>;
}
export type LogFn = (entry: LogEntry) => void;

const MAX_RETRIES = 3;

function minDelayMs(): number { return parseInt(process.env.GEMINI_MIN_DELAY_MS || '8000', 10); }
function initialBackoffMs(): number { return parseInt(process.env.GEMINI_BACKOFF_MS || '5000', 10); }

// Global rate limiter for Gemini API calls (shared across all calls in this process).
let lastCallTime = 0;
const pendingQueue: Array<{ resolve: () => void }> = [];
let processing = false;

async function acquireSlot(): Promise<void> {
  return new Promise<void>(resolve => { pendingQueue.push({ resolve }); processQueue(); });
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  while (pendingQueue.length > 0) {
    const elapsed = Date.now() - lastCallTime;
    const delay = minDelayMs();
    if (elapsed < delay) await sleep(delay - elapsed);
    lastCallTime = Date.now();
    const next = pendingQueue.shift();
    if (next) next.resolve();
  }
  processing = false;
}

export function isQuotaError(error: any): boolean {
  const msg = error?.message || '';
  return msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
}
export function isRecitationError(error: any): boolean {
  return (error?.message || '').includes('RECITATION');
}
export function isRetryableError(error: any): boolean {
  if (isQuotaError(error)) return true;
  if (isRecitationError(error)) return false;
  const msg = error?.message || '';
  return msg.includes('fetch failed') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT')
    || msg.includes('socket hang up') || msg.includes('503') || msg.includes('UNAVAILABLE');
}
export function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

export function buildPrompt(reference: string): string {
  return `
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
}

export function parseVerificationResponse(text: string, reference: string, logError?: LogFn): VerificationResult {
  let data: any;
  try {
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    data = JSON.parse(jsonString);
  } catch {
    logError?.({
      endpoint: 'gemini/verifyReference',
      errorType: 'gemini_parse_error',
      message: 'Failed to parse Gemini JSON response',
      details: { reference: reference.substring(0, 100), rawText: text.substring(0, 500) },
    });
    data = { status: 'unknown', corrected: '', notes: `Raw Response: ${text}` };
  }
  return { original: reference, status: data.status || 'unknown', corrected: data.corrected, notes: data.notes };
}

const defaultGenerate: GenerateFn = async ({ apiKey, model, prompt }) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model,
    // @ts-ignore - googleSearch is valid but types might be missing
    tools: [{ googleSearch: {} }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await m.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const um: any = (response as any).usageMetadata;
  const usage: TokenUsage | undefined = um ? {
    promptTokens: um.promptTokenCount ?? 0,
    candidatesTokens: um.candidatesTokenCount ?? 0,
    totalTokens: um.totalTokenCount ?? 0,
  } : undefined;
  return { text, usage };
};

export async function runVerification(opts: {
  apiKey: string; model: string; reference: string; logError?: LogFn; generate?: GenerateFn;
}): Promise<RunResult> {
  const { apiKey, model, reference, logError } = opts;
  const generate = opts.generate || defaultGenerate;
  await acquireSlot();
  const prompt = buildPrompt(reference);
  const started = Date.now();
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const out = await generate({ apiKey, model, prompt });
      const result = parseVerificationResponse(out.text, reference, logError);
      return { result, latencyMs: Date.now() - started, usage: out.usage };
    } catch (error: any) {
      lastError = error;
      if (isRecitationError(error)) {
        return {
          result: { original: reference, status: 'unknown', notes: 'This reference could not be verified because the AI flagged it as protected content. Please verify it manually.' },
          latencyMs: Date.now() - started,
        };
      }
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const backoff = initialBackoffMs() * Math.pow(2, attempt);
        console.warn(`Gemini error (${isQuotaError(error) ? 'quota' : 'network'}), retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(backoff);
        continue;
      }
      break;
    }
  }

  const quotaFailed = isQuotaError(lastError);
  const networkFailed = !quotaFailed && isRetryableError(lastError);
  logError?.({
    endpoint: 'gemini/verifyReference',
    errorType: quotaFailed ? 'gemini_quota' : networkFailed ? 'gemini_network' : 'gemini_error',
    message: lastError?.message || 'Unknown Gemini error',
    details: { reference: reference.substring(0, 100), retries: MAX_RETRIES },
  });

  let errorMessage = 'Error connecting to Gemini.';
  if (quotaFailed) errorMessage = 'Gemini API quota exhausted. Please try again later.';
  else if (networkFailed) errorMessage = 'Could not reach Gemini API after multiple attempts. Please try again.';
  else if (lastError?.message?.includes('403') || lastError?.message?.includes('PERMISSION_DENIED')) errorMessage = 'Gemini API permission denied.';
  else if (lastError?.message?.includes('404') || lastError?.message?.includes('NOT_FOUND')) errorMessage = 'Gemini model not found.';
  else errorMessage += ` Details: ${lastError?.message || JSON.stringify(lastError)}`;

  return { result: { original: reference, status: 'unknown', notes: errorMessage }, latencyMs: Date.now() - started };
}
