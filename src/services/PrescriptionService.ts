import { BaseRepository } from '@/repositories/BaseRepository';
import { RequestContext } from '@/types/context';
import { UserRole, Prescription, PrescriptionStatus } from '@prisma/client';
import { getAuditService } from './AuditService';

/**
 * Create prescription request
 */
export interface CreatePrescriptionRequest {
  patientId: string;
  medication: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

/**
 * Prescription Service - WRITE OPERATIONS
 * Issue 5: Controlled Write APIs
 * 
 * STATE MACHINE:
 * draft → issued → completed/cancelled
 * 
 * IMMUTABILITY RULES:
 * - Draft prescriptions CAN be edited
 * - Issued prescriptions CANNOT be edited (read-only forever)
 * - Completed prescriptions CANNOT be edited (read-only forever)
 * - Cancelled prescriptions CANNOT be edited (read-only forever)
 * 
 * ALLOWED:
 * - Create draft prescriptions
 * - Issue draft prescriptions (draft → issued)
 * 
 * FORBIDDEN:
 * - Edit issued prescriptions
 * - State rollback
 * - Admin override
 */
export class PrescriptionService extends BaseRepository {
  private auditService = getAuditService();

  /**
   * Create a new prescription in DRAFT state
   * 
   * Authorization:
   * - provider: can create prescriptions
   * - admin: cannot create prescriptions (clinical function only)
   * - parent: cannot create prescriptions
   */
  async createPrescription(
    request: CreatePrescriptionRequest,
    context: RequestContext
  ): Promise<Prescription> {
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

    // Create prescription in DRAFT state
    const prescription = await client.prescription.create({
      data: {
        tenantId: context.tenantId,  // ← TENANT ISOLATION
        patientId: request.patientId,
        providerId: context.userId,
        status: PrescriptionStatus.draft,
        medication: request.medication,
        dosage: request.dosage,
        duration: request.duration,
        instructions: request.instructions,
      },
    });

    // Audit log
    await this.auditService.logCreate({
      entityType: 'Prescription',
      entityId: prescription.id,
      actorId: context.userId,
      tenantId: context.tenantId,
      metadata: {
        patientId: request.patientId,
        medication: request.medication,
        status: 'draft',
      }
    });

    return prescription;
  }

  /**
   * Issue a prescription (draft → issued)
   * 
   * STATE TRANSITION:
   * - ALLOWED: draft → issued
   * - FORBIDDEN: issued → anything, completed → anything, cancelled → anything
   * 
   * IRREVERSIBILITY: Once issued, the prescription is READ-ONLY FOREVER
   * 
   * Authorization:
   * - provider: can issue their own draft prescriptions
   * - admin: cannot issue prescriptions
   * - parent: cannot issue prescriptions
   */
  async issuePrescription(
    prescriptionId: string,
    context: RequestContext
  ): Promise<Prescription> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireWriteAccess(context);

    const client = this.getClient(context);

    // Read current state from DB (MANDATORY) with tenant isolation
    const existingPrescription = await client.prescription.findFirst({
      where: {
        id: prescriptionId,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    });

    if (!existingPrescription) {
      throw new Error('Prescription not found');
    }

    // Verify ownership
    if (existingPrescription.providerId !== context.userId) {
      throw new Error('Cannot issue another provider\'s prescription');
    }

    // STATE MACHINE VALIDATION
    if (existingPrescription.status !== PrescriptionStatus.draft) {
      throw new Error(
        `Invalid state transition: can only issue prescriptions in draft state (current: ${existingPrescription.status})`
      );
    }

    // Validate prescription has required fields (business rule)
    if (!existingPrescription.medication || !existingPrescription.dosage || !existingPrescription.duration) {
      throw new Error('Cannot issue incomplete prescription - medication, dosage, and duration are required');
    }

    // Execute state transition: draft → issued
    const issuedPrescription = await client.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: PrescriptionStatus.issued,
        issuedAt: new Date(),
      },
    });

    // Audit log (CRITICAL - this is a legal event)
    await this.auditService.logEvent(
      {
        entityType: 'Prescription',
        entityId: prescriptionId,
        action: 'issued',
        actorId: context.userId,
        tenantId: context.tenantId,
        metadata: {
          patientId: existingPrescription.patientId,
          medication: existingPrescription.medication,
          previousStatus: 'draft',
          newStatus: 'issued',
          issuedAt: issuedPrescription.issuedAt?.toISOString(),
        },
      },
    );

    return issuedPrescription;
  }

  /**
   * Require write access for prescriptions
   * Only providers can create/issue prescriptions (clinical function)
   */
  private requireWriteAccess(context: RequestContext): void {
    const allowedRoles: UserRole[] = [UserRole.provider];
    
    if (!allowedRoles.includes(context.role)) {
      throw new Error('Forbidden: only providers can create or issue prescriptions');
    }
  }
}

// Export singleton instance
let prescriptionServiceInstance: PrescriptionService | null = null;

export function getPrescriptionService(): PrescriptionService {
  if (!prescriptionServiceInstance) {
    prescriptionServiceInstance = new PrescriptionService();
  }
  return prescriptionServiceInstance;
}
