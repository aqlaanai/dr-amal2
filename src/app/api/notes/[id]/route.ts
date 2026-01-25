import { NextRequest, NextResponse } from 'next/server';
import { getClinicalNoteService, UpdateClinicalNoteRequest } from '@/services/ClinicalNoteService';
import { getRequestContext } from '@/lib/auth-context';
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

/**
 * PUT /api/notes/[id] - Update a clinical note (draft only)
 * Issue 7: Rate limited to prevent spam
 * 
 * Authorization: providers only (own notes)
 * 
 * Body:
 * {
 *   "subjective": "string" (optional),
 *   "objective": "string" (optional),
 *   "assessment": "string" (optional),
 *   "plan": "string" (optional)
 * }
 * 
 * IMMUTABILITY: Can only update notes in draft state
 * Finalized and archived notes are immutable
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Get auth context
    const context = await getRequestContext(request);

    // Rate limiting (30 req/min per user)
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

    // Get note ID from params
    const { id: noteId } = await params;
    
    logger.info('Update clinical note request', {
      requestId,
      userId: context.userId,
      noteId,
      endpoint: 'PUT /api/notes/[id]'
    });

    // Parse request body
    const body: UpdateClinicalNoteRequest = await request.json();

    // Update clinical note
    const service = getClinicalNoteService();
    const note = await service.updateNote(noteId, body, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.notes_update.success');
    metrics.recordDuration('write.notes_update.duration', duration);
    logger.info('Clinical note updated', {
      requestId,
      noteId: note.id,
      duration,
      statusCode: 200
    });

    return NextResponse.json(note, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.notes_update.failure');
    logger.error('Update clinical note failed', {
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

      if (error.message.includes('Forbidden') || error.message.includes('Cannot edit')) {
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
