/**
 * POST /api/auth/signin
 * Issue 1: Real Authentication
 * Issue 3: Backend Services Foundation
 * Issue 7: Hardening & Compliance
 * 
 * Authenticate user and issue tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthService } from '@/services/AuthService'
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit'
import { validateEmail, ValidationError } from '@/lib/validation'
import { logger, generateRequestId } from '@/lib/logger'
import { metrics } from '@/lib/metrics'

const authService = getAuthService()

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Rate limiting (5 req/min per IP - brute force protection)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `auth:signin:${clientIp}`;
    
    logger.info('Auth signin request', { requestId, ip: clientIp, endpoint: '/api/auth/signin', method: 'POST' });
    
    if (isRateLimited(rateLimitKey, RateLimits.AUTH)) {
      const info = getRateLimitInfo(rateLimitKey, RateLimits.AUTH);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(info.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(info.reset),
            'Retry-After': String(Math.ceil((info.reset * 1000 - Date.now()) / 1000)),
          }
        }
      );
    }

    const body = await request.json()
    const { email, password } = body

    // Validate inputs
    try {
      validateEmail(email);
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        return NextResponse.json({ error: validationError.message }, { status: 400 });
      }
      throw validationError;
    }

    // Call AuthService
    const result = await authService.signin({ email, password })

    const duration = Date.now() - startTime;
    metrics.incrementCounter('auth.signin.success');
    metrics.recordDuration('auth.signin.duration', duration);
    logger.info('Auth signin success', { requestId, userId: result.user.id, role: result.user.role, duration });

    return NextResponse.json(result)

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('auth.signin.failure');
    metrics.recordDuration('auth.signin.duration', duration);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    logger.error('Auth signin failed', { requestId, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
    // Map specific errors to HTTP status codes
    if (errorMessage.includes('Invalid credentials')) {
      return NextResponse.json({ error: errorMessage }, { status: 401 })
    }
    
    if (errorMessage.includes('locked') || errorMessage.includes('pending')) {
      return NextResponse.json({ error: errorMessage }, { status: 403 })
    }
    
    if (errorMessage.includes('required')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
