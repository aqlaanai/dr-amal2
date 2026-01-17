import { NextRequest, NextResponse } from 'next/server';
import { getClinicalNoteService } from '@/services/ClinicalNoteService';
import { getRequestContext } from '@/lib/auth-context';
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

/**
 * POST /api/notes/[id]/finalize - Finalize a clinical note (draft → finalized)
 * Issue 7: Rate limited to prevent spam
 * 
 * Authorization: providers only (own notes)
 * 
 * STATE TRANSITION: draft → finalized
 * IRREVERSIBILITY: Once finalized, the note is READ-ONLY FOREVER
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
    
    logger.info('Finalize clinical note request', {
      requestId,
      userId: context.userId,
      noteId,
      endpoint: 'POST /api/notes/[id]/finalize'
    });

    // Finalize clinical note
    const service = getClinicalNoteService();
    const note = await service.finalizeNote(noteId, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.notes_finalize.success');
    metrics.recordDuration('write.notes_finalize.duration', duration);
    logger.info('Clinical note finalized', {
      requestId,
      noteId: note.id,
      duration,
      statusCode: 200
    });

    return NextResponse.json(note, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.notes_finalize.failure');
    logger.error('Finalize clinical note failed', {
      requestId,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Forbidden') || error.message.includes('Cannot finalize')) {
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

      if (error.message.includes('Invalid state')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict - state violation
        );
      }

      if (error.message.includes('empty note')) {
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
