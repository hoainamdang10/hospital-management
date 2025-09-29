'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSidebarConfig, type SidebarConfig, type MenuItem, type MenuSection } from './SidebarConfig';

export interface UniversalSidebarProps {
  role: string;
  activePage: string;
  user?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
  onLogout?: () => void;
  className?: string;
  customConfig?: SidebarConfig;
  compact?: boolean;
}

interface SidebarItemProps {
  item: MenuItem;
  active: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, active, onClick, compact = false }) => {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-lg transition-all duration-200 group',
        compact ? 'px-2 py-2 mx-1' : 'px-4 py-3 mx-2',
        active
          ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600 shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <div className={cn("flex items-center", compact ? "space-x-2" : "space-x-3")}>
        <Icon
          size={compact ? 16 : 20}
          className={cn(
            'transition-colors',
            active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
          )}
        />
        <span className={cn("font-medium", compact ? "text-sm" : "")}>{item.label}</span>
      </div>
      {item.badge && (
        <Badge
          variant={item.badgeVariant || 'default'}
          className="text-xs"
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );
};

interface SidebarSectionProps {
  section: MenuSection;
  activePage: string;
  onItemClick?: () => void;
  compact?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ section, activePage, onItemClick, compact = false }) => {
  return (
    <div className="space-y-1">
      {section.title && (
        <div className={cn("py-2", compact ? "px-2" : "px-4")}>
          <h3 className={cn("font-semibold text-gray-500 uppercase tracking-wider", compact ? "text-xs" : "text-xs")}>
            {section.title}
          </h3>
        </div>
      )}
      {section.items.map((item) => (
        <SidebarItem
          key={item.page}
          item={item}
          active={activePage === item.page}
          onClick={onItemClick}
          compact={compact}
        />
      ))}
    </div>
  );
};



export const UniversalSidebar: React.FC<UniversalSidebarProps> = ({
  role,
  activePage,
  user,
  onLogout,
  className,
  customConfig,
  compact = false,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const config = customConfig || getSidebarConfig(role);

  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col',
        compact ? 'w-52' : 'w-64',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        className
      )}>
        {/* Header */}
        <div className={cn('border-b', config.branding.bgColor, compact ? 'p-4' : 'p-6')}>
          <div className={cn("flex items-center", compact ? "gap-2" : "gap-3")}>
            {config.branding.logo}
            <div>
              <h1 className={cn("font-bold text-gray-900", compact ? "text-lg" : "text-xl")}>
                {config.branding.title}
              </h1>
              <p className={cn("text-gray-600", compact ? "text-xs" : "text-sm")}>
                {config.branding.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto", compact ? "p-3 space-y-4" : "p-4 space-y-6")}>
          {config.sections.map((section, index) => (
            <SidebarSection
              key={index}
              section={section}
              activePage={activePage}
              onItemClick={closeMobileSidebar}
              compact={compact}
            />
          ))}
        </nav>
      </div>
    </>
  );
};
