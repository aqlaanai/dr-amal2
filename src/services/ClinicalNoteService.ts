import { BaseRepository } from '@/repositories/BaseRepository';
import { RequestContext } from '@/types/context';
import { UserRole, ClinicalNote, ClinicalNoteStatus } from '@prisma/client';
import { getAuditService } from './AuditService';

/**
 * Create clinical note request
 */
export interface CreateClinicalNoteRequest {
  patientId: string;
  sessionId?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

/**
 * Update clinical note request
 */
export interface UpdateClinicalNoteRequest {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

/**
 * Clinical Note Service - WRITE OPERATIONS
 * Issue 5: Controlled Write APIs
 * 
 * STATE MACHINE:
 * draft → finalized → archived
 * 
 * IMMUTABILITY RULES:
 * - Draft notes CAN be edited
 * - Finalized notes CANNOT be edited (read-only forever)
 * - Archived notes CANNOT be edited (read-only forever)
 * 
 * ALLOWED:
 * - Create draft notes
 * - Edit draft notes
 * - Finalize draft notes
 * 
 * FORBIDDEN:
 * - Edit finalized notes
 * - Edit archived notes
 * - State rollback
 * - Admin override
 */
export class ClinicalNoteService extends BaseRepository {
  private auditService = getAuditService();

  /**
   * Create a new clinical note in DRAFT state
   * 
   * Authorization:
   * - provider: can create notes
   * - admin: cannot create notes (clinical function only)
   * - parent: cannot create notes
   */
  async createNote(
    request: CreateClinicalNoteRequest,
    context: RequestContext
  ): Promise<ClinicalNote> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireWriteAccess(context);

    const client = this.getClient(context);

