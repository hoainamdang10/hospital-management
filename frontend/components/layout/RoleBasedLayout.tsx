'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-wrapper';
import { AdminLayout, DoctorLayout, PatientLayout } from './UniversalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  title: string;
  activePage: string;
}

export const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({
  children,
  title,
  activePage,
}) => {
  const { user, loading } = useAuth();

  // Role checking functions
  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-lg font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600">Checking authentication status</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access this page</p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Login
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role-based layout rendering
  if (isAdmin) {
    return (
      <AdminLayout title={title} activePage={activePage}>
        {children}
      </AdminLayout>
    );
  }

  if (isDoctor) {
    return (
      <DoctorLayout title={title} activePage={activePage}>
        {children}
      </DoctorLayout>
    );
  }

  if (isPatient) {
    return (
      <PatientLayout title={title} activePage={activePage}>
        {children}
      </PatientLayout>
    );
  }

  // Unknown role
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-96">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-yellow-600" />
          <h2 className="text-lg font-semibold mb-2">Unknown Role</h2>
          <p className="text-gray-600 mb-2">
            Your account role "{user.role}" is not recognized.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Please contact your administrator for assistance.
          </p>
          <div className="space-y-2">
            <div className="text-xs text-gray-400">
              User: {user.email}
            </div>
            <div className="text-xs text-gray-400">
              Role: {user.role}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
