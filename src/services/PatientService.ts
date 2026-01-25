import { getPrisma } from '@/repositories/BaseRepository'
import { RequestContext } from '@/types/context'
import { Patient, AccountStatus, UserRole } from '@prisma/client'
import { getAuditService } from './AuditService'

export interface CreatePatientInput {
  firstName: string
  lastName: string
  dateOfBirth: Date
  email: string
  phone?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  medicalRecordNumber?: string
  guardianEmail?: string
}

export interface UpdatePatientInput {
  firstName?: string
  lastName?: string
  dateOfBirth?: Date
  email?: string
  phone?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  medicalRecordNumber?: string
  status?: AccountStatus
}

export class PatientService {
  async createPatient(input: CreatePatientInput, context: RequestContext): Promise<Patient> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    const prisma = getPrisma()
    const auditService = getAuditService()

    // Only providers and admins can create patients
    if (context.role !== UserRole.provider && context.role !== UserRole.admin) {
      throw new Error('Unauthorized: Only providers and admins can create patients')
    }

    // Parse and validate dateOfBirth
    const dateOfBirth = new Date(input.dateOfBirth)
    if (isNaN(dateOfBirth.getTime())) {
      throw new Error('Invalid dateOfBirth format. Expected ISO-8601 date string (YYYY-MM-DD or full ISO-8601)')
    }

    const patient = await prisma.patient.create({
      data: {
        tenantId: context.tenantId,  // ← TENANT ISOLATION
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: dateOfBirth,
        email: input.email,
        phone: input.phone,
        address: input.address,
        emergencyContact: input.emergencyContact,
        emergencyPhone: input.emergencyPhone,
        medicalRecordNumber: input.medicalRecordNumber || `MRN${Date.now()}`,
        guardianEmail: input.guardianEmail,
        status: AccountStatus.active,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Audit log
    await auditService.createLog({
      action: 'CREATE_PATIENT',
      userId: context.userId,
      entityType: 'Patient',
      entityId: patient.id,
      tenantId: context.tenantId,
      changes: { created: patient }
    })

    return patient
  }

  async getPatients(context: RequestContext, filters?: {
    status?: AccountStatus
    search?: string
    limit?: number
    offset?: number
  }) {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    const prisma = getPrisma()

    const where: any = {
      tenantId: context.tenantId  // ← TENANT ISOLATION
    }

    // Parent access rules: parents can only see patients linked to them
    if (context.role === UserRole.parent) {
      // TODO: Add guardian relationship logic when implemented
      // For now, parents see no patients (fail-safe)
      where.guardianEmail = 'nonexistent@fail.safe'  // No patients returned
    }

    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { medicalRecordNumber: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0
      }),
      prisma.patient.count({ where })
    ])

    return { patients, total }
  }

  async getPatientById(id: string, context: RequestContext): Promise<Patient> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    const prisma = getPrisma()

    // Use findFirst with tenant filtering (prevents ID guessing attacks)
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    // Parents can only view their own patient records
    if (context.role === UserRole.parent) {
      // TODO: Add proper guardian authorization check
      // For now, parents can view all patients
    }

    return patient
  }

  async updatePatient(
    id: string,
    input: UpdatePatientInput,
    context: RequestContext
  ): Promise<Patient> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    const prisma = getPrisma()
    const auditService = getAuditService()

    // Only providers and admins can update patients
    if (context.role !== UserRole.provider && context.role !== UserRole.admin) {
      throw new Error('Unauthorized: Only providers and admins can update patients')
    }

    // Use findFirst with tenant filtering
    const existing = await prisma.patient.findFirst({
      where: {
        id,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    })
    if (!existing) {
      throw new Error('Patient not found')
    }

    const patient = await prisma.patient.update({
      where: {
        id,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      },
      data: {
        ...input,
        updatedAt: new Date()
      }
    })

    // Audit log
    await auditService.createLog({
      action: 'UPDATE_PATIENT',
      userId: context.userId,
      entityType: 'Patient',
      entityId: id,
      tenantId: context.tenantId,
      changes: { before: existing, after: patient }
    })

    return patient
  }

  async deletePatient(id: string, context: RequestContext): Promise<void> {
    // Fail-fast: ensure tenant context exists
    if (!context.tenantId) {
      throw new Error('Security violation: Request context missing tenantId');
    }

    const prisma = getPrisma()
    const auditService = getAuditService()

    // Only admins can delete patients
    if (context.role !== UserRole.admin) {
      throw new Error('Unauthorized: Only admins can delete patients')
    }

    // Use findFirst with tenant filtering
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      }
    })
    if (!patient) {
      throw new Error('Patient not found')
    }

    // Soft delete by setting status to locked
    await prisma.patient.update({
      where: {
        id,
        tenantId: context.tenantId  // ← TENANT ISOLATION
      },
      data: {
        status: AccountStatus.locked,
        updatedAt: new Date()
      }
    })

    // Audit log
    await auditService.createLog({
      action: 'DELETE_PATIENT',
      userId: context.userId,
      entityType: 'Patient',
      entityId: id,
      tenantId: context.tenantId,
      changes: { deleted: patient }
    })
  }
}

let patientServiceInstance: PatientService | null = null

export function getPatientService(): PatientService {
  if (!patientServiceInstance) {
    patientServiceInstance = new PatientService()
  }
  return patientServiceInstance
}
