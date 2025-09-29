'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-wrapper';
import { UnifiedUser } from '@/lib/auth/unified-auth-context';

// Types for auth guard hook
export interface UseAuthGuardOptions {
  requiredRoles?: string[];
  redirectTo?: string;
  requireEmailVerified?: boolean;
  onUnauthorized?: () => void;
  onLoading?: () => void;
}

export interface AuthGuardState {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  user: UnifiedUser | null;
  error: string | null;
}

// Client-side auth guard hook for dynamic components
export function useAuthGuard(options: UseAuthGuardOptions = {}): AuthGuardState {
  const {
    requiredRoles = [],
    redirectTo = '/auth/login',
    requireEmailVerified = false,
    onUnauthorized,
    onLoading
  } = options;

  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [authState, setAuthState] = useState<AuthGuardState>({
    isAuthenticated: false,
    isAuthorized: false,
    isLoading: true,
    user: null,
    error: null
  });

  useEffect(() => {
    // Call onLoading callback if provided
    if (loading && onLoading) {
      onLoading();
    }

    // Update loading state
    if (loading) {
      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      return;
    }

    // Check authentication
    if (!user || !isAuthenticated) {
      setAuthState({
        isAuthenticated: false,
        isAuthorized: false,
        isLoading: false,
        user: null,
        error: 'User not authenticated'
      });

      // Redirect to login with return URL
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    // Check if account is active
    if (!user.is_active) {
      setAuthState({
        isAuthenticated: true,
        isAuthorized: false,
        isLoading: false,
        user,
        error: 'Account is suspended'
      });

      router.push('/auth/account-suspended');
      return;
    }

    // Check email verification if required
    if (requireEmailVerified && !user.email_verified) {
      setAuthState({
        isAuthenticated: true,
        isAuthorized: false,
        isLoading: false,
        user,
        error: 'Email verification required'
      });

      router.push('/auth/verify-email');
      return;
    }

    // Check role authorization
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      setAuthState({
        isAuthenticated: true,
        isAuthorized: false,
        isLoading: false,
        user,
        error: `Access denied. Required roles: ${requiredRoles.join(', ')}`
      });

      // Call onUnauthorized callback if provided
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.push('/unauthorized');
      }
      return;
    }

    // All checks passed
    setAuthState({
      isAuthenticated: true,
      isAuthorized: true,
      isLoading: false,
      user,
      error: null
    });

  }, [user, isAuthenticated, loading, requiredRoles, requireEmailVerified, redirectTo, router, onUnauthorized, onLoading]);

  return authState;
}

// Higher-order component using the auth guard hook
export function withAuthGuard<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options: UseAuthGuardOptions = {}
) {
  return function AuthGuardedComponent(props: T) {
    const { isLoading, isAuthenticated, isAuthorized, user, error } = useAuthGuard(options);

    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Show error state
    if (!isAuthenticated || !isAuthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }

    // Render the protected component
    return <WrappedComponent {...props} user={user} />;
  };
}

// Utility hooks for specific roles
export function useAdminGuard() {
  return useAuthGuard({ requiredRoles: ['admin'] });
}

export function useDoctorGuard() {
  return useAuthGuard({ requiredRoles: ['doctor'] });
}

export function usePatientGuard() {
  return useAuthGuard({ requiredRoles: ['patient'] });
}

export function useDoctorOrAdminGuard() {
  return useAuthGuard({ requiredRoles: ['doctor', 'admin'] });
}

export function useAnyRoleGuard() {
  return useAuthGuard({ requiredRoles: [] }); // Just require authentication
}
