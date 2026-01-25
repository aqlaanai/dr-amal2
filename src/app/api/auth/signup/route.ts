import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/repositories/BaseRepository';
import { hashPassword } from '@/lib/crypto';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { UserRole, AccountStatus } from '@prisma/client';
import { AuditService } from '@/services/AuditService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, role, phone, tenantId } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['provider', 'admin', 'parent'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Determine tenantId - either provided or generate new clinic
    let assignedTenantId = tenantId;
    if (!assignedTenantId) {
      // Generate new tenant ID for new clinic
      assignedTenantId = `clinic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Validate tenantId is not empty
    if (!assignedTenantId || assignedTenantId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid tenant assignment' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        role: role as UserRole,
        accountStatus: AccountStatus.active,
        phone: phone || null,
        tenantId: assignedTenantId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountStatus: true,
        tenantId: true,
        createdAt: true
      }
    });

    // Audit log the tenant assignment
    const auditService = new AuditService();
    await auditService.createLog({
      action: 'USER_SIGNUP',
      userId: user.id, // The user is auditing their own signup
      entityType: 'User',
      entityId: user.id,
      tenantId: assignedTenantId,
      metadata: {
        tenantId: assignedTenantId,
        role: user.role,
        requestId: `signup_${Date.now()}_${user.id}`
      }
    });

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
      data: { refreshToken }
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      accessToken,
      refreshToken,
      user
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
