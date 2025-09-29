'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Users,
  Calendar,
  Pill,
  BarChart3,
  Award,
  Settings,
  Menu,
  X,
  Stethoscope,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileText
} from 'lucide-react';

interface DoctorSidebarProps {
  activePage?: string;
  user?: any;
  onLogout?: () => void;
  compact?: boolean;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: string;
  description?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/doctors/dashboard',
    description: 'Tổng quan và thống kê nhanh'
  },
  {
    id: 'profile',
    label: 'Hồ sơ cá nhân',
    icon: User,
    path: '/doctors/profile',
    description: 'Thông tin cá nhân và chuyên môn'
  },
  {
    id: 'patients',
    label: 'Quản lý bệnh nhân',
    icon: Users,
    path: '/doctors/patients',
    description: 'Danh sách và hồ sơ bệnh nhân'
  },
  {
    id: 'schedule',
    label: 'Lịch làm việc',
    icon: Calendar,
    path: '/doctors/schedule',
    description: 'Lịch khám, phẫu thuật và trực'
  },
  {
    id: 'prescriptions',
    label: 'Kê đơn thuốc',
    icon: Pill,
    path: '/doctors/prescriptions',
    description: 'Kê đơn và chỉ định xét nghiệm'
  },
  {
    id: 'medical-records',
    label: 'Hồ sơ bệnh án',
    icon: FileText,
    path: '/doctors/medical-records',
    description: 'Quản lý hồ sơ bệnh án và khám bệnh'
  },
  {
    id: 'analytics',
    label: 'Thống kê',
    icon: BarChart3,
    path: '/doctors/analytics',
    description: 'Báo cáo hiệu suất làm việc'
  },
  {
    id: 'certificates',
    label: 'Chứng chỉ',
    icon: Award,
    path: '/doctors/certificates',
    description: 'Quản lý chứng chỉ hành nghề'
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    icon: Settings,
    path: '/doctors/settings',
    description: 'Cài đặt tài khoản và bảo mật'
  }
];

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  activePage,
  user,
  onLogout,
  compact: initialCompact = false
}) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(initialCompact);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCompact = () => setIsCompact(!isCompact);

  const getActiveItem = () => {
    if (activePage) {
      return sidebarItems.find(item => item.id === activePage);
    }
    return sidebarItems.find(item => pathname.startsWith(item.path));
  };

  const activeItem = getActiveItem();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
          'lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCompact ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCompact && (
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-8 w-8 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Doctor Portal</h2>
                  <p className="text-xs text-gray-500">Hospital Management</p>
                </div>
              </div>
            )}
            
            {/* Compact Toggle - Desktop Only */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex"
              onClick={toggleCompact}
            >
              {isCompact ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'DR'}
                </AvatarFallback>
              </Avatar>
              
              {!isCompact && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || 'Doctor'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                  <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                    Bác sĩ
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem?.id === item.id;
            
            return (
              <Link key={item.id} href={item.path}>
                <div
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                    'hover:bg-gray-100',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:text-gray-900'
                  )}
                  title={isCompact ? item.label : undefined}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'text-blue-600')} />
                  
                  {!isCompact && (
                    <>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!isCompact && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Bell className="h-4 w-4" />
                <span>Thông báo mới</span>
                <Badge variant="destructive" className="text-xs">3</Badge>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            {!isCompact && <span className="ml-2">Đăng xuất</span>}
          </Button>
        </div>
      </aside>
    </>
  );
};
