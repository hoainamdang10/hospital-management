"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Hospital, LogOut, Loader2 } from "lucide-react"
import { EnhancedAdminGuard } from "@/lib/auth/enhanced-role-guard"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { AdminLayout } from "@/components/layout/UniversalLayout"

interface EnhancedAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  activePage?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export default function EnhancedAdminLayout({
  children,
  title = "Admin Dashboard",
  activePage = "dashboard",
  subtitle,
  headerActions,
}: EnhancedAdminLayoutProps) {
  return (
    <EnhancedAdminGuard>
      <AdminLayout
        title={title}
        activePage={activePage}
        subtitle={subtitle}
        headerActions={headerActions}
      >
        {children}
      </AdminLayout>
    </EnhancedAdminGuard>
  )
}
