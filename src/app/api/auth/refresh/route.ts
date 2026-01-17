/**
 * POST /api/auth/refresh
 * Issue 1: Real Authentication
 * Issue 3: Backend Services Foundation
 * 
 * Refresh access token using refresh token
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthService } from '@/services/AuthService'
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit'
import { logger, generateRequestId } from '@/lib/logger'
import { metrics } from '@/lib/metrics'

const authService = getAuthService()

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Rate limiting (5 req/min per IP)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `auth:refresh:${clientIp}`;
    
    logger.info('Auth refresh request', { requestId, ip: clientIp, endpoint: '/api/auth/refresh', method: 'POST' });
    
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
          }
        }
      );
    }

    const body = await request.json()
    const { refreshToken } = body

    // Call AuthService
    const result = await authService.refresh({ refreshToken })

    const duration = Date.now() - startTime;
    metrics.incrementCounter('auth.refresh.success');
    metrics.recordDuration('auth.refresh.duration', duration);
    logger.info('Auth refresh success', { requestId, duration });

    return NextResponse.json(result)

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('auth.refresh.failure');
    metrics.recordDuration('auth.refresh.duration', duration);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    logger.error('Auth refresh failed', { requestId, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
    // Map specific errors to HTTP status codes
    if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
      return NextResponse.json({ error: errorMessage }, { status: 401 })
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
