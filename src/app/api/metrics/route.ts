import { NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';
import { logger, generateRequestId } from '@/lib/logger';

/**
 * GET /api/metrics
 * 
 * Expose metrics for monitoring (Prometheus-compatible format)
 * 
 * Returns all collected metrics in JSON format
 * Production: Should be protected with auth or IP whitelist
 */
export async function GET() {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    logger.info('Get metrics request', { requestId, endpoint: '/api/metrics' });
    
    const allMetrics = metrics.getAll();

    const duration = Date.now() - startTime;
    logger.info('Get metrics success', { requestId, duration, metricCount: Object.keys(allMetrics).length });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics: allMetrics,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Metrics endpoint error', { 
      requestId, 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}
