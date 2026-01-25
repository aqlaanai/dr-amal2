/**
 * GET /api/patients
 * Issue 4: Read-Only Feature APIs
 * 
 * Get paginated list of patients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPatientService } from '@/services/PatientService';
import { getRequestContext, guardRouteAccess } from '@/lib/auth-context';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    // API Guard: Only providers and admins can list all patients
    guardRouteAccess(context, [UserRole.provider, UserRole.admin]);
    
    logger.info('Get patients request', { requestId, userId: context.userId, role: context.role, endpoint: '/api/patients' });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Initialize service
    const patientService = getPatientService();

    // Call service with context for tenant filtering
    const result = await patientService.getPatients(context, { limit, offset });

    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.patients.success');
    metrics.recordDuration('read.patients.duration', duration);
    logger.info('Get patients success', { requestId, userId: context.userId, count: result.patients.length, duration });

    // Return in standardized format
    return NextResponse.json({
      data: result.patients,
      pagination: {
        total: result.total,
        limit: limit || 50,
        offset: offset || 0,
        hasMore: (offset || 0) + (limit || 50) < result.total,
      },
    });

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

/**
 * POST /api/patients
 * Create a new patient
 * 
 * Authorization: providers and admins only
 * 
 * Body:
 * {
 *   "firstName": "string",
 *   "lastName": "string",
 *   "dateOfBirth": "string" (ISO format),
 *   "email": "string" (optional),
 *   "phone": "string" (optional),
 *   "address": "string" (optional),
 *   "emergencyContact": "string" (optional),
 *   "emergencyPhone": "string" (optional),
 *   "medicalRecordNumber": "string" (optional),
 *   "guardianEmail": "string" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    // API Guard: Only providers and admins can create patients
    guardRouteAccess(context, [UserRole.provider, UserRole.admin]);
    
    logger.info('Create patient request', { requestId, userId: context.userId, role: context.role, endpoint: 'POST /api/patients' });

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, dateOfBirth' },
        { status: 400 }
      );
    }

    // Initialize service
    const patientService = getPatientService();

    // Create patient
    const patient = await patientService.createPatient(body, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.patients.success');
    metrics.recordDuration('write.patients.duration', duration);
    logger.info('Create patient success', { requestId, userId: context.userId, patientId: patient.id, duration });

    // Return patient data directly (not wrapped in data object like GET)
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.patients.failure');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Create patient failed', { requestId, duration, error: errorMessage }, error instanceof Error ? error : undefined);
    
    // Map errors to HTTP status codes
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (errorMessage.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
    
    return NextResponse.json({ error: errorMessage || 'Internal server error' }, { status: 400 });
  }
}
