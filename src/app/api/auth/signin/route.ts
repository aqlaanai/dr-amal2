import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/repositories/BaseRepository';
import { verifyPassword } from '@/lib/crypto';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { AccountStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Signin request received:', { email: email || '(empty)', passwordProvided: !!password, bodyKeys: Object.keys(body) });

    // Validate required fields
    if (!email || !password) {
      console.log('Validation failed - missing fields:', { hasEmail: !!email, hasPassword: !!password });
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (user.accountStatus !== AccountStatus.active) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: 0
    });

    // Store refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLoginAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    );
  }
}
