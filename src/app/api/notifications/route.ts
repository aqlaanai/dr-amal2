/**
 * GET /api/notifications
 * Fetch user notifications from audit events (read-only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuditService } from '@/services/AuditService'
import { NotificationType, Notification } from '@/types/notifications'
import { getRequestContext, guardRouteAccess } from '@/lib/auth-context'
import { getPrisma } from '@/repositories/BaseRepository'
import { UserRole } from '@prisma/client'

const prisma = getPrisma()

export async function GET(request: NextRequest) {
  try {
    // Authenticate and get context
    const context = await getRequestContext(request);
    
    // API Guard: Only providers and admins can view notifications
    guardRouteAccess(context, [UserRole.provider, UserRole.admin]);
    
    // Initialize audit service
    const auditService = getAuditService();

    // Fetch recent audit events with tenant isolation
    const recentAudits = await auditService.getLogs({
      tenantId: context.tenantId!,  // ← TENANT ISOLATION (context.tenantId is guaranteed by auth)
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      action: 'LAB_RESULT_CREATED|NOTE_CREATED|PRESCRIPTION_CREATED|SESSION_CREATED|REFERRAL_CREATED',
      limit: 50,
    })

    // Transform audit logs into notifications
    const notifications: Notification[] = await Promise.all(
      recentAudits.map(async (audit: any) => {
        let message = ''
        let type: NotificationType = NotificationType.NOTE_FINALIZED
        let relatedEntityType: Notification['relatedEntityType'] = undefined
        let patientName = ''

        // Fetch patient name if entityId is available
        if (audit.entityId) {
          try {
            // Try to get patient name based on entity type
            if (audit.entityType === 'LabResult') {
              const lab = await prisma.labResult.findFirst({
                where: { 
                  id: audit.entityId,
                  tenantId: context.tenantId!  // ← TENANT ISOLATION
                },
                include: {
                  patient: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              })
              if (lab?.patient) {
                patientName = `${lab.patient.firstName} ${lab.patient.lastName}`
              }
            } else if (audit.entityType === 'Note') {
              const note = await prisma.clinicalNote.findFirst({
                where: { 
                  id: audit.entityId,
                  tenantId: context.tenantId!  // ← TENANT ISOLATION
                },
                include: {
                  patient: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              })
              if (note?.patient) {
                patientName = `${note.patient.firstName} ${note.patient.lastName}`
              }
            } else if (audit.entityType === 'Prescription') {
              const prescription = await prisma.prescription.findUnique({
                where: { 
                  id: audit.entityId,
                  tenantId: context.tenantId!  // ← TENANT ISOLATION
                },
                include: {
                  patient: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              })
              if (prescription?.patient) {
                patientName = `${prescription.patient.firstName} ${prescription.patient.lastName}`
              }
            } else if (audit.entityType === 'Session') {
              const session = await prisma.liveSession.findUnique({
                where: { 
                  id: audit.entityId,
                  tenantId: context.tenantId!  // ← TENANT ISOLATION
                },
                include: {
                  patient: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              })
              if (session?.patient) {
                patientName = `${session.patient.firstName} ${session.patient.lastName}`
              }
            }
          } catch (e) {
            // Silent fail - patient name is optional
          }
        }

        // Map audit action to notification type and message
        switch (audit.action) {
          case 'LAB_RESULT_CREATED':
            type = NotificationType.LAB_RESULT_READY
            relatedEntityType = 'lab'
            message = patientName
              ? `New lab results available for ${patientName}`
              : 'New lab results available'
            break
          case 'NOTE_CREATED':
            type = NotificationType.NOTE_FINALIZED
            relatedEntityType = 'note'
            message = patientName
              ? `New clinical note created for ${patientName}`
              : 'New clinical note created'
            break
          case 'PRESCRIPTION_CREATED':
            type = NotificationType.PRESCRIPTION_ISSUED
            relatedEntityType = 'prescription'
            message = patientName
              ? `Prescription issued for ${patientName}`
              : 'Prescription issued'
            break
          case 'SESSION_CREATED':
            type = NotificationType.SESSION_SCHEDULED
            relatedEntityType = 'session'
            message = patientName
              ? `Session scheduled with ${patientName}`
              : 'Session scheduled'
            break
          case 'REFERRAL_CREATED':
            type = NotificationType.REFERRAL_CREATED
            relatedEntityType = 'referral'
            message = patientName
              ? `Referral created for ${patientName}`
              : 'Referral created'
            break
        }

        // Check if notification has been read (stored in localStorage on client)
        // We use audit log ID as notification ID for consistency
        return {
          id: audit.id,
          type,
          message,
          timestamp: audit.timestamp.toISOString(),
          isRead: false, // Default to unread, client will manage read state
          relatedEntityId: audit.entityId || undefined,
          relatedEntityType,
          patientName: patientName || undefined,
          metadata: audit.metadata as Record<string, any> | undefined,
        }
      })
    )

    return NextResponse.json({
      notifications,
      counts: {
        total: notifications.length,
        unread: notifications.filter((n) => !n.isRead).length,
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    
    if (error instanceof Error && error.message.includes('Invalid or expired access token')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
