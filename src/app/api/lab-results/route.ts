/**
 * GET /api/lab-results
 * Issue 4: Read-Only Feature APIs
 * 
 * Get paginated list of lab results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLabResultService } from '@/services/LabResultService';
import { getRequestContext } from '@/lib/auth-context';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

const labResultService = getLabResultService();

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    logger.info('Get lab results request', { requestId, userId: context.userId, endpoint: '/api/lab-results' });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Call service
    const result = await labResultService.getLabResults(context, { limit, offset });

    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.lab_results.success');
    metrics.recordDuration('read.lab_results.duration', duration);
    logger.info('Get lab results success', { requestId, userId: context.userId, count: result.data.length, duration });

    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.lab_results.failure');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Get lab results failed', { requestId, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
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
