/**
 * Rate Limiting Middleware
 * Issue 7: Hardening & Compliance
 * 
 * ABUSE PREVENTION:
 * - Auth endpoints: 5 req/min per IP (prevent brute force)
 * - Write endpoints: 30 req/min per user (prevent spam)
 * - AI endpoints: 10 req/min per user (prevent API abuse)
 * - Read endpoints: 100 req/min per user (normal usage)
 */

interface RateLimitStore {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limit store
 * Production: Use Redis for distributed rate limiting
 */
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
}

/**
 * Predefined rate limit tiers
 */
export const RateLimits = {
  AUTH: { windowMs: 60000, maxRequests: 5 },      // 5 req/min (brute force protection)
  WRITE: { windowMs: 60000, maxRequests: 30 },    // 30 req/min (spam protection)
  AI: { windowMs: 60000, maxRequests: 10 },       // 10 req/min (API cost control)
  READ: { windowMs: 60000, maxRequests: 100 },    // 100 req/min (normal usage)
} as const;

/**
 * Check if request exceeds rate limit
 * 
 * @param key - Rate limit key (IP for auth, userId for authenticated)
 * @param config - Rate limit configuration
 * @returns true if rate limit exceeded
 */
export function isRateLimited(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // No record or window expired - allow request
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return false;
  }

  // Increment count
  record.count++;

  // Check if limit exceeded
  if (record.count > config.maxRequests) {
    return true;
  }

  return false;
}

/**
 * Get rate limit info for headers
 */
export function getRateLimitInfo(key: string, config: RateLimitConfig): {
  limit: number;
  remaining: number;
  reset: number;
} {
  const record = rateLimitStore.get(key);
  const now = Date.now();

  if (!record || now > record.resetAt) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: Math.floor((now + config.windowMs) / 1000),
    };
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    reset: Math.floor(record.resetAt / 1000),
  };
}

/**
 * Clean up expired rate limit records (periodic cleanup)
 * Production: Use Redis TTL instead
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
const cleanupInterval = setInterval(cleanupRateLimits, 5 * 60 * 1000);
// Allow Jest to exit even if this interval is running
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}
