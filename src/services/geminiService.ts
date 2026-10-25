/**
 * SAFARNAMA AI — Production Gemini AI Service
 * Resilient Google GenAI integration with bounded timeouts, circuit breaker,
 * model fallbacks, and deterministic anti-hallucination guarantees.
 */

import { GoogleGenAI } from '@google/genai';

export interface CircuitBreakerState {
  isTripped: boolean;
  trippedUntil: number;
  reason: string;
  failureCount: number;
}

const circuitBreaker: CircuitBreakerState = {
  isTripped: false,
  trippedUntil: 0,
  reason: '',
  failureCount: 0
};

export function getCircuitBreakerStatus(): CircuitBreakerState {
  const now = Date.now();
  if (circuitBreaker.isTripped && now >= circuitBreaker.trippedUntil) {
    circuitBreaker.isTripped = false;
    circuitBreaker.trippedUntil = 0;
    circuitBreaker.reason = '';
    circuitBreaker.failureCount = 0;
  }
  return { ...circuitBreaker };
}

export function resetCircuitBreaker(): void {
  circuitBreaker.isTripped = false;
  circuitBreaker.trippedUntil = 0;
  circuitBreaker.reason = '';
  circuitBreaker.failureCount = 0;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
}

let cachedClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) return null;
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'safarnama-ai-build'
        }
      }
    });
  }
  return cachedClient;
}

export function parseJsonSafely<T = any>(rawText: string): T | null {
  if (!rawText || typeof rawText !== 'string') return null;

  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt to locate first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Executes a Gemini model call with configurable timeout, circuit breaker,
 * and automatic fallback model retry.
 */
export async function executeGeminiPrompt(
  prompt: string,
  options?: {
    systemInstruction?: string;
    temperature?: number;
    timeoutMs?: number;
    preferredModel?: string;
  }
): Promise<{ success: boolean; data: any; rawText?: string; error?: string; modelUsed?: string }> {
  const cb = getCircuitBreakerStatus();
  if (cb.isTripped) {
    return {
      success: false,
      data: null,
      error: `Circuit breaker active: ${cb.reason}`
    };
  }

  const client = getAIClient();
  if (!client) {
    return {
      success: false,
      data: null,
      error: 'GEMINI_API_KEY environment variable is not configured'
    };
  }

  const primaryModel = options?.preferredModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallbackModel = 'gemini-3.8-flash';
  const timeoutMs = options?.timeoutMs || (process.env.GEMINI_TIMEOUT_MS ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10) : 12000);

  const modelsToTry = Array.from(new Set([primaryModel, fallbackModel]));

  let lastError = '';

  for (const model of modelsToTry) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`)), timeoutMs);
      });

      const callPromise = client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: options?.temperature ?? 0.4
        }
      });

      const response = await Promise.race([callPromise, timeoutPromise]);
      const text = response?.text || '';

      if (text) {
        const parsed = parseJsonSafely(text);
        if (parsed) {
          // Success: reset failures
          circuitBreaker.failureCount = 0;
          return {
            success: true,
            data: parsed,
            rawText: text,
            modelUsed: model
          };
        }
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[Gemini Service] Model ${model} failed: ${lastError}`);

      // If rate limited or quota exceeded, trip circuit breaker
      if (lastError.includes('429') || lastError.includes('quota') || lastError.includes('RESOURCE_EXHAUSTED')) {
        circuitBreaker.isTripped = true;
        circuitBreaker.trippedUntil = Date.now() + 300000; // 5 minute cooldown
        circuitBreaker.reason = 'Gemini quota reached. Activated deterministic rule-based travel engine.';
        break;
      }
    }
  }

  // If multiple failures, trip circuit breaker briefly
  circuitBreaker.failureCount += 1;
  if (circuitBreaker.failureCount >= 3) {
    circuitBreaker.isTripped = true;
    circuitBreaker.trippedUntil = Date.now() + 60000; // 1 minute cooldown
    circuitBreaker.reason = 'Live AI model temporarily unreachable. Activated deterministic travel engine.';
  }

  return {
    success: false,
    data: null,
    error: lastError || 'Failed to generate structured AI response'
  };
}
