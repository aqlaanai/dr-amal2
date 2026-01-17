/**
 * GET /api/patients
 * Issue 4: Read-Only Feature APIs
 * 
 * Get paginated list of patients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPatientService } from '@/services/PatientService';
import { getRequestContext } from '@/lib/auth-context';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    logger.info('Get patients request', { requestId, userId: context.userId, role: context.role, endpoint: '/api/patients' });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Initialize service
    const patientService = getPatientService();

    // Call service
    const result = await patientService.getPatients(context, { limit, offset });

    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.patients.success');
    metrics.recordDuration('read.patients.duration', duration);
    logger.info('Get patients success', { requestId, userId: context.userId, count: result.data.length, duration });

    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.patients.failure');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Get patients failed', { requestId, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
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
