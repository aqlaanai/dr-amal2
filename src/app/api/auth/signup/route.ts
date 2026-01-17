/**
 * POST /api/auth/signup
 * Issue 1: Real Authentication
 * Issue 3: Backend Services Foundation
 * 
 * Create new user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthService } from '@/services/AuthService'
import { UserRole } from '@prisma/client'
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit'
import { validateEmail, validatePassword, ValidationError } from '@/lib/validation'
import { logger, generateRequestId } from '@/lib/logger'
import { metrics } from '@/lib/metrics'

const authService = getAuthService()

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Rate limiting (5 req/min per IP - prevent signup spam)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `auth:signup:${clientIp}`;
    
    logger.info('Auth signup request', { requestId, ip: clientIp, endpoint: '/api/auth/signup', method: 'POST' });
    
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
    const { email, password, role } = body

    // Validate inputs
    try {
      validateEmail(email);
      validatePassword(password);
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        return NextResponse.json({ error: validationError.message }, { status: 400 });
      }
      throw validationError;
    }

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call AuthService
    const result = await authService.signup({
      email,
      password,
      role: role as UserRole,
    })

    const duration = Date.now() - startTime;
    metrics.incrementCounter('auth.signup.success');
    metrics.recordDuration('auth.signup.duration', duration);
    logger.info('Auth signup success', { requestId, role, duration, statusCode: 201 });

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('auth.signup.failure');
    metrics.recordDuration('auth.signup.duration', duration);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    logger.error('Auth signup failed', { requestId, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
    // Map specific errors to HTTP status codes
    if (errorMessage.includes('already exists')) {
      return NextResponse.json({ error: errorMessage }, { status: 409 })
    }
    
    if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
