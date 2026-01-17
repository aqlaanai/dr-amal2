import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/services/AIService';
import { getRequestContext } from '@/lib/auth-context';
import { UserRole } from '@prisma/client';
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

/**
 * POST /api/ai/generate-note - Generate draft clinical note suggestion
 * Issue 7: Rate limited to prevent AI API abuse
 * 
 * USER-TRIGGERED ONLY: Called when user clicks "Generate Draft"
 * 
 * Authorization: providers only
 * 
 * Body:
 * {
 *   "sessionId": "string"
 * }
 * 
 * Response:
 * {
 *   "suggestion": {
 *     "subjective": "string",
 *     "objective": "string",
 *     "assessment": "string",
 *     "plan": "string"
 *   },
 *   "confidence": "low" | "medium" | "high",
 *   "refused": boolean,
 *   "reasoning": "string"
 * }
 * 
 * SAFETY:
 * - AI suggestion is NOT saved to database
 * - Provider must review and accept
 * - All AI calls are audited
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Get auth context
    const context = await getRequestContext(request);
    
    logger.info('AI generate note request', {
      requestId,
      userId: context.userId,
      endpoint: 'POST /api/ai/generate-note'
    });

    // Rate limiting (10 req/min per user - prevent AI API abuse)
    const rateLimitKey = `ai:generate-note:${context.userId}`;
    if (isRateLimited(rateLimitKey, RateLimits.AI)) {
      const info = getRateLimitInfo(rateLimitKey, RateLimits.AI);
      return NextResponse.json(
        { error: 'Too many AI requests. Please try again later.' },
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

    // Authorization: providers only
    if (context.role !== UserRole.provider) {
      return NextResponse.json(
        { error: 'Forbidden: only providers can generate AI note suggestions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    // Call AI service (READ-ONLY)
    const service = getAIService();
    const aiResponse = await service.generateDraftNote(body.sessionId, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('ai.generate_note.success');
    metrics.recordDuration('ai.generate_note.duration', duration);
    if (aiResponse.refused) {
      metrics.incrementCounter('ai.generate_note.refused');
    }
    logger.info('AI note generated', {
      requestId,
      sessionId: body.sessionId,
      refused: aiResponse.refused,
      confidence: aiResponse.confidence,
      duration,
      statusCode: 200
    });

    // Return AI suggestion (NOT saved to database)
    return NextResponse.json(aiResponse, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('ai.generate_note.failure');
    logger.error('AI generate note failed', {
      requestId,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined);

    if (error instanceof Error) {
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
