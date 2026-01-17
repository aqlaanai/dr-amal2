import { BaseRepository } from '@/repositories/BaseRepository';
import { RequestContext } from '@/types/context';
import { UserRole } from '@prisma/client';
import { getAuditService } from './AuditService';

/**
 * Overview data for dashboard
 */
export interface OverviewData {
  stats: {
    totalPatients: number;
    activeSessions: number;
    pendingLabResults: number;
    recentNotes: number;
  };
  recentActivity: {
    recentPatients: Array<{
      id: string;
      firstName: string;
      lastName: string;
      createdAt: Date;
    }>;
    recentSessions: Array<{
      id: string;
      patientId: string;
      status: string;
      scheduledAt: Date;
    }>;
  };
}

/**
 * Overview Service - READ ONLY
 * Issue 4: Read-Only Feature APIs
 * 
 * Provides aggregated dashboard data
 * 
 * ALLOWED:
 * - GET overview statistics
 * - GET recent activity
 * 
 * FORBIDDEN:
 * - Any write operations
 */
export class OverviewService extends BaseRepository {
  private auditService = getAuditService();

  /**
   * Get overview dashboard data
   * 
   * Authorization:
   * - provider: can view overview
   * - admin: can view overview
   * - parent: cannot view overview
   */
  async getOverview(context: RequestContext): Promise<OverviewData> {
    // Authorization check
    this.requireReadAccess(context);

    const client = this.getClient(context);

    // Get statistics
    const [
      totalPatients,
      activeSessions,
      pendingLabResults,
      recentNotesCount,
    ] = await Promise.all([
      client.patient.count(),
      client.liveSession.count({
        where: { status: 'scheduled' },
      }),
      client.labResult.count({
        where: { status: 'pending' },
      }),
      client.clinicalNote.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Get recent activity
    const [recentPatients, recentSessions] = await Promise.all([
      client.patient.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      }),
      client.liveSession.findMany({
        take: 5,
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          patientId: true,
          status: true,
          scheduledAt: true,
        },
      }),
    ]);

    // Audit log
    await this.auditService.logEvent(
      {
        entityType: 'Overview',
        entityId: 'dashboard',
        action: 'viewed',
        actorId: context.userId,
      },
      context
    );

    return {
      stats: {
        totalPatients,
        activeSessions,
        pendingLabResults,
        recentNotes: recentNotesCount,
      },
      recentActivity: {
        recentPatients,
        recentSessions,
      },
    };
  }

  /**
   * Require read access for overview
   * Only providers and admins can view overview
   */
  private requireReadAccess(context: RequestContext): void {
    const allowedRoles: UserRole[] = [UserRole.provider, UserRole.admin];
    
    if (!allowedRoles.includes(context.role)) {
      throw new Error('Unauthorized: insufficient permissions to view overview');
    }
  }
}

// Export singleton instance
let overviewServiceInstance: OverviewService | null = null;

export function getOverviewService(): OverviewService {
  if (!overviewServiceInstance) {
    overviewServiceInstance = new OverviewService();
  }
  return overviewServiceInstance;
}
