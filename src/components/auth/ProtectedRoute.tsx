/**
 * Protected Route Component
 * Wraps content that requires authentication
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/states/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Check if user is authenticated
    if (!user) {
      setHasRedirected(true);
      router.push('/auth/signin');
      setIsAuthorized(false);
      return;
    }

    // If roles are required, check user role
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        setHasRedirected(true);
        router.push('/');
        setIsAuthorized(false);
        return;
      }
    }

    setIsAuthorized(true);
  }, [user, isLoading, router, requiredRoles]);

  if (isLoading) {
    return <LoadingState message="Checking authentication..." />;
  }

  if (hasRedirected || isAuthorized === null) {
    return <LoadingState message="Loading..." />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
