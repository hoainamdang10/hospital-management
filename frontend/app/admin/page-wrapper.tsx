'use client';

import React from 'react';
import EnhancedAdminLayout from './enhanced-layout';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  title: string;
  activePage: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export function AdminPageWrapper({
  children,
  title,
  activePage,
  subtitle,
  headerActions,
}: AdminPageWrapperProps) {
  return (
    <EnhancedAdminLayout
      title={title}
      activePage={activePage}
      subtitle={subtitle}
      headerActions={headerActions}
    >
      {children}
    </EnhancedAdminLayout>
  );
}

// HOC để wrap admin pages
export function withAdminLayout<P extends object>(
  Component: React.ComponentType<P>,
  layoutProps: {
    title: string;
    activePage: string;
    subtitle?: string;
    headerActions?: React.ReactNode;
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <AdminPageWrapper {...layoutProps}>
        <Component {...props} />
      </AdminPageWrapper>
    );
  };
}
