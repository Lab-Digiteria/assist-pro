/**
 * In-memory rate limiter for brute force protection.
 * Tracks failed attempts per key (e.g., IP or email).
 * Automatically cleans up expired entries every 5 minutes.
 */

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const store = new Map<string, AttemptRecord>();

// Config
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;       // 1 minute window
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes block after exceeding

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of Array.from(store.entries())) {
    const expired = record.blockedUntil
      ? now > record.blockedUntil
      : now - record.firstAttemptAt > WINDOW_MS;
    if (expired) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check if a key is currently rate limited.
 * Returns { allowed: true } or { allowed: false, retryAfterMs: number }
 */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record) return { allowed: true };

  // Currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    return { allowed: false, retryAfterMs: record.blockedUntil - now };
  }

  // Window expired — reset
  if (now - record.firstAttemptAt > WINDOW_MS) {
    store.delete(key);
    return { allowed: true };
  }

  // Within window but not yet blocked
  if (record.count >= MAX_ATTEMPTS) {
    const blockedUntil = now + BLOCK_DURATION_MS;
    store.set(key, { ...record, blockedUntil });
    return { allowed: false, retryAfterMs: BLOCK_DURATION_MS };
  }

  return { allowed: true };
}

/**
 * Record a failed attempt for a key.
 */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    store.set(key, { count: 1, firstAttemptAt: now });
  } else {
    store.set(key, { ...record, count: record.count + 1 });
  }
}

/**
 * Clear all attempts for a key (on successful login).
 */
export function clearAttempts(key: string): void {
  store.delete(key);
}
