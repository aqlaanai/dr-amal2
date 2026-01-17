/**
 * GET /api/lab-results/[id]
 * Issue 4: Read-Only Feature APIs
 * 
 * Get lab result by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLabResultService } from '@/services/LabResultService';
import { getRequestContext } from '@/lib/auth-context';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    logger.info('Get lab result request', { requestId, userId: context.userId, labResultId: params.id, endpoint: '/api/lab-results/[id]' });

    // Get lab result ID from params
    const labResultId = params.id;

    // Initialize service
    const labResultService = getLabResultService();

    // Call service
    const labResult = await labResultService.getLabResultById(labResultId, context);

    if (!labResult) {
      const duration = Date.now() - startTime;
      metrics.incrementCounter('read.lab_result.failure');
      logger.warn('Lab result not found', { requestId, labResultId, duration });
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.lab_result.success');
    metrics.recordDuration('read.lab_result.duration', duration);
    logger.info('Get lab result success', { requestId, labResultId, duration });

    return NextResponse.json(labResult);

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.lab_result.failure');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Get lab result failed', { requestId, labResultId: params.id, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
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
