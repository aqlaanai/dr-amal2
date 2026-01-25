/**
 * Authentication Context Helper
 * Issue 4: Read-Only Feature APIs
 * 
 * Extract JWT token from request headers and create RequestContext
 */

import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import { createRequestContext, RequestContext } from '@/types/context';
import { UserRole } from '@prisma/client';

/**
 * Extract and verify JWT token from Authorization header
 * Returns RequestContext if valid, throws error otherwise
 */
export async function getRequestContext(request: NextRequest): Promise<RequestContext> {
  // Get Authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  // Extract token
  const token = authHeader.substring(7);

  // Verify token
  let payload: any;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }

  // Validate required fields
  if (!payload.userId || !payload.role || !payload.tenantId) {
    throw new Error('Invalid token payload: missing required fields');
  }

  // Validate tenantId is not empty
  if (!payload.tenantId || payload.tenantId.trim() === '') {
    throw new Error('Invalid token payload: tenantId cannot be empty');
  }

  // Create request context
  const context = createRequestContext(
    payload.userId,
    payload.role as UserRole,
    request.headers.get('x-request-id') || undefined,
    payload.tenantId
  );

  // Safety guard: ensure tenantId is always present
  if (!context.tenantId) {
    throw new Error('Security violation: Request context missing tenantId');
  }

  return context;
}

/**
 * Check if user has required role
 */
export function hasRole(context: RequestContext, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(context.role);
}

/**
 * Require specific roles, throws error if not authorized
 */
export function requireRole(context: RequestContext, allowedRoles: UserRole[]): void {
  if (!hasRole(context, allowedRoles)) {
    throw new Error(`Unauthorized: requires one of [${allowedRoles.join(', ')}]`);
  }
}

/**
 * Require ownership of a record (for parent users)
 * Throws ForbiddenError if parent doesn't own the record
 */
export function requireOwnership(context: RequestContext, recordOwnerId: string): void {
  if (context.role === UserRole.parent && recordOwnerId !== context.userId) {
    throw new Error('Forbidden: access denied - not the record owner');
  }
}

/**
 * Combined role + ownership check
 * For routes where parents can only access their own records
 */
export function requireRoleOrOwnership(
  context: RequestContext, 
  allowedRoles: UserRole[], 
  recordOwnerId: string
): void {
  // If user has required role, allow access
  if (hasRole(context, allowedRoles)) {
    return;
  }
  
  // Otherwise, check ownership (for parents)
  requireOwnership(context, recordOwnerId);
}

/**
 * API Guard: Require role-based access to route
 * Returns 403 Forbidden if not authorized
 */
export function guardRouteAccess(context: RequestContext, allowedRoles: UserRole[]): void {
  try {
    requireRole(context, allowedRoles);
  } catch (error) {
    // Convert to HTTP 403
    const httpError = new Error('Forbidden');
    (httpError as any).statusCode = 403;
    throw httpError;
  }
}

/**
 * API Guard: Require role or ownership for record access
 * Returns 403 Forbidden if not authorized
 */
export function guardRecordAccess(
  context: RequestContext, 
  allowedRoles: UserRole[], 
  recordOwnerId: string
): void {
  try {
    requireRoleOrOwnership(context, allowedRoles, recordOwnerId);
  } catch (error) {
    // Convert to HTTP 403
    const httpError = new Error('Forbidden');
    (httpError as any).statusCode = 403;
    throw httpError;
  }
}
