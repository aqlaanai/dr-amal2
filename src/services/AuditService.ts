import { getPrisma } from '@/repositories/BaseRepository'
import { RequestContext } from '@/types/context'

export interface AuditLogInput {
  action: string
  userId: string
  entityType: string
  entityId: string
  tenantId: string  // Make tenantId required
  changes?: any
  metadata?: any
}

export class AuditService {
  async createLog(input: AuditLogInput): Promise<void> {
    const prisma = getPrisma()
    
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,  // Use actual tenantId from input
          action: input.action,
          actorId: input.userId,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: JSON.stringify(input.metadata || {}),
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Don't throw - audit logging should not break operations
    }
  }

  async getLogs(filters: {
    tenantId: string;  // ← TENANT ISOLATION (required for security)
    userId?: string
    entityType?: string
    entityId?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }) {
    const prisma = getPrisma()

    const where: any = {
      tenantId: filters.tenantId  // ← TENANT ISOLATION
    }
    if (filters?.userId) where.userId = filters.userId
    if (filters?.entityType) where.entityType = filters.entityType
    if (filters?.entityId) where.entityId = filters.entityId
    if (filters?.action) where.action = filters.action
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters?.limit || 100
    })
  }

  // Legacy compatibility methods - all accept object input
  async logCreate(input: { entityType: string; entityId: string; actorId: string; tenantId: string; metadata?: any }): Promise<void> {
    return this.createLog({
      action: `CREATE_${input.entityType.toUpperCase()}`,
      userId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      tenantId: input.tenantId,
      metadata: input.metadata
    })
  }

  async logUpdate(input: { entityType: string; entityId: string; actorId: string; tenantId: string; metadata?: any }): Promise<void> {
    return this.createLog({
      action: `UPDATE_${input.entityType.toUpperCase()}`,
      userId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      tenantId: input.tenantId,
      metadata: input.metadata
    })
  }

  async logEvent(input: { action: string; entityType: string; entityId: string; actorId: string; tenantId: string; metadata?: any }): Promise<void> {
    return this.createLog({
      action: input.action,
      userId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      tenantId: input.tenantId,
      metadata: input.metadata
    })
  }
}

let auditServiceInstance: AuditService | null = null

export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService()
  }
  return auditServiceInstance
}
