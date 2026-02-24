import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

export interface VerificationResult {
  original: string;
  status: 'verified' | 'corrected' | 'hallucinated' | 'unknown';
  corrected?: string;
  notes?: string;
}

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function verifyReference(reference: string): Promise<VerificationResult> {
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

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let data;
    try {
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(jsonString);
    } catch {
      console.warn('Failed to parse Gemini JSON response, falling back to unknown', text);
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
    console.error('Gemini verification failed', error);

    let errorMessage = 'Error connecting to Gemini.';
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'Gemini API quota exhausted. Please try again later.';
    } else if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = 'Gemini API permission denied.';
    } else if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
      errorMessage = 'Gemini model not found.';
    } else {
      errorMessage += ` Details: ${error.message || JSON.stringify(error)}`;
    }

    return {
      original: reference,
      status: 'unknown',
      notes: errorMessage,
    };
  }
}
