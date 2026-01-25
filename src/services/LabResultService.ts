import { BaseRepository } from '@/repositories/BaseRepository';
import { RequestContext } from '@/types/context';
import { UserRole, LabResult } from '@prisma/client';
import { getAuditService } from './AuditService';

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
 * Lab Result Service - READ ONLY
 * Issue 4: Read-Only Feature APIs
 * 
 * ALLOWED:
 * - GET lab results (paginated)
 * - GET lab result by ID
 * 
 * FORBIDDEN:
 * - Any write operations
 * - State transitions
 * - Business workflows
 */
export class LabResultService extends BaseRepository {
  private auditService = getAuditService();

  // Default pagination limit
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 100;

  /**
   * Get paginated list of lab results
   * 
   * Authorization:
   * - provider: can view all lab results
   * - admin: can view all lab results
   * - parent: cannot list lab results
   */
  async getLabResults(
    context: RequestContext,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<LabResult>> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireReadAccess(context);

    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const offset = params.offset || 0;

    const client = this.getClient(context);

    // Get total count with tenant isolation
    const total = await client.labResult.count({
      where: {
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    });

    // Get paginated data with tenant isolation
    const data = await client.labResult.findMany({
      where: {
        tenantId: context.tenantId  // ← TENANT ISOLATION
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Audit log (metadata only, no sensitive data)
    await this.auditService.logEvent(
      {
        entityType: 'LabResult',
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
   * Get lab result by ID
   * 
   * Authorization:
   * - provider: can view any lab result
   * - admin: can view any lab result
   * - parent: cannot view lab results
   */
  async getLabResultById(
    labResultId: string,
    context: RequestContext
  ): Promise<LabResult | null> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireReadAccess(context);

    const client = this.getClient(context);

    const labResult = await client.labResult.findFirst({
      where: {
        id: labResultId,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    });

    if (!labResult) {
      return null;
    }

    // Audit log (metadata only)
    await this.auditService.logEvent(
      {
        entityType: 'LabResult',
        entityId: labResultId,
        action: 'viewed',
        actorId: context.userId,
        tenantId: context.tenantId,
        metadata: { patientId: labResult.patientId },
      },
    );

    return labResult;
  }

  /**
   * Require read access for lab results
   * Only providers and admins can read lab result data
   */
  private requireReadAccess(context: RequestContext): void {
    const allowedRoles: UserRole[] = [UserRole.provider, UserRole.admin];
    
    if (!allowedRoles.includes(context.role)) {
      throw new Error('Unauthorized: insufficient permissions to view lab results');
    }
  }
}

// Export singleton instance
let labResultServiceInstance: LabResultService | null = null;

export function getLabResultService(): LabResultService {
  if (!labResultServiceInstance) {
    labResultServiceInstance = new LabResultService();
  }
  return labResultServiceInstance;
}
