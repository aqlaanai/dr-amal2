/**
 * GET /api/patients/[id]
 * Issue 4: Read-Only Feature APIs
 * 
 * Get patient by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPatientService } from '@/services/PatientService';
import { getRequestContext, guardRecordAccess } from '@/lib/auth-context';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { UserRole } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    logger.info('Get patient request', { requestId, userId: context.userId, patientId: params.id, endpoint: '/api/patients/[id]' });

    // Get patient ID from params
    const patientId = params.id;

    // Initialize service
    const patientService = getPatientService();

    // Call service to get patient (this already applies tenant filtering)
    const patient = await patientService.getPatientById(patientId, context);

    if (!patient) {
      const duration = Date.now() - startTime;
      metrics.incrementCounter('read.patient.failure');
      logger.warn('Patient not found', { requestId, patientId, duration });
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // API Guard: Only providers and admins can access individual patient records
    guardRecordAccess(context, [UserRole.provider, UserRole.admin], patient.id);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.patient.success');
    metrics.recordDuration('read.patient.duration', duration);
    logger.info('Get patient success', { requestId, patientId, duration });

    return NextResponse.json(patient);

  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.patient.failure');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Get patient failed', { requestId, patientId: params.id, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
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
