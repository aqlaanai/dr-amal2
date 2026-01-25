import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/repositories/BaseRepository';
import { getRequestContext } from '@/lib/auth-context';

export async function POST(request: NextRequest) {
  try {
    // Get user context from auth token
    const context = await getRequestContext(request);
    
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prisma = getPrisma();

    // Clear refresh token from database
    await prisma.user.update({
      where: { id: context.userId },
      data: { refreshToken: null }
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
