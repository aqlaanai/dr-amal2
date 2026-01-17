/**
 * POST /api/auth/logout
 * Issue 1: Real Authentication
 * Issue 3: Backend Services Foundation
 * 
 * Invalidate refresh token (logout)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthService } from '@/services/AuthService'
import { verifyAccessToken } from '@/lib/jwt'
import { logger, generateRequestId } from '@/lib/logger'
import { metrics } from '@/lib/metrics'

const authService = getAuthService()

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    logger.info('Auth logout request', { requestId, endpoint: '/api/auth/logout', method: 'POST' });
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const accessToken = authHeader.substring(7)

    // Verify access token
    let payload
    try {
      payload = verifyAccessToken(accessToken)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Call AuthService to invalidate session
    await authService.logout(payload.userId)

    const duration = Date.now() - startTime;
    metrics.incrementCounter('auth.logout.success');
    metrics.recordDuration('auth.logout.duration', duration);
    logger.info('Auth logout success', { requestId, userId: payload.userId, duration });

    return NextResponse.json({
      message: 'Logged out successfully',
    })

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('auth.logout.failure');
    
    logger.error('Auth logout failed', { requestId, duration }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
