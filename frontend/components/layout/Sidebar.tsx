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
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, USER_ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';

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
    pathname?.startsWith('/auth/login') ||
    pathname?.startsWith('/auth/register') ||
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
    else if (pathname?.startsWith('/admin')) userRole = USER_ROLES.ADMIN;
    else return null; // Unknown role
  }

  // Get menu items based on user role
  const menuItems = getMenuItemsByRole(userRole!);

  // Get role-specific accent colors
  const getRoleAccent = () => {
    switch (userRole) {
      case USER_ROLES.DOCTOR:
        return {
          gradient: 'from-cyan-500 via-teal-500 to-emerald-500',
          bgActive: 'bg-cyan-50',
          textActive: 'text-cyan-700',
          iconBg: 'bg-gradient-to-br from-cyan-500 to-teal-500',
          iconHover: 'group-hover:bg-cyan-100 group-hover:text-cyan-600',
          border: 'border-cyan-200',
        };
      case USER_ROLES.ADMIN:
        return {
          gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
          bgActive: 'bg-violet-50',
          textActive: 'text-violet-700',
          iconBg: 'bg-gradient-to-br from-violet-500 to-purple-500',
          iconHover: 'group-hover:bg-violet-100 group-hover:text-violet-600',
          border: 'border-violet-200',
        };
      default: // PATIENT
        return {
          gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
          bgActive: 'bg-emerald-50',
          textActive: 'text-emerald-700',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
          iconHover: 'group-hover:bg-emerald-100 group-hover:text-emerald-600',
          border: 'border-emerald-200',
        };
    }
  };

  const accent = getRoleAccent();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] border-r border-slate-200/80 bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out',
          // Width changes based on collapsed state
          isCollapsed ? 'w-[76px]' : 'w-64',
          // Desktop: always visible
          'lg:translate-x-0',
          // Mobile: slide in/out
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Gradient accent line at top */}
        <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', accent.gradient)} />

        <div className="flex h-full flex-col overflow-y-auto py-5 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-4 right-4 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse/Expand button (desktop only) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleCollapse}
            className={cn(
              'absolute top-6 -right-3.5 z-50 hidden h-7 w-7 items-center justify-center rounded-full border bg-white shadow-md transition-all lg:flex',
              accent.border
            )}
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            )}
          </motion.button>

          {/* Menu Items */}
          <nav className="flex-1 space-y-1.5 px-3">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isMenuOpen = openMenus.has(item.label);

              // Check if current path matches this item or any submenu item
              const isActive =
                pathname === item.href ||
                item.submenu?.some(
                  (sub) => pathname === sub.href || pathname?.startsWith(sub.href + '/')
                );

              if (hasSubmenu) {
                // Render parent menu with submenu
                return (
                  <div key={item.label} className="space-y-1">
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleMenu(item.label)}
                      className={cn(
                        'group relative flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                        isCollapsed ? 'justify-center' : 'gap-3',
                        isActive
                          ? cn(accent.bgActive, accent.textActive)
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                          isActive
                            ? cn(accent.iconBg, 'text-white shadow-lg')
                            : cn('bg-slate-100 text-slate-500', accent.iconHover)
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <motion.div
                            animate={{ rotate: isMenuOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </motion.div>
                        </>
                      )}
                    </motion.button>

                    {/* Submenu */}
                    <AnimatePresence>
                      {!isCollapsed && isMenuOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-[52px] space-y-1 overflow-hidden"
                        >
                          {item.submenu!.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  'relative block rounded-lg px-4 py-2.5 text-sm transition-all duration-200',
                                  isSubActive
                                    ? cn(accent.bgActive, accent.textActive, 'font-medium')
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                )}
                              >
                                {/* Active indicator dot */}
                                {isSubActive && (
                                  <span className={cn('absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full', accent.iconBg)} />
                                )}
                                {subItem.label}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // Render regular menu item without submenu
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                      isCollapsed ? 'justify-center' : 'gap-3',
                      isActive
                        ? cn(accent.bgActive, accent.textActive)
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className={cn('absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b', accent.gradient)}
                      />
                    )}

                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                        isActive
                          ? cn(accent.iconBg, 'text-white shadow-lg')
                          : cn('bg-slate-100 text-slate-500', accent.iconHover)
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {!isCollapsed && <span className="flex-1">{item.label}</span>}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 hidden rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-xl group-hover:block">
                        {item.label}
                        <div className="absolute top-1/2 left-0 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Bottom section - Branding */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-auto border-t border-slate-100 px-4 pt-4"
            >
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 p-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br', accent.gradient)}>
                  <Heart className="h-4 w-4 text-white" fill="white" fillOpacity={0.3} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Medigo</p>
                  <p className="text-[10px] text-slate-400">Healthcare Platform</p>
                </div>
              </div>
            </motion.div>
          )}
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
          label: 'Hồ sơ cá nhân',
          href: ROUTES.PATIENT_PROFILE,
          icon: Users,
        },
        {
          label: 'Thanh toán',
          href: ROUTES.PATIENT_BILLING,
          icon: CreditCard,
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
          label: 'Danh sách khám',
          href: '/doctor/appointments',
          icon: ClipboardList,
        },
        {
          label: 'Hồ sơ cá nhân',
          href: '/doctor/profile',
          icon: UserCog,
        },
      ];

    case USER_ROLES.ADMIN:
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
        },
        {
          label: 'Quản lý lịch hẹn',
          href: '/admin/appointments',
          icon: Calendar,
        },
        {
          label: 'Quản lý khoa',
          href: '/admin/departments',
          icon: Activity,
        },
        {
          label: 'Quản lý nhân viên',
          href: ROUTES.ADMIN_STAFF,
          icon: UserCog,
        },
        {
          label: 'Báo cáo tài chính',
          href: ROUTES.ADMIN_BILLING_REPORTS,
          icon: DollarSign,
          submenu: [
            { label: 'Tổng quan tài chính', href: ROUTES.ADMIN_BILLING_REPORTS, icon: DollarSign },
            { label: 'Hóa đơn', href: ROUTES.ADMIN_INVOICES, icon: FileText },
          ],
        },
        {
          label: 'Nhật ký hoạt động',
          href: ROUTES.ADMIN_AUDIT_LOGS,
          icon: ClipboardList,
        },
      ];

    default:
      return [];
  }
}