    // Verify patient exists (with tenant isolation)
    const patient = await client.patient.findFirst({
      where: {
        id: request.patientId,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify session exists (if provided) (with tenant isolation)
    if (request.sessionId) {
      const session = await client.liveSession.findFirst({
        where: {
          id: request.sessionId,
          tenantId: context.tenantId  // ← TENANT ISOLATION
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }
    }

    // Create note in DRAFT state
    const note = await client.clinicalNote.create({
      data: {
        tenantId: context.tenantId,  // ← TENANT ISOLATION
        patientId: request.patientId,
        providerId: context.userId,
        sessionId: request.sessionId,
        status: ClinicalNoteStatus.draft,
        subjective: request.subjective,
        objective: request.objective,
        assessment: request.assessment,
        plan: request.plan,
      },
    });

    // Audit log
    await this.auditService.logCreate({
      entityType: 'ClinicalNote',
      entityId: note.id,
      actorId: context.userId,
      tenantId: context.tenantId,
      metadata: { patientId: request.patientId, status: 'draft' }
    });

    return note;
  }

  /**
   * Update a clinical note (ONLY if status is DRAFT)
   * 
   * IMMUTABILITY: Finalized and archived notes CANNOT be edited
   * 
   * Authorization:
   * - provider: can edit their own draft notes
   * - admin: cannot edit notes
   * - parent: cannot edit notes
   */
  async updateNote(
    noteId: string,
    request: UpdateClinicalNoteRequest,
    context: RequestContext
  ): Promise<ClinicalNote> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireWriteAccess(context);

    const client = this.getClient(context);

    // Read current state from DB (MANDATORY) with tenant isolation
    const existingNote = await client.clinicalNote.findFirst({
      where: {
        id: noteId,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    });

    if (!existingNote) {
      throw new Error('Clinical note not found');
    }

    // Verify ownership (provider can only edit their own notes)
    if (existingNote.providerId !== context.userId) {
      throw new Error('Cannot edit another provider\'s note');
    }

    // IMMUTABILITY ENFORCEMENT
    if (existingNote.status === ClinicalNoteStatus.finalized) {
      throw new Error('Cannot edit finalized note - finalized notes are immutable');
    }

    if (existingNote.status === ClinicalNoteStatus.archived) {
      throw new Error('Cannot edit archived note - archived notes are immutable');
    }

    // STATE MACHINE VALIDATION
    if (existingNote.status !== ClinicalNoteStatus.draft) {
      throw new Error(`Invalid state: can only edit notes in draft state (current: ${existingNote.status})`);
    }

    // Update note (only draft notes)
    const updatedNote = await client.clinicalNote.update({
      where: { id: noteId },
      data: {
        subjective: request.subjective ?? existingNote.subjective,
        objective: request.objective ?? existingNote.objective,
        assessment: request.assessment ?? existingNote.assessment,
        plan: request.plan ?? existingNote.plan,
      },
    });

    // Audit log
    await this.auditService.logUpdate({
      entityType: 'ClinicalNote',
      entityId: noteId,
      actorId: context.userId,
      tenantId: context.tenantId,
      metadata: {
        fieldsUpdated: Object.keys(request),
        previousStatus: existingNote.status,
      }
    });

    return updatedNote;
  }

  /**
   * Finalize a clinical note (draft → finalized)
   * 
   * STATE TRANSITION:
   * - ALLOWED: draft → finalized
   * - FORBIDDEN: finalized → anything, archived → anything
   * 
   * IRREVERSIBILITY: Once finalized, the note is READ-ONLY FOREVER
   * 
   * Authorization:
   * - provider: can finalize their own draft notes
   * - admin: cannot finalize notes
   * - parent: cannot finalize notes
   */
  async finalizeNote(
    noteId: string,
    context: RequestContext
  ): Promise<ClinicalNote> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    // Authorization check
    this.requireWriteAccess(context);

    const client = this.getClient(context);

    // Read current state from DB (MANDATORY) with tenant isolation
    const existingNote = await client.clinicalNote.findFirst({
      where: {
        id: noteId,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    });

    if (!existingNote) {
      throw new Error('Clinical note not found');
    }

    // Verify ownership
    if (existingNote.providerId !== context.userId) {
      throw new Error('Cannot finalize another provider\'s note');
    }

    // STATE MACHINE VALIDATION
    if (existingNote.status !== ClinicalNoteStatus.draft) {
      throw new Error(
        `Invalid state transition: can only finalize notes in draft state (current: ${existingNote.status})`
      );
    }

    // Validate note has content (business rule)
    if (!existingNote.subjective && !existingNote.objective && !existingNote.assessment && !existingNote.plan) {
      throw new Error('Cannot finalize empty note - at least one SOAP field must be filled');
    }

    // Execute state transition: draft → finalized
    const finalizedNote = await client.clinicalNote.update({
      where: { id: noteId },
      data: {
        status: ClinicalNoteStatus.finalized,
        finalizedAt: new Date(),
      },
    });

    // Audit log (CRITICAL - this is a legal event)
    await this.auditService.logEvent({
      entityType: 'ClinicalNote',
      entityId: noteId,
      action: 'finalized',
      actorId: context.userId,
      tenantId: context.tenantId,
      metadata: {
        patientId: existingNote.patientId,
        previousStatus: 'draft',
        newStatus: 'finalized',
        finalizedAt: finalizedNote.finalizedAt?.toISOString(),
      },
    });

    return finalizedNote;
  }

  /**
   * Get clinical notes with tenant isolation
   */
  async getNotes(context: RequestContext, filters?: {
    patientId?: string
    providerId?: string
    status?: ClinicalNoteStatus
    limit?: number
    offset?: number
  }) {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    const client = this.getClient(context);

    const where: any = {
      tenantId: context.tenantId  // ← TENANT ISOLATION
    }

    // Parent access rules: parents cannot access clinical notes
    if (context.role === UserRole.parent) {
      // Parents cannot access any clinical notes
      return { notes: [], total: 0 };
    }

    // Provider access rules: providers can only see their own notes
    if (context.role === UserRole.provider) {
      where.providerId = context.userId;
    }
    // Admins can see all notes in tenant

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }
    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const [notes, total] = await Promise.all([
      client.clinicalNote.findMany({
        where,
        include: { patient: true, provider: true },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0
      }),
      client.clinicalNote.count({ where })
    ]);

    return { notes, total };
  }

  /**
   * Require write access for clinical notes
   * Only providers can create/edit notes (clinical function)
   */
  private requireWriteAccess(context: RequestContext): void {
    const allowedRoles: UserRole[] = [UserRole.provider];
    
    if (!allowedRoles.includes(context.role)) {
      throw new Error('Forbidden: only providers can create or edit clinical notes');
    }
  }
}

// Export singleton instance
let clinicalNoteServiceInstance: ClinicalNoteService | null = null;

export function getClinicalNoteService(): ClinicalNoteService {
  if (!clinicalNoteServiceInstance) {
    clinicalNoteServiceInstance = new ClinicalNoteService();
  }
  return clinicalNoteServiceInstance;
}
