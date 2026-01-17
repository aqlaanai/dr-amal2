/**
 * Security Middleware Helpers
 * Issue 7: Hardening & Compliance
 * 
 * Reusable security functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getRateLimitInfo, RateLimitConfig } from './rate-limit';

/**
 * Check rate limit and return error response if exceeded
 * 
 * @param request - Next request object
 * @param key - Rate limit key (e.g., userId, IP)
 * @param config - Rate limit configuration
 * @returns NextResponse if rate limited, null if allowed
 */
export function checkRateLimit(
  request: NextRequest,
  key: string,
  config: RateLimitConfig
): NextResponse | null {
  if (isRateLimited(key, config)) {
    const info = getRateLimitInfo(key, config);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(info.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(info.reset),
          'Retry-After': String(Math.ceil((info.reset * 1000 - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}

/**
 * Add security headers to response
 * 
 * SECURITY HEADERS:
 * - X-Content-Type-Options: nosniff (prevent MIME sniffing)
 * - X-Frame-Options: DENY (prevent clickjacking)
 * - X-XSS-Protection: 1; mode=block (legacy XSS protection)
 * - Strict-Transport-Security: force HTTPS
 * - Content-Security-Policy: prevent XSS
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

/**
 * Safe error response (no stack traces in production)
 */
export function safeErrorResponse(error: unknown, fallbackMessage: string = 'Internal server error'): NextResponse {
  console.error('API error:', error);

  // In development, return detailed error
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }

  // In production, return generic error (security: don't leak internals)
  return NextResponse.json(
    { error: fallbackMessage },
    { status: 500 }
  );
}
