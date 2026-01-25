/**
 * POST /api/notifications/[id]/read
 * Mark notification as read (client-side managed state)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@/lib/auth-context'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and get context
    const context = await getRequestContext(request)

    const notificationId = params.id

    // We don't persist read state in the database
    // This is managed client-side in localStorage
    // This endpoint simply acknowledges the action
    
    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification marked as read',
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    
    if (error instanceof Error && error.message.includes('Invalid or expired access token')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
