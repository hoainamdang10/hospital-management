'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEnhancedAuth } from '@/lib/auth/auth-wrapper';
import { getDashboardPath } from '@/lib/auth/dashboard-routes';

interface AuthRedirectProps {
  expectedRole?: 'admin' | 'doctor' | 'patient';
  redirectTo?: string;
  fallbackPath?: string;
}

/**
 * Component to handle authentication-based redirects
 * This component ensures proper redirect after login/registration
 */
export function AuthRedirect({
  expectedRole,
  redirectTo,
  fallbackPath = '/login'
}: AuthRedirectProps) {
  const { user, loading } = useEnhancedAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth state to load

    const handleRedirect = async (path: string) => {
      console.log(`AuthRedirect: preparing to redirect to ${path}`);
      // Add delay before redirection
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`AuthRedirect: executing redirect to ${path}`);
      router.push(path);
    };

    if (!user) {
      // User not authenticated, redirect to login
      console.log('AuthRedirect: user not authenticated, redirecting to login');
      handleRedirect(fallbackPath);
      return;
    }

    if (expectedRole && user.role !== expectedRole) {
      // User has wrong role, redirect to their dashboard
      console.log(`AuthRedirect: user has wrong role (${user.role} vs expected ${expectedRole})`);
      const dashboardPath = getDashboardPath(user.role as any);
      handleRedirect(dashboardPath);
      return;
    }

    if (redirectTo) {
      // Redirect to specific path
      console.log(`AuthRedirect: redirecting to specified path: ${redirectTo}`);
      handleRedirect(redirectTo);
      return;
    }

    if (user.role) {
      // Default redirect to role-based dashboard
      const dashboardPath = getDashboardPath(user.role as any);
      console.log(`AuthRedirect: redirecting to role dashboard: ${dashboardPath}`);
      handleRedirect(dashboardPath);
    }
  }, [user, loading, expectedRole, redirectTo, fallbackPath, router]);

  // Show loading while processing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xử lý...</p>
        </div>
      </div>
    );
  }

  return null; // Component doesn't render anything visible
}

/**
 * Hook for programmatic redirects after authentication
 */
export function useAuthRedirect() {
  const { user, loading } = useEnhancedAuth();
  const router = useRouter();

  const redirectToDashboard = async (role?: string) => {
    const targetRole = role || user?.role;
    if (targetRole) {
      const dashboardPath = getDashboardPath(targetRole as any);
      console.log(`useAuthRedirect: redirecting to dashboard for role: ${targetRole} -> ${dashboardPath}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(dashboardPath);
    }
  };

  const redirectToLogin = async () => {
    console.log('useAuthRedirect: redirecting to login');
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/login');
  };

  const redirectWithDelay = (path: string, delay: number = 1000) => {
    console.log(`useAuthRedirect: redirecting to ${path} with ${delay}ms delay`);
    setTimeout(() => {
      router.push(path);
    }, delay);
  };

  return {
    user,
    loading,
    redirectToDashboard,
    redirectToLogin,
    redirectWithDelay
  };
}
