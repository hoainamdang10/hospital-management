'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversalSidebar, type UniversalSidebarProps } from './UniversalSidebar';
import { DoctorSidebar } from './DoctorSidebar';
import { UserMenu } from './UserMenu';
import { useEnhancedAuth } from '@/lib/auth/auth-wrapper';

export interface UniversalLayoutProps {
  children: React.ReactNode;
  title: string;
  activePage: string;
  role: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
  sidebarProps?: Partial<UniversalSidebarProps>;
}

export const UniversalLayout: React.FC<UniversalLayoutProps> = ({
  children,
  title,
  activePage,
  role,
  subtitle,
  headerActions,
  className,
  sidebarProps = {},
}) => {
  const { user, signOut } = useEnhancedAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Use DoctorSidebar for doctor role */}
      {role === 'doctor' ? (
        <DoctorSidebar
          activePage={activePage}
          user={user}
          onLogout={handleLogout}
          compact={sidebarProps.compact}
        />
      ) : (
        <UniversalSidebar
          role={role}
          activePage={activePage}
          user={user}
          onLogout={handleLogout}
          {...sidebarProps}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            {/* Mobile menu button space - handled by UniversalSidebar */}
            <div className="lg:hidden w-10" />

            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <span>Hospital Management System</span>
                {user && (
                  <>
                    <span className="text-gray-400">•</span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {user.role?.toUpperCase()}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header Actions & User Menu */}
          <div className="flex items-center gap-3">
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
            {user && (
              <UserMenu user={user} onLogout={handleLogout} />
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className={cn('flex-1 p-4 lg:p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Convenience components for specific roles
export interface AdminLayoutProps extends Omit<UniversalLayoutProps, 'role'> {}

export const AdminLayout: React.FC<AdminLayoutProps> = (props) => (
  <UniversalLayout {...props} role="admin" />
);

export interface DoctorLayoutProps extends Omit<UniversalLayoutProps, 'role'> {}

export const DoctorLayout: React.FC<DoctorLayoutProps> = (props) => (
  <UniversalLayout {...props} role="doctor" sidebarProps={{ compact: true, ...props.sidebarProps }} />
);

export interface PatientLayoutProps extends Omit<UniversalLayoutProps, 'role'> {}

export const PatientLayout: React.FC<PatientLayoutProps> = (props) => (
  <UniversalLayout {...props} role="patient" />
);

// Hook for easy sidebar configuration
export function useSidebarConfig(role: string) {
  const { getSidebarConfig } = require('./SidebarConfig');
  return getSidebarConfig(role);
}

// Example usage component
export const ExampleUsage: React.FC = () => {
  return (
    <AdminLayout
      title="Dashboard"
      activePage="dashboard"
      subtitle="Welcome to the admin dashboard"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button size="sm">
            Add New
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Dashboard content */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Patients</h3>
            <p className="text-3xl font-bold text-blue-600">1,234</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Doctors</h3>
            <p className="text-3xl font-bold text-green-600">56</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Appointments Today</h3>
            <p className="text-3xl font-bold text-orange-600">89</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">$45,678</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Convenience component for Patient Layout (alternative implementation)
export const PatientLayoutAlt: React.FC<{
  children: React.ReactNode;
  title: string;
  activePage: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
}> = ({ children, title, activePage, subtitle, headerActions, className }) => {
  return (
    <UniversalLayout
      role="patient"
      title={title}
      activePage={activePage}
      subtitle={subtitle}
      headerActions={headerActions}
      className={className}
    >
      {children}
    </UniversalLayout>
  );
};

export default UniversalLayout;
