'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggle = () => setIsMobileOpen(prev => !prev);
  const toggleCollapse = () => setIsCollapsed(prev => !prev);

  return (
    <SidebarContext.Provider value={{ 
      isMobileOpen, 
      setIsMobileOpen, 
      isCollapsed, 
      setIsCollapsed, 
      toggle,
      toggleCollapse 
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
