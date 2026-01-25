import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionService, CreatePrescriptionRequest } from '@/services/PrescriptionService';
import { getRequestContext, guardRouteAccess } from '@/lib/auth-context';
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { getPrisma } from '@/repositories/BaseRepository';
import { UserRole } from '@prisma/client';

/**
 * GET /api/prescriptions
 * Get paginated list of prescriptions
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    // API Guard: Only providers and admins can list prescriptions
    guardRouteAccess(context, [UserRole.provider, UserRole.admin]);
    
    logger.info('Get prescriptions request', { requestId, userId: context.userId, role: context.role, endpoint: '/api/prescriptions' });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Initialize Prisma
    const prisma = getPrisma();

    // Fetch prescriptions with tenant isolation
    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: {
          tenantId: context.tenantId  // ← TENANT ISOLATION
        },
        include: { patient: true, provider: true },
        orderBy: { createdAt: 'desc' },
        take: limit || 50,
        skip: offset || 0
      }),
      prisma.prescription.count({
        where: {
          tenantId: context.tenantId  // ← TENANT ISOLATION
        }
      })
    ]);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.prescriptions.success');
    metrics.recordDuration('read.prescriptions.duration', duration);
    logger.info('Get prescriptions success', { requestId, userId: context.userId, count: prescriptions.length, duration });

    // Return in standardized format
    return NextResponse.json({
      data: prescriptions,
      pagination: {
        total,
        limit: limit || 50,
        offset: offset || 0,
        hasMore: (offset || 0) + (limit || 50) < total,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.prescriptions.failure');
    logger.error('Get prescriptions failed', { requestId, duration }, error instanceof Error ? error : undefined);

    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired access token')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }

      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

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
      if (error.message.includes('Invalid or expired access token')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }

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
