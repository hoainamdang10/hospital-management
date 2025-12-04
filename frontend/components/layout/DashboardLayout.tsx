'use client';

import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { cn } from '@/lib/utils';

/**
 * Dashboard Layout Component
 * Wrapper layout for authenticated pages with Navbar and Sidebar
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main
          className={cn(
            'flex-1 p-6 transition-all duration-300',
            isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          )}
        >
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
