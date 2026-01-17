import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/services/AIService';
import { getRequestContext } from '@/lib/auth-context';
import { UserRole } from '@prisma/client';
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

/**
 * POST /api/ai/explain-lab - Explain lab result in plain language
 * Issue 7: Rate limited to prevent AI API abuse
 * 
 * USER-TRIGGERED ONLY: Called when user clicks "Explain Result"
 * 
 * Authorization: providers and admins (parents denied)
 * 
 * Body:
 * {
 *   "labResultId": "string"
 * }
 * 
 * Response:
 * {
 *   "suggestion": {
 *     "summary": "string",
 *     "normalRange": "string",
 *     "significance": "string",
 *     "recommendations": ["string"]
 *   },
 *   "confidence": "low" | "medium" | "high",
 *   "refused": boolean,
 *   "reasoning": "string"
 * }
 * 
 * SAFETY:
 * - AI explanation is educational only (not diagnostic)
 * - Provider makes final determination
 * - All AI calls are audited
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Get auth context
    const context = await getRequestContext(request);
    
    logger.info('AI explain lab request', {
      requestId,
      userId: context.userId,
      endpoint: 'POST /api/ai/explain-lab'
    });

    // Rate limiting (10 req/min per user - prevent AI API abuse)
    const rateLimitKey = `ai:explain-lab:${context.userId}`;
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

    // Authorization: providers and admins only (parents denied)
    const allowedRoles: UserRole[] = [UserRole.provider, UserRole.admin];
    if (!allowedRoles.includes(context.role)) {
      return NextResponse.json(
        { error: 'Forbidden: only providers and admins can request AI lab explanations' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.labResultId) {
      return NextResponse.json(
        { error: 'Missing required field: labResultId' },
        { status: 400 }
      );
    }

    // Call AI service (READ-ONLY)
    const service = getAIService();
    const aiResponse = await service.explainLabResult(body.labResultId, context);

    const duration = Date.now() - startTime;
    metrics.incrementCounter('ai.explain_lab.success');
    metrics.recordDuration('ai.explain_lab.duration', duration);
    if (aiResponse.refused) {
      metrics.incrementCounter('ai.explain_lab.refused');
    }
    logger.info('AI lab explanation generated', {
      requestId,
      labResultId: body.labResultId,
      refused: aiResponse.refused,
      confidence: aiResponse.confidence,
      duration,
      statusCode: 200
    });

    // Return AI explanation (educational only)
    return NextResponse.json(aiResponse, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('ai.explain_lab.failure');
    logger.error('AI explain lab failed', {
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
