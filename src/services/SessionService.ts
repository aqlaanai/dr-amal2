import { BaseRepository } from '@/repositories/BaseRepository';
import { RequestContext } from '@/types/context';
import { UserRole, LiveSession, SessionStatus } from '@prisma/client';
import { getAuditService } from './AuditService';

/**
 * Session transition request
 */
export interface TransitionSessionRequest {
  targetStatus: SessionStatus;
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
    // Authorization check
    this.requireTransitionAccess(context, request.targetStatus);

    const client = this.getClient(context);

    // Read current state from DB (MANDATORY)
    const existingSession = await client.liveSession.findUnique({
      where: { id: sessionId },
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
        metadata: {
          patientId: existingSession.patientId,
          previousStatus: currentStatus,
          newStatus: targetStatus,
          transition: `${currentStatus} → ${targetStatus}`,
        },
      },
      context
    );

    return transitionedSession;
  }

  /**
   * Require transition access
   * 
   * Authorization rules:
   * - provider: can transition any state except archived
   * - admin: can transition to archived state only
   * - parent: cannot transition
   */
  private requireTransitionAccess(context: RequestContext, targetStatus: SessionStatus): void {
    if (context.role === UserRole.provider) {
      // Providers can transition to any state except archived
      if (targetStatus === SessionStatus.archived) {
        throw new Error('Forbidden: only admins can archive sessions');
      }
      return;
    }

    if (context.role === UserRole.admin) {
      // Admins can only transition to archived state
      if (targetStatus !== SessionStatus.archived) {
        throw new Error('Forbidden: admins can only transition sessions to archived state');
      }
      return;
    }

    // Parents cannot transition
    throw new Error('Forbidden: only providers and admins can transition sessions');
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
