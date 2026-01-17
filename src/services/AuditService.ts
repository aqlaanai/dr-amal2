import { BaseRepository } from '@/repositories/BaseRepository';
import { RequestContext } from '@/types/context';

/**
 * Audit event payload
 */
export interface AuditEvent {
  /** Entity type being acted upon (e.g., 'User', 'Patient', 'ClinicalNote') */
  entityType: string;
  
  /** ID of the entity */
  entityId: string;
  
  /** Action performed (e.g., 'created', 'updated', 'deleted', 'viewed') */
  action: string;
  
  /** User who performed the action */
  actorId: string;
  
  /** Additional metadata (e.g., field changes, IP address) */
  metadata?: Record<string, any>;
}

/**
 * Centralized audit logging service
 * 
 * CRITICAL RULES:
 * - NEVER throws exceptions (logging failures must not break business logic)
 * - Append-only writes to AuditLog table
 * - Callable from anywhere in the application
 * - All failures are logged to console but swallowed
 */
export class AuditService extends BaseRepository {
  /**
   * Log an audit event
   * 
   * @param event - Event to log
   * @param context - Optional request context for correlation
   */
  async logEvent(event: AuditEvent, context?: RequestContext): Promise<void> {
    try {
      const client = this.getClient(context);
      
      await client.auditLog.create({
        data: {
          entityType: event.entityType,
          entityId: event.entityId,
          action: event.action,
          actorId: event.actorId,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        },
      });
    } catch (error) {
      // CRITICAL: Never throw on audit failure
      // Log to console for monitoring but don't break business logic
      console.error('[AuditService] Failed to log event:', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Log user authentication event
   */
  async logAuth(
    action: 'signup' | 'signin' | 'signout' | 'refresh',
    userId: string,
    metadata?: Record<string, any>,
    context?: RequestContext
  ): Promise<void> {
    await this.logEvent(
      {
        entityType: 'User',
        entityId: userId,
        action,
        actorId: userId,
        metadata,
      },
      context
    );
  }

  /**
   * Log entity creation
   */
  async logCreate(
    entityType: string,
    entityId: string,
    actorId: string,
    metadata?: Record<string, any>,
    context?: RequestContext
  ): Promise<void> {
    await this.logEvent(
      {
        entityType,
        entityId,
        action: 'created',
        actorId,
        metadata,
      },
      context
    );
  }

  /**
   * Log entity update
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    actorId: string,
    changes: Record<string, any>,
    context?: RequestContext
  ): Promise<void> {
    await this.logEvent(
      {
        entityType,
        entityId,
        action: 'updated',
        actorId,
        metadata: { changes },
      },
      context
    );
  }

  /**
   * Log entity deletion
   */
  async logDelete(
    entityType: string,
    entityId: string,
    actorId: string,
    metadata?: Record<string, any>,
    context?: RequestContext
  ): Promise<void> {
    await this.logEvent(
      {
        entityType,
        entityId,
        action: 'deleted',
        actorId,
        metadata,
      },
      context
    );
  }
}

// Export singleton instance
let auditServiceInstance: AuditService | null = null;

export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService();
  }
  return auditServiceInstance;
}
