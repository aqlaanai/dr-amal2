import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionService } from '@/services/PrescriptionService';
import { getRequestContext } from '@/lib/auth-context';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

/**
 * POST /api/prescriptions/[id]/issue - Issue a prescription (draft → issued)
 * 
 * Authorization: providers only (own prescriptions)
 * 
 * STATE TRANSITION: draft → issued
 * IRREVERSIBILITY: Once issued, the prescription is READ-ONLY FOREVER
 * 
 * No body required - this is a state transition
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Get auth context
    const context = await getRequestContext(request);

    // Get prescription ID from params
    const { id: prescriptionId } = await params;
    
    logger.info('Issue prescription request', {
      requestId,
      userId: context.userId,
      prescriptionId,
      endpoint: 'POST /api/prescriptions/[id]/issue'
    });

    // Issue prescription
    const service = getPrescriptionService();
    const prescription = await service.issuePrescription(prescriptionId, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.prescriptions_issue.success');
    metrics.recordDuration('write.prescriptions_issue.duration', duration);
    logger.info('Prescription issued', {
      requestId,
      prescriptionId: prescription.id,
      duration,
      statusCode: 200
    });

    return NextResponse.json(prescription, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.prescriptions_issue.failure');
    logger.error('Issue prescription failed', {
      requestId,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Forbidden') || error.message.includes('Cannot issue')) {
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

      if (error.message.includes('immutable') || error.message.includes('Invalid state')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict - state violation
        );
      }

      if (error.message.includes('incomplete')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 } // Bad request - validation failure
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
