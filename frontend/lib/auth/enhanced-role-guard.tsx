"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "./auth-wrapper";
import { getDashboardPath } from "./dashboard-routes";

interface EnhancedRoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
  requireActive?: boolean;
}

export function EnhancedRoleGuard({
  children,
  allowedRoles,
  redirectTo = "/auth/login",
  fallback,
  requireActive = true,
}: EnhancedRoleGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      console.log("🔒 [EnhancedRoleGuard] Checking access:", {
        isAuthenticated,
        hasUser: !!user,
        userRole: user?.role,
        allowedRoles,
        isActive: user?.is_active,
        requireActive,
      });

      // If still loading, wait
      if (loading) {
        setIsChecking(true);
        return;
      }

      // If not authenticated, redirect to login
      if (!isAuthenticated || !user) {
        console.log(
          "🔒 [EnhancedRoleGuard] Not authenticated, redirecting to login"
        );
        setHasAccess(false);
        setIsChecking(false);
        router.replace(redirectTo);
        return;
      }

      // If user account is not active and we require active users
      if (requireActive && !user.is_active) {
        console.log("🔒 [EnhancedRoleGuard] User account is inactive");
        setHasAccess(false);
        setIsChecking(false);
        router.replace("/auth/account-suspended");
        return;
      }

      // If user role is not allowed, redirect to their dashboard
      if (!allowedRoles.includes(user.role)) {
        console.log(
          `🔒 [EnhancedRoleGuard] User role ${user.role} not allowed, redirecting to their dashboard`
        );
        setHasAccess(false);
        setIsChecking(false);
        router.replace(getDashboardPath(user.role as any));
        return;
      }

      console.log("✅ [EnhancedRoleGuard] Access granted");
      setHasAccess(true);
      setIsChecking(false);
    };

    checkAccess();
  }, [
    user,
    loading,
    isAuthenticated,
    allowedRoles,
    redirectTo,
    requireActive,
    router,
  ]);

  // Show loading while checking auth or access
  if (loading || isChecking) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      )
    );
  }

  // If no access, don't render anything (redirect is happening)
  if (!hasAccess) {
    return null;
  }

  // If we reach here, user has access
  return <>{children}</>;
}

// Convenience components for specific roles
export function EnhancedAdminGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <EnhancedRoleGuard allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </EnhancedRoleGuard>
  );
}

export function EnhancedDoctorGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <EnhancedRoleGuard allowedRoles={["doctor"]} fallback={fallback}>
      {children}
    </EnhancedRoleGuard>
  );
}

export function EnhancedPatientGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <EnhancedRoleGuard allowedRoles={["patient"]} fallback={fallback}>
      {children}
    </EnhancedRoleGuard>
  );
}

export function EnhancedStaffGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <EnhancedRoleGuard
      allowedRoles={["admin", "doctor", "receptionist"]}
      fallback={fallback}
    >
      {children}
    </EnhancedRoleGuard>
  );
}

// Hook for checking access without rendering
export function useRoleAccess(allowedRoles: string[], requireActive = true) {
  const { user, isAuthenticated } = useAuth();

  const hasAccess = React.useMemo(() => {
    if (!isAuthenticated || !user) return false;
    if (requireActive && !user.is_active) return false;
    return allowedRoles.includes(user.role);
  }, [user, isAuthenticated, allowedRoles, requireActive]);

  return {
    hasAccess,
    user,
    isAuthenticated,
  };
}
