"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-wrapper'
import { getDashboardPath } from './dashboard-routes'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/auth/login',
  fallback 
}: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (loading) return

    console.log('🔒 [RoleGuard] Checking access:', {
      hasUser: !!user,
      userRole: user?.role,
      allowedRoles,
      isActive: user?.is_active
    })

    // If no user, redirect to login
    if (!user) {
      console.log('🔒 [RoleGuard] No user found, redirecting to login')
      router.replace(redirectTo)
      return
    }

    // If user is not active, redirect to suspended page
    if (!user.is_active) {
      console.log('🔒 [RoleGuard] User account is inactive')
      router.replace('/auth/account-suspended')
      return
    }

    // If user role is not allowed, redirect to their dashboard
    if (!allowedRoles.includes(user.role)) {
      console.log(`🔒 [RoleGuard] User role ${user.role} not allowed, redirecting to their dashboard`)
      router.replace(getDashboardPath(user.role as any))
      return
    }

    console.log('✅ [RoleGuard] Access granted')
    setIsChecking(false)
  }, [user, loading, allowedRoles, redirectTo, router])

  // Show loading while checking auth
  if (loading || isChecking) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // If we reach here, user has access
  return <>{children}</>
}

// Convenience components for specific roles
export function AdminGuard({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function DoctorGuard({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['doctor']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function PatientGuard({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['patient']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function StaffGuard({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
