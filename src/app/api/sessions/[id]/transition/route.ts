import { NextRequest, NextResponse } from 'next/server';
import { getSessionService, TransitionSessionRequest } from '@/services/SessionService';
import { getRequestContext } from '@/lib/auth-context';
import { SessionStatus } from '@prisma/client';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

/**
 * POST /api/sessions/[id]/transition - Transition a session to a new state
 * 
 * Authorization:
 * - providers: can transition to waiting, active, completed
 * - admins: can transition to archived only
 * - parents: forbidden
 * 
 * Body:
 * {
 *   "targetStatus": "waiting" | "active" | "completed" | "archived"
 * }
 * 
 * VALID TRANSITIONS:
 * - scheduled → waiting
 * - waiting → active
 * - active → completed
 * - completed → archived
 * 
 * FORBIDDEN:
 * - State rollback (e.g., active → waiting)
 * - Skip states (e.g., scheduled → active)
 * - Transition from archived (terminal state)
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

    // Get session ID from params
    const { id: sessionId } = await params;
    
    logger.info('Transition session request', {
      requestId,
      userId: context.userId,
      sessionId,
      endpoint: 'POST /api/sessions/[id]/transition'
    });

    // Parse request body
    const body: TransitionSessionRequest = await request.json();

    // Validate required fields
    if (!body.targetStatus) {
      return NextResponse.json(
        { error: 'Missing required field: targetStatus' },
        { status: 400 }
      );
    }

    // Validate targetStatus is a valid enum value
    if (!Object.values(SessionStatus).includes(body.targetStatus)) {
      return NextResponse.json(
        { error: `Invalid targetStatus: ${body.targetStatus}. Valid values: ${Object.values(SessionStatus).join(', ')}` },
        { status: 400 }
      );
    }

    // Transition session
    const service = getSessionService();
    const session = await service.transitionSession(sessionId, body, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.sessions_transition.success');
    metrics.recordDuration('write.sessions_transition.duration', duration);
    logger.info('Session transitioned', {
      requestId,
      sessionId: session.id,
      targetStatus: body.targetStatus,
      duration,
      statusCode: 200
    });

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('write.sessions_transition.failure');
    logger.error('Transition session failed', {
      requestId,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Forbidden') || error.message.includes('Cannot transition')) {
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

      if (error.message.includes('Invalid state transition') || error.message.includes('immutable')) {
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
