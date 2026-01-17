import { BaseRepository } from '@/repositories/BaseRepository';
import { UserRole, AccountStatus, User } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/jwt';
import { getAuditService } from './AuditService';
import { RequestContext, createRequestContext } from '@/types/context';

/**
 * Signup request payload
 */
export interface SignupRequest {
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Signup response
 */
export interface SignupResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Signin request payload
 */
export interface SigninRequest {
  email: string;
  password: string;
}

/**
 * Signin response
 */
export interface SigninResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh token request payload
 */
export interface RefreshRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication service
 * 
 * RESPONSIBILITIES:
 * - User signup with validation
 * - User signin with credential verification
 * - Token generation and refresh
 * - Session invalidation (logout)
 * 
 * RULES:
 * - No HTTP knowledge (no NextRequest/NextResponse)
 * - All database access through BaseRepository (Prisma)
 * - Audit logging for all auth events
 * - Password hashing with bcrypt
 */
export class AuthService extends BaseRepository {
  private auditService = getAuditService();

  /**
   * Register a new user
   */
  async signup(request: SignupRequest, context?: RequestContext): Promise<SignupResponse> {
    const { email, password, role } = request;

    // Validate inputs
    this.validateEmail(email);
    this.validatePassword(password);
    this.validateRole(role);

    const client = this.getClient(context);

    // Check if user already exists
    const existingUser = await client.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await client.user.create({
      data: {
        email,
        passwordHash,
        role,
        accountStatus: AccountStatus.pending,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: 1,
    });

    // Store refresh token
    await client.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Audit log
    await this.auditService.logAuth('signup', user.id, { email, role }, context);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticate user and issue tokens
   */
  async signin(request: SigninRequest, context?: RequestContext): Promise<SigninResponse> {
    const { email, password } = request;

    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const client = this.getClient(context);

    // Find user
    const user = await client.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check account status
    if (user.accountStatus === AccountStatus.locked) {
      throw new Error('Account is locked');
    }

    if (user.accountStatus === AccountStatus.pending) {
      throw new Error('Account is pending approval');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: 1,
    });

    // Store refresh token
    await client.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Audit log
    await this.auditService.logAuth('signin', user.id, { email }, context);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(request: RefreshRequest, context?: RequestContext): Promise<RefreshResponse> {
    const { refreshToken } = request;

    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    // Verify refresh token
    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }

    const client = this.getClient(context);

    // Find user and verify stored refresh token
    const user = await client.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: 1,
    });

    // Update stored refresh token
    await client.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // Audit log
    await this.auditService.logAuth('refresh', user.id, {}, context);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Invalidate user session (logout)
   */
  async logout(userId: string, context?: RequestContext): Promise<void> {
    const client = this.getClient(context);

    // Clear refresh token
    await client.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Audit log
    await this.auditService.logAuth('signout', userId, {}, context);
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    if (!email) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (!password) {
      throw new Error('Password is required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  }

  /**
   * Validate user role
   */
  private validateRole(role: UserRole): void {
    if (!Object.values(UserRole).includes(role)) {
      throw new Error('Invalid role');
    }
  }
}

// Export singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetAuthService(): void {
  authServiceInstance = null;
}
