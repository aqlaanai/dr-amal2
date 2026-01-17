import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/services/AIService';
import { getRequestContext } from '@/lib/auth-context';
import { UserRole } from '@prisma/client';
import { isRateLimited, getRateLimitInfo, RateLimits } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

/**
 * POST /api/ai/suggest-diagnosis - Suggest possible diagnoses from symptoms
 * Issue 7: Rate limited to prevent AI API abuse
 * 
 * USER-TRIGGERED ONLY: Called when user clicks "Ask AI"
 * 
 * Authorization: providers only
 * 
 * Body:
 * {
 *   "symptoms": ["string"],
 *   "patientId": "string"
 * }
 * 
 * Response:
 * {
 *   "suggestion": [
 *     {
 *       "diagnosis": "string",
 *       "reasoning": "string",
 *       "confidence": "low" | "medium" | "high",
 *       "recommendedTests": ["string"]
 *     }
 *   ],
 *   "confidence": "low" | "medium" | "high",
 *   "refused": boolean,
 *   "reasoning": "string"
 * }
 * 
 * SAFETY:
 * - AI suggestions are non-authoritative
 * - Provider makes final diagnosis
 * - All AI calls are audited
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Get auth context
    const context = await getRequestContext(request);
    
    logger.info('AI suggest diagnosis request', {
      requestId,
      userId: context.userId,
      endpoint: 'POST /api/ai/suggest-diagnosis'
    });

    // Rate limiting (10 req/min per user - prevent AI API abuse)
    const rateLimitKey = `ai:suggest-diagnosis:${context.userId}`;
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
        { error: 'Forbidden: only providers can request AI diagnosis suggestions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.symptoms || !Array.isArray(body.symptoms)) {
      return NextResponse.json(
        { error: 'Missing or invalid field: symptoms (must be array)' },
        { status: 400 }
      );
    }

    if (!body.patientId) {
      return NextResponse.json(
        { error: 'Missing required field: patientId' },
        { status: 400 }
      );
    }

    // Call AI service (READ-ONLY)
    const service = getAIService();
    const aiResponse = await service.suggestDiagnosis(
      body.symptoms,
      body.patientId,
      context
    );

    const duration = Date.now() - startTime;
    metrics.incrementCounter('ai.suggest_diagnosis.success');
    metrics.recordDuration('ai.suggest_diagnosis.duration', duration);
    if (aiResponse.refused) {
      metrics.incrementCounter('ai.suggest_diagnosis.refused');
    }
    logger.info('AI diagnosis suggested', {
      requestId,
      patientId: body.patientId,
      symptomCount: body.symptoms.length,
      refused: aiResponse.refused,
      confidence: aiResponse.confidence,
      duration,
      statusCode: 200
    });

    // Return AI suggestions (non-authoritative)
    return NextResponse.json(aiResponse, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.incrementCounter('ai.suggest_diagnosis.failure');
    logger.error('AI suggest diagnosis failed', {
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
