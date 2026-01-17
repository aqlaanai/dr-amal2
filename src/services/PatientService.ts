import { BaseRepository } from '@/repositories/BaseRepository';
import { RequestContext } from '@/types/context';
import { UserRole, Patient } from '@prisma/client';
import { getAuditService } from './AuditService';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Patient Service - READ ONLY
 * Issue 4: Read-Only Feature APIs
 * 
 * ALLOWED:
 * - GET patients (paginated)
 * - GET patient by ID
 * 
 * FORBIDDEN:
 * - Any write operations
 * - State transitions
 * - Business workflows
 */
export class PatientService extends BaseRepository {
  private auditService = getAuditService();

  // Default pagination limit
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 100;

  /**
   * Get paginated list of patients
   * 
   * Authorization:
   * - provider: can view all patients
   * - admin: can view all patients
   * - parent: cannot list patients
   */
  async getPatients(
    context: RequestContext,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Patient>> {
    // Authorization check
    this.requireReadAccess(context);

    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const offset = params.offset || 0;

    const client = this.getClient(context);

    // Get total count
    const total = await client.patient.count();

    // Get paginated data
    const data = await client.patient.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Audit log (metadata only, no sensitive data)
    await this.auditService.logEvent(
      {
        entityType: 'Patient',
        entityId: 'list',
        action: 'viewed',
        actorId: context.userId,
        metadata: { count: data.length, offset, limit },
      },
      context
    );

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get patient by ID
   * 
   * Authorization:
   * - provider: can view any patient
   * - admin: can view any patient
   * - parent: cannot view patients
   */
  async getPatientById(
    patientId: string,
    context: RequestContext
  ): Promise<Patient | null> {
    // Authorization check
    this.requireReadAccess(context);

    const client = this.getClient(context);

    const patient = await client.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return null;
    }

    // Audit log (metadata only)
    await this.auditService.logEvent(
      {
        entityType: 'Patient',
        entityId: patientId,
        action: 'viewed',
        actorId: context.userId,
      },
      context
    );

    return patient;
  }

  /**
   * Require read access for patients
   * Only providers and admins can read patient data
   */
  private requireReadAccess(context: RequestContext): void {
    const allowedRoles: UserRole[] = [UserRole.provider, UserRole.admin];
    
    if (!allowedRoles.includes(context.role)) {
      throw new Error('Unauthorized: insufficient permissions to view patients');
    }
  }
}

// Export singleton instance
let patientServiceInstance: PatientService | null = null;

export function getPatientService(): PatientService {
  if (!patientServiceInstance) {
    patientServiceInstance = new PatientService();
  }
  return patientServiceInstance;
}
