import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionService, CreatePrescriptionRequest } from '@/services/PrescriptionService';
import { getRequestContext } from '@/lib/auth-context';
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

/**
 * POST /api/prescriptions - Create a new prescription (draft)
 * Issue 7: Rate limited to prevent spam
 * 
 * Authorization: providers only
 * 
 * Body:
 * {
 *   "patientId": "string",
 *   "medication": "string",
 *   "dosage": "string",
 *   "duration": "string",
 *   "instructions": "string" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Get auth context
    const context = await getRequestContext(request);
    
    logger.info('Create prescription request', {
      requestId,
      userId: context.userId,
      endpoint: 'POST /api/prescriptions'
    });

    // Rate limiting (30 req/min per user)
    const rateLimitKey = `write:prescriptions:${context.userId}`;
    if (isRateLimited(rateLimitKey, RateLimits.WRITE)) {
      const info = getRateLimitInfo(rateLimitKey, RateLimits.WRITE);
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

    // Parse request body
    const body: CreatePrescriptionRequest = await request.json();

    // Validate required fields
    if (!body.patientId) {
      return NextResponse.json(
        { error: 'Missing required field: patientId' },
        { status: 400 }
      );
    }

    if (!body.medication) {
      return NextResponse.json(
        { error: 'Missing required field: medication' },
        { status: 400 }
      );
    }

    if (!body.dosage) {
      return NextResponse.json(
        { error: 'Missing required field: dosage' },
        { status: 400 }
      );
    }

    if (!body.duration) {
      return NextResponse.json(
        { error: 'Missing required field: duration' },
        { status: 400 }
      );
    }

    // Create prescription
    const service = getPrescriptionService();
    const prescription = await service.createPrescription(body, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.prescriptions.success');
    metrics.recordDuration('write.prescriptions.duration', duration);
    logger.info('Prescription created', {
      requestId,
      prescriptionId: prescription.id,
      duration,
      statusCode: 201
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.prescriptions.failure');
    logger.error('Create prescription failed', {
      requestId,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Generic error
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
