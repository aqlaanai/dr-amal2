export enum NotificationType {
  NOTE_FINALIZED = 'NOTE_FINALIZED',
  LAB_RESULT_READY = 'LAB_RESULT_READY',
  PRESCRIPTION_ISSUED = 'PRESCRIPTION_ISSUED',
  SESSION_SCHEDULED = 'SESSION_SCHEDULED',
  REFERRAL_CREATED = 'REFERRAL_CREATED'
}

export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: string
  isRead: boolean
  relatedEntityId?: string
  relatedEntityType?: 'lab' | 'note' | 'prescription' | 'session' | 'referral'
  patientName?: string
  metadata?: Record<string, any>
}

export interface CreateNotificationInput {
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  link?: string
}
