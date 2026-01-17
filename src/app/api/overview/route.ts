/**
 * GET /api/overview
 * Issue 4: Read-Only Feature APIs
 * 
 * Get overview dashboard data with aggregated statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOverviewService } from '@/services/OverviewService';
import { getRequestContext } from '@/lib/auth-context';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

const overviewService = getOverviewService();

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    logger.info('Get overview request', { requestId, userId: context.userId, role: context.role, endpoint: '/api/overview' });

    // Call service
    const overview = await overviewService.getOverview(context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.overview.success');
    metrics.recordDuration('read.overview.duration', duration);
    logger.info('Get overview success', { requestId, userId: context.userId, duration });

    return NextResponse.json(overview);

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.overview.failure');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Get overview failed', { requestId, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
    // Map errors to HTTP status codes
    if (errorMessage.includes('No authorization token') || errorMessage.includes('Invalid or expired')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('insufficient permissions')) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
