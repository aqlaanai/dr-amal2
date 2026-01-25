import { BaseRepository } from '@/repositories/BaseRepository';
import { RequestContext } from '@/types/context';
import { UserRole, LiveSession, SessionStatus } from '@prisma/client';
import { getAuditService } from './AuditService';

/**
 * Create appointment request
 */
export interface CreateAppointmentRequest {
  patientId: string;
  scheduledAt: Date;
}

/**
 * Transition session request
 */
export interface TransitionSessionRequest {
  targetStatus: SessionStatus;
}

interface PaginationParams {
  offset?: number
  limit?: number
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  offset: number
  limit: number
}

/**
 * Session Service - WRITE OPERATIONS
 * Issue 5: Controlled Write APIs
 * 
 * STATE MACHINE:
 * scheduled → waiting → active → completed → archived
 * 
 * VALID TRANSITIONS:
 * - scheduled → waiting (patient arrived)
 * - waiting → active (session started)
 * - active → completed (session ended)
 * - completed → archived (admin archival)
 * 
 * IMMUTABILITY RULES:
 * - Completed sessions CANNOT be edited
 * - Archived sessions CANNOT be edited
 * 
 * ALLOWED:
 * - Transition sessions through valid states
 * 
 * FORBIDDEN:
 * - State rollback (e.g., active → waiting)
 * - Skip states (e.g., scheduled → active)
 * - Admin override of state rules
 */
export class SessionService extends BaseRepository {
  private auditService = getAuditService();

  // Default pagination limit
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 100;

  /**
   * Valid state transitions
   */
  private readonly validTransitions: Record<SessionStatus, SessionStatus[]> = {
    [SessionStatus.scheduled]: [SessionStatus.waiting],
    [SessionStatus.waiting]: [SessionStatus.active],
    [SessionStatus.active]: [SessionStatus.completed],
    [SessionStatus.completed]: [SessionStatus.archived],
    [SessionStatus.archived]: [], // Terminal state - no transitions allowed
  };

  /**
   * Get paginated list of sessions for the current user
   * 
   * Authorization:
   * - provider: can view their own sessions
   * - admin: can view all sessions
   * - parent: cannot view sessions
   */
  async getSessions(
    context: RequestContext,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<LiveSession>> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireReadAccess(context);

    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const offset = params.offset || 0;

    const client = this.getClient(context);

    // Build where clause based on role
    const where: any = {
      tenantId: context.tenantId  // ← TENANT ISOLATION
    };

    if (context.role === UserRole.provider) {
      // Providers can only see their own sessions
      where.providerId = context.userId;
    }
    // Admins can see all sessions (no additional filter)

    // Get total count
    const total = await client.liveSession.count({ where });

    // Get paginated data
    const data = await client.liveSession.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Audit log
    await this.auditService.logEvent(
      {
        entityType: 'LiveSession',
        entityId: 'list',
        action: 'viewed',
        actorId: context.userId,
        tenantId: context.tenantId,
        metadata: { count: data.length, offset, limit },
      },
    );

    return {
      data,
      total,
      offset,
      limit
    };
  }

  /**
   * Get session by ID
   * 
   * Authorization:
   * - provider: can view their own sessions
   * - admin: can view any session
   * - parent: cannot view sessions
   */
  async getSessionById(
    sessionId: string,
    context: RequestContext
  ): Promise<LiveSession | null> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireReadAccess(context);

    const client = this.getClient(context);

