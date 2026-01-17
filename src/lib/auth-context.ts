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
  if (!payload.userId || !payload.role) {
    throw new Error('Invalid token payload');
  }

  // Create request context
  const context = createRequestContext(
    payload.userId,
    payload.role as UserRole,
    request.headers.get('x-request-id') || undefined
  );

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
