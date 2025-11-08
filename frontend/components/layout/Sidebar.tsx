'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  UserCog,
  DollarSign,
  Activity,
  Stethoscope,
  Bell,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, USER_ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/contexts/SidebarContext';

interface MenuItem {
  label: string;
  href: string;
  icon: any;
  submenu?: MenuItem[];
}

/**
 * Sidebar Component
 * Side navigation menu with role-based items
 * Responsive with mobile toggle
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isMobileOpen, setIsMobileOpen, isCollapsed, toggleCollapse } = useSidebar();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  
  // DEV_MODE: Bypass authentication check
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  // Don't show sidebar on public/auth pages
  const isPublicPage =
    pathname === '/' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/about') ||
    pathname?.startsWith('/services') ||
    pathname?.startsWith('/doctors') ||
    pathname?.startsWith('/contact');

  if (isPublicPage) {
    return null;
  }

  // In DEV_MODE, show sidebar even without user
  if (!isDevMode && !user) {
    return null;
  }

  // Detect role from pathname if no user (DEV_MODE)
  let userRole = user?.role;
  if (isDevMode && !userRole) {
    if (pathname?.startsWith('/patient')) userRole = USER_ROLES.PATIENT;
    else if (pathname?.startsWith('/doctor')) userRole = USER_ROLES.DOCTOR;
    else if (pathname?.startsWith('/nurse')) userRole = USER_ROLES.NURSE;
    else if (pathname?.startsWith('/admin')) userRole = USER_ROLES.ADMIN;
    else return null; // Unknown role
  }

  // Get menu items based on user role
  const menuItems = getMenuItemsByRole(userRole!);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] border-r bg-white transition-all duration-300 ease-in-out',
          // Width changes based on collapsed state
          isCollapsed ? 'w-20' : 'w-64',
          // Desktop: always visible
          'lg:translate-x-0',
          // Mobile: slide in/out
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto py-4">
          {/* Close button (mobile only) */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse/Expand button (desktop only) */}
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-8 z-50 hidden rounded-full border border-gray-200 bg-white p-1.5 text-gray-600 shadow-md transition-all hover:bg-gray-50 hover:text-primary-600 lg:block"
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <nav className="flex-1 space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isMenuOpen = openMenus.has(item.label);
              
              // Check if current path matches this item or any submenu item
              const isActive = pathname === item.href || 
                (item.submenu?.some(sub => pathname === sub.href || pathname?.startsWith(sub.href + '/')));

              if (hasSubmenu) {
                // Render parent menu with submenu
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={cn(
                        'group relative flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isCollapsed ? 'justify-center' : 'space-x-3',
                        isActive
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                      )}
                    >
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        isActive 
                          ? 'bg-primary-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {isMenuOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Submenu */}
                    {!isCollapsed && isMenuOpen && (
                      <div className="ml-12 space-y-1">
                        {item.submenu!.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                'block rounded-lg px-3 py-2 text-sm transition-all duration-200',
                                isSubActive
                                  ? 'bg-primary-50 text-primary-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                              )}
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Render regular menu item without submenu
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isCollapsed ? 'justify-center' : 'space-x-3',
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600 hover:translate-x-1'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    isActive 
                      ? 'bg-primary-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {!isCollapsed && <span className="flex-1">{item.label}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 hidden rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg group-hover:block">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

    </>
  );
}

/**
 * Get menu items based on user role
 */
function getMenuItemsByRole(role: string): MenuItem[] {
  switch (role) {
    case USER_ROLES.PATIENT:
      return [
        {
          label: 'Tổng quan',
          href: ROUTES.PATIENT_DASHBOARD,
          icon: LayoutDashboard,
        },
        {
          label: 'Đặt lịch khám',
          href: ROUTES.PATIENT_BOOK_APPOINTMENT,
          icon: Calendar,
        },
        {
          label: 'Lịch hẹn của tôi',
          href: ROUTES.PATIENT_APPOINTMENTS,
          icon: ClipboardList,
        },
        {
          label: 'Hồ sơ bệnh án',
          href: ROUTES.PATIENT_MEDICAL_HISTORY,
          icon: FileText,
        },
        {
          label: 'Hồ sơ cá nhân',
          href: ROUTES.PATIENT_PROFILE,
          icon: Users,
        },
        {
          label: 'Thanh toán',
          href: ROUTES.PATIENT_BILLING,
          icon: CreditCard,
        },
        {
          label: 'Tùy chọn',
          href: '/patient/preferences',
          icon: Bell,
        },
      ];

    case USER_ROLES.DOCTOR:
      return [
        {
          label: 'Tổng quan',
          href: ROUTES.DOCTOR_DASHBOARD,
          icon: LayoutDashboard,
        },
        {
          label: 'Lịch làm việc',
          href: ROUTES.DOCTOR_SCHEDULE,
          icon: Calendar,
        },
        {
          label: 'Hàng đợi',
          href: ROUTES.DOCTOR_QUEUE,
          icon: Users,
        },
        {
          label: 'Khám bệnh',
          href: ROUTES.DOCTOR_EXAMINATION,
          icon: Stethoscope,
        },
        {
          label: 'Hồ sơ bệnh án',
          href: ROUTES.DOCTOR_MEDICAL_RECORDS,
          icon: FileText,
        },
        {
          label: 'Đơn thuốc',
          href: ROUTES.DOCTOR_PRESCRIPTIONS,
          icon: ClipboardList,
        },
      ];

    case USER_ROLES.NURSE:
      return [
        {
          label: 'Tổng quan',
          href: ROUTES.NURSE_DASHBOARD,
          icon: LayoutDashboard,
        },
        {
          label: 'Check-in bệnh nhân',
          href: ROUTES.NURSE_CHECK_IN,
          icon: ClipboardList,
        },
        {
          label: 'Ghi nhận sinh hiệu',
          href: ROUTES.NURSE_VITALS,
          icon: Activity,
        },
        {
          label: 'Danh sách bệnh nhân',
          href: '/nurse/patients',
          icon: Users,
        },
      ];

    case USER_ROLES.ADMIN:
    case USER_ROLES.SUPER_ADMIN:
      return [
        {
          label: 'Tổng quan',
          href: ROUTES.ADMIN_DASHBOARD,
          icon: LayoutDashboard,
        },
        {
          label: 'Quản lý bác sĩ',
          href: '/admin/doctors',
          icon: Stethoscope,
          submenu: [
            { label: 'Danh sách bác sĩ', href: '/admin/doctors', icon: Users },
            { label: 'Lịch làm việc', href: '/admin/doctors/schedule', icon: Calendar },
          ],
        },
        {
          label: 'Quản lý bệnh nhân',
          href: ROUTES.ADMIN_PATIENTS,
          icon: Users,
          submenu: [
            { label: 'Danh sách bệnh nhân', href: ROUTES.ADMIN_PATIENTS, icon: Users },
            { label: 'Thêm bệnh nhân', href: '/admin/patients/add', icon: Users },
            { label: 'Hồ sơ bệnh án', href: '/admin/patients/records', icon: FileText },
            { label: 'Báo cáo bệnh nhân', href: '/admin/patients/reports', icon: ClipboardList },
          ],
        },
        {
          label: 'Quản lý lịch hẹn',
          href: '/admin/appointments',
          icon: Calendar,
          submenu: [
            { label: 'Tất cả lịch hẹn', href: '/admin/appointments', icon: Calendar },
            { label: 'Tạo lịch hẹn', href: '/admin/appointments/add', icon: Calendar },
            { label: 'Xem lịch', href: '/admin/appointments/calendar', icon: Calendar },
            { label: 'Yêu cầu lịch hẹn', href: '/admin/appointments/requests', icon: ClipboardList },
          ],
        },
        {
          label: 'Quản lý khoa',
          href: '/admin/departments',
          icon: Activity,
          submenu: [
            { label: 'Danh sách khoa', href: '/admin/departments', icon: Activity },
            { label: 'Thêm khoa', href: '/admin/departments/add', icon: Activity },
            { label: 'Phòng ban', href: '/admin/departments/rooms', icon: FileText },
          ],
        },
        {
          label: 'Quản lý nhân viên',
          href: ROUTES.ADMIN_STAFF,
          icon: UserCog,
          submenu: [
            { label: 'Danh sách nhân viên', href: ROUTES.ADMIN_STAFF, icon: UserCog },
            { label: 'Thêm nhân viên', href: '/admin/staff/add', icon: UserCog },
            { label: 'Phân quyền', href: '/admin/roles', icon: UserCog },
          ],
        },
        {
          label: 'Quản lý người dùng',
          href: ROUTES.ADMIN_USERS,
          icon: Users,
          submenu: [
            { label: 'Danh sách người dùng', href: ROUTES.ADMIN_USERS, icon: Users },
            { label: 'Thêm người dùng', href: '/admin/users/add', icon: Users },
            { label: 'Nhật ký hoạt động', href: ROUTES.ADMIN_AUDIT_LOGS, icon: ClipboardList },
          ],
        },
        {
          label: 'Báo cáo tài chính',
          href: ROUTES.ADMIN_BILLING_REPORTS,
          icon: DollarSign,
          submenu: [
            { label: 'Tổng quan tài chính', href: ROUTES.ADMIN_BILLING_REPORTS, icon: DollarSign },
            { label: 'Hóa đơn', href: ROUTES.ADMIN_INVOICES, icon: FileText },
            { label: 'Thanh toán', href: '/admin/billing/payments', icon: CreditCard },
          ],
        },
      ];

    default:
      return [];
  }
}