    const session = await client.liveSession.findFirst({
      where: {
        id: sessionId,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            medicalRecordNumber: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Additional authorization check for providers
    if (context.role === UserRole.provider && session.providerId !== context.userId) {
      throw new Error('Access denied: cannot view another provider\'s session');
    }

    // Audit log
    await this.auditService.logEvent(
      {
        entityType: 'LiveSession',
        entityId: sessionId,
        action: 'viewed',
        actorId: context.userId,
        tenantId: context.tenantId,
        metadata: { patientId: session.patientId },
      },
    );

    return session;
  }

  /**
   * Create a new appointment (scheduled session)
   * 
   * Authorization:
   * - provider: can create appointments
   * - admin: cannot create appointments (clinical function only)
   * - parent: cannot create appointments
   */
  async createAppointment(
    request: CreateAppointmentRequest,
    context: RequestContext
  ): Promise<LiveSession> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireWriteAccess(context);

    const client = this.getClient(context);

    // Verify patient exists with tenant isolation
    const patient = await client.patient.findFirst({
      where: {
        id: request.patientId,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Create appointment in SCHEDULED state
    const appointment = await client.liveSession.create({
      data: {
        tenantId: context.tenantId,  // ← TENANT ISOLATION
        patientId: request.patientId,
        providerId: context.userId,
        scheduledAt: request.scheduledAt,
        status: SessionStatus.scheduled,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.logCreate({
      entityType: 'LiveSession',
      entityId: appointment.id,
      actorId: context.userId,
      tenantId: context.tenantId,
      metadata: {
        patientId: request.patientId,
        scheduledAt: request.scheduledAt.toISOString(),
        status: 'scheduled',
      }
    });

    return appointment;
  }

  /**
   * Transition a session to a new state
   * 
   * STATE MACHINE ENFORCEMENT:
   * - Current state is read from DB (never inferred)
   * - Transition is validated against allowed transitions
   * - Illegal transitions are rejected
   * - No state rollback allowed
   * - No skipping states allowed
   * 
   * Authorization:
   * - provider: can transition sessions
   * - admin: can transition to archived state only
   * - parent: cannot transition sessions
   */
  async transitionSession(
    sessionId: string,
    request: TransitionSessionRequest,
    context: RequestContext
  ): Promise<LiveSession> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireTransitionAccess(context, request.targetStatus);

    const client = this.getClient(context);

    // Read current state from DB (MANDATORY) with tenant isolation
    const existingSession = await client.liveSession.findFirst({
      where: {
        id: sessionId,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    });

    if (!existingSession) {
      throw new Error('Session not found');
    }

    const currentStatus = existingSession.status;
    const targetStatus = request.targetStatus;

    // Validate transition is allowed
    const allowedTransitions = this.validTransitions[currentStatus];
    
    if (!allowedTransitions.includes(targetStatus)) {
      throw new Error(
        `Invalid state transition: ${currentStatus} → ${targetStatus}. ` +
        `Allowed transitions from ${currentStatus}: ${allowedTransitions.join(', ') || 'none (terminal state)'}`
      );
    }

    // IMMUTABILITY CHECK (explicit)
    if (currentStatus === SessionStatus.archived) {
      throw new Error('Cannot transition archived session - archived sessions are immutable');
    }

    // Verify ownership for provider transitions
    if (context.role === UserRole.provider && existingSession.providerId !== context.userId) {
      throw new Error('Cannot transition another provider\'s session');
    }

    // Execute state transition
    const transitionedSession = await client.liveSession.update({
      where: { id: sessionId },
      data: {
        status: targetStatus,
      },
    });

    // Audit log (state transitions are important events)
    await this.auditService.logEvent(
      {
        entityType: 'LiveSession',
        entityId: sessionId,
        action: 'transitioned',
        actorId: context.userId,
        tenantId: context.tenantId,
        metadata: {
          patientId: existingSession.patientId,
          previousStatus: currentStatus,
          newStatus: targetStatus,
          transition: `${currentStatus} → ${targetStatus}`,
        },
      },
    );

    return transitionedSession;
  }

  /**
   * Require read access for sessions
   * Only providers and admins can read session data
   */
  private requireReadAccess(context: RequestContext): void {
    const allowedRoles: UserRole[] = [UserRole.provider, UserRole.admin];
    
    if (!allowedRoles.includes(context.role)) {
      throw new Error('Unauthorized: insufficient permissions to view sessions');
    }
  }

  /**
   * Require write access for sessions
   * Only providers can create appointments (clinical function)
   */
  private requireWriteAccess(context: RequestContext): void {
    const allowedRoles: UserRole[] = [UserRole.provider];
    
    if (!allowedRoles.includes(context.role)) {
      throw new Error('Forbidden: only providers can create appointments');
    }
  }

  /**
   * Require transition access for sessions
   * Only providers can transition sessions, admins can only archive
   */
  private requireTransitionAccess(context: RequestContext, targetStatus: SessionStatus): void {
    const allowedRoles: UserRole[] = [UserRole.provider];
    
    // Admins can only archive sessions
    if (context.role === UserRole.admin && targetStatus !== SessionStatus.archived) {
      throw new Error('Forbidden: admins can only archive sessions');
    }
    
    if (!allowedRoles.includes(context.role) && context.role !== UserRole.admin) {
      throw new Error('Forbidden: only providers and admins can transition sessions');
    }
  }
}

// Export singleton instance
let sessionServiceInstance: SessionService | null = null;

export function getSessionService(): SessionService {
  if (!sessionServiceInstance) {
    sessionServiceInstance = new SessionService();
  }
  return sessionServiceInstance;
}
