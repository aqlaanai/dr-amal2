/**
 * GET /api/appointments
 * List all appointments
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext, guardRouteAccess } from '@/lib/auth-context'
import { logger, generateRequestId } from '@/lib/logger'
import { metrics } from '@/lib/metrics'
import { getSessionService, CreateAppointmentRequest } from '@/services/SessionService'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const startTime = Date.now()

  try {
    // Authenticate
    const context = await getRequestContext(request)
        // API Guard: Only providers and admins can list appointments
    guardRouteAccess(context, [UserRole.provider, UserRole.admin]);
        logger.info('Get appointments request', {
      requestId,
      userId: context.userId,
      role: context.role,
      endpoint: '/api/appointments'
    })

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    // Initialize service
    const sessionService = getSessionService()

    // Call service
    const result = await sessionService.getSessions(context, { limit, offset })

    const duration = Date.now() - startTime
    metrics.incrementCounter('read.appointments.success')
    metrics.recordDuration('read.appointments.duration', duration)
    logger.info('Get appointments success', { requestId, userId: context.userId, count: result.data.length, duration })

    return NextResponse.json({
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total,
      },
    })

  } catch (error) {
    const duration = Date.now() - startTime
    metrics.incrementCounter('read.appointments.failure')
    logger.error('Get appointments failed', { requestId, duration }, error instanceof Error ? error : undefined)

    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired access token')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }

      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const startTime = Date.now()

  try {
    // Authenticate
    const context = await getRequestContext(request);
    
    // API Guard: Only providers can create appointments
    guardRouteAccess(context, [UserRole.provider]);
    
    logger.info('Create appointment request', {
      requestId,
      userId: context.userId,
      role: context.role,
      endpoint: 'POST /api/appointments'
    });

    // Parse body
    const body: CreateAppointmentRequest = await request.json()

    if (!body.patientId || !body.scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, scheduledAt' },
        { status: 400 }
      )
    }

    // Initialize service
    const sessionService = getSessionService()

    // Create appointment
    const appointment = await sessionService.createAppointment({
      patientId: body.patientId,
      scheduledAt: new Date(body.scheduledAt),
    }, context)

    const duration = Date.now() - startTime
    metrics.incrementCounter('write.appointments.success')
    metrics.recordDuration('write.appointments.duration', duration)
    logger.info('Appointment created', {
      requestId,
      appointmentId: appointment.id,
      duration,
      statusCode: 201
    })

    return NextResponse.json(appointment, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime
    metrics.incrementCounter('write.appointments.failure')
    logger.error('Create appointment failed', { requestId, duration }, error instanceof Error ? error : undefined)

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Invalid or expired access token')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }

      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }

      // Generic error
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
