import { UserRole } from '@prisma/client';

/**
 * Request context carrying user identity and request metadata
 * Used throughout the service layer for authorization and audit logging
 */
export interface RequestContext {
  /** Authenticated user ID */
  userId: string;
  
  /** User role (provider, admin, parent) */
  role: UserRole;
  
  /** Tenant/organization ID for multi-tenant isolation (future-proofing) */
  tenantId?: string;
  
  /** Unique request identifier for tracing and audit correlation */
  requestId: string;
}

/**
 * Create a request context from JWT payload and request metadata
 */
export function createRequestContext(
  userId: string,
  role: UserRole,
  requestId?: string,
  tenantId?: string
): RequestContext {
  return {
    userId,
    role,
    tenantId,
    requestId: requestId || generateRequestId(),
  };
}

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
