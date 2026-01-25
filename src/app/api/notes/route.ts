import { NextRequest, NextResponse } from 'next/server';
import { getClinicalNoteService, CreateClinicalNoteRequest } from '@/services/ClinicalNoteService';
import { getRequestContext, guardRouteAccess } from '@/lib/auth-context';
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { getPrisma } from '@/repositories/BaseRepository';
import { UserRole } from '@prisma/client';

/**
 * GET /api/notes
 * Get paginated list of clinical notes
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    // API Guard: Only providers and admins can list clinical notes
    guardRouteAccess(context, [UserRole.provider, UserRole.admin]);
    
    logger.info('Get clinical notes request', { requestId, userId: context.userId, role: context.role, endpoint: '/api/notes' });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Initialize service
    const service = getClinicalNoteService();

    // Call service with context for tenant filtering
    const result = await service.getNotes(context, { limit, offset });

    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.notes.success');
    metrics.recordDuration('read.notes.duration', duration);
    logger.info('Get clinical notes success', { requestId, userId: context.userId, count: result.notes.length, duration });

    // Return in standardized format
    return NextResponse.json({
      data: result.notes,
      pagination: {
        total: result.total,
        limit: limit || 50,
        offset: offset || 0,
        hasMore: (offset || 0) + (limit || 50) < result.total,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('read.notes.failure');
    logger.error('Get clinical notes failed', { requestId, duration }, error instanceof Error ? error : undefined);

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
 * POST /api/notes - Create a new clinical note (draft)
 * Issue 7: Rate limited to prevent spam
 * 
 * Authorization: providers only
 * 
 * Body:
 * {
 *   "patientId": "string",
 *   "sessionId": "string" (optional),
 *   "subjective": "string" (optional),
 *   "objective": "string" (optional),
 *   "assessment": "string" (optional),
 *   "plan": "string" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Get auth context
    const context = await getRequestContext(request);
    
    // API Guard: Only providers can create clinical notes
    guardRouteAccess(context, [UserRole.provider]);
    
    logger.info('Create clinical note request', {
      requestId,
      userId: context.userId,
      endpoint: 'POST /api/notes'
    });

    // Rate limiting (30 req/min per user - prevent spam)
    const rateLimitKey = `write:notes:${context.userId}`;
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
    const body: CreateClinicalNoteRequest = await request.json();

    // Validate required fields
    if (!body.patientId) {
      return NextResponse.json(
        { error: 'Missing required field: patientId' },
        { status: 400 }
      );
    }

    // Create clinical note
    const service = getClinicalNoteService();
    const note = await service.createNote(body, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.notes.success');
    metrics.recordDuration('write.notes.duration', duration);
    logger.info('Clinical note created', {
      requestId,
      noteId: note.id,
      duration,
      statusCode: 201
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.notes.failure');
    logger.error('Create clinical note failed', {
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
