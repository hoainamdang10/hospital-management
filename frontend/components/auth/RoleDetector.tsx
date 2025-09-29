'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Stethoscope,
  Heart,
  User,
  CheckCircle,
  AlertCircle,
  LogOut,
  Settings
} from 'lucide-react';

export const RoleDetector: React.FC = () => {
  const { user, loading, signOut } = useEnhancedAuth();

  const isAdmin = () => user?.role === 'admin';
  const isDoctor = () => user?.role === 'doctor';
  const isPatient = () => user?.role === 'patient';
  const logout = () => signOut();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Detecting user role...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2">Not Authenticated</h2>
            <p className="text-gray-600 mb-4">Please log in to continue</p>
            <Button asChild>
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = () => {
    if (isAdmin()) return <Shield className="h-8 w-8 text-red-600" />;
    if (isDoctor()) return <Stethoscope className="h-8 w-8 text-green-600" />;
    if (isPatient()) return <Heart className="h-8 w-8 text-blue-600" />;
    return <User className="h-8 w-8 text-gray-600" />;
  };

  const getRoleColor = () => {
    if (isAdmin()) return 'bg-red-100 text-red-800';
    if (isDoctor()) return 'bg-green-100 text-green-800';
    if (isPatient()) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleDashboard = () => {
    if (isAdmin()) return '/admin/dashboard';
    if (isDoctor()) return '/doctors/dashboard';
    if (isPatient()) return '/patient/dashboard';
    return '/';
  };

  const getRoleDescription = () => {
    if (isAdmin()) return 'Full system access with administrative privileges';
    if (isDoctor()) return 'Access to patient care and medical management tools';
    if (isPatient()) return 'Access to personal health records and appointments';
    return 'Unknown role permissions';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getRoleIcon()}
          </div>
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <p className="text-gray-600">Role detected successfully</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{user.full_name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <Badge className={getRoleColor()}>
              {user.role.toUpperCase()}
            </Badge>
          </div>

          {/* Role Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Access Level</h4>
                <p className="text-sm text-gray-600">{getRoleDescription()}</p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Account Status</span>
              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Email Verified</span>
              <Badge variant={user.email_verified ? 'default' : 'secondary'}>
                {user.email_verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            {user.last_login && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Login</span>
                <span className="text-xs text-gray-500">
                  {new Date(user.last_login).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <a href={getRoleDashboard()}>
                Go to Dashboard
              </a>
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <a href={`/${user.role}/settings`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </a>
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Debug Info (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info</h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>User ID: {user.id}</div>
                <div>Role: {user.role}</div>
                <div>Profile ID: {user.profile_id || 'N/A'}</div>
                <div>Created: {new Date(user.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
