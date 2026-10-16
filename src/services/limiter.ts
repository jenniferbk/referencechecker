// Caps how many Gemini calls run at once and spaces out their start times.
// Settings are read on every acquire so env changes (and tests) take effect immediately.
export interface LimiterSettings {
  maxConcurrent: () => number;
  minGapMs: () => number;
}

export interface Limiter {
  run<T>(fn: () => Promise<T>): Promise<T>;
  active(): number;
}

export function createLimiter(settings: LimiterSettings): Limiter {
  let active = 0;
  let lastStart = 0;
  const waiting: Array<() => void> = [];
  let pumping = false;

  async function pump(): Promise<void> {
    if (pumping) return;
    pumping = true;
    while (waiting.length > 0 && active < Math.max(1, settings.maxConcurrent())) {
      const gap = settings.minGapMs() - (Date.now() - lastStart);
      if (gap > 0) await new Promise(r => setTimeout(r, gap));
      lastStart = Date.now();
      active++;
      waiting.shift()!();
    }
    pumping = false;
  }

  return {
    async run<T>(fn: () => Promise<T>): Promise<T> {
      await new Promise<void>(resolve => {
        waiting.push(resolve);
        void pump();
      });
      try {
        return await fn();
      } finally {
        active--;
        void pump();
      }
    },
    active: () => active,
  };
}
