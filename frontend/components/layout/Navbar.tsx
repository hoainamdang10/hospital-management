'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Settings, ChevronDown, Menu, Wallet, Heart, Stethoscope, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotificationCenter } from '@/components/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Navbar Component
 * Top navigation bar with user menu and notifications
 */
export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isPatientRole = user?.role?.toUpperCase() === 'PATIENT';
  const patientId = isPatientRole ? user?.patientId : undefined;
  const { account, isLoading: walletLoading } = useWallet(patientId);

  // DEV_MODE: Bypass authentication check
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const showAuthenticatedUI = isAuthenticated || isDevMode;

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show navbar on auth pages
  if (
    pathname?.startsWith('/auth/login') ||
    pathname?.startsWith('/auth/register') ||
    pathname?.startsWith('/auth/verify-email')
  ) {
    return null;
  }

  // In DEV_MODE, detect role from pathname
  let displayName = user?.fullName || user?.email || 'Bệnh nhân';
  let displayRole = user?.role || 'PATIENT';

  if (isDevMode && !user) {
    if (pathname?.startsWith('/patient')) {
      displayName = 'Bệnh nhân';
      displayRole = 'PATIENT';
    } else if (pathname?.startsWith('/doctor')) {
      displayName = 'Bác sĩ';
      displayRole = 'DOCTOR';
    } else if (pathname?.startsWith('/admin')) {
      displayName = 'Quản trị viên';
      displayRole = 'ADMIN';
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    const r = role?.toUpperCase();
    switch (r) {
      case 'DOCTOR':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'ADMIN':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getRoleLabel = (role: string) => {
    const r = role?.toUpperCase();
    switch (r) {
      case 'DOCTOR':
        return 'Bác sĩ';
      case 'ADMIN':
        return 'Quản trị viên';
      case 'PATIENT':
        return 'Bệnh nhân';
      default:
        return role?.toLowerCase().replace('_', ' ') || 'Guest';
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-[60] border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section: Hamburger + Logo */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu (Mobile Only) */}
          {showAuthenticatedUI && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar}
              className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </motion.button>
          )}

          {/* Logo - Medigo */}
          <Link href={ROUTES.HOME} className="group flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 shadow-lg shadow-cyan-500/25"
            >
              <Heart className="h-6 w-6 text-white" fill="white" fillOpacity={0.3} />
              <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
            </motion.div>
            <div className="hidden sm:block">
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                Medigo
              </span>
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Healthcare Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {showAuthenticatedUI ? (
            <>
              {/* Wallet for Patient */}
              {isPatientRole && patientId && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/patient/billing"
                    className="flex items-center gap-2 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:shadow-md hover:border-emerald-300"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>{walletLoading ? '...' : formatCurrency(account?.balance ?? 0)}</span>
                  </Link>
                </motion.div>
              )}

              {/* Notifications */}
              <NotificationCenter />

              {/* User Menu with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 transition-all',
                    isDropdownOpen
                      ? 'bg-slate-100 shadow-inner'
                      : 'hover:bg-slate-50'
                  )}
                  aria-label="User menu"
                >
                  {/* User Info */}
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      getRoleBadgeStyle(displayRole)
                    )}>
                      {getRoleLabel(displayRole)}
                    </span>
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-2 ring-slate-100">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-white">
                      {displayName?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Dropdown Arrow */}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-slate-500 transition-transform duration-200',
                      isDropdownOpen && 'rotate-180'
                    )}
                  />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                    >
                      {/* User Header in Dropdown */}
                      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                        <p className="text-xs text-slate-500">{user?.email || 'user@medigo.vn'}</p>
                      </div>

                      <div className="py-1.5">
                        <Link
                          href="/settings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                            <Settings className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="font-medium">Cài đặt</span>
                        </Link>

                        <button
                          onClick={handleLogoutClick}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-rose-50"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                            <LogOut className="h-4 w-4 text-rose-600" />
                          </div>
                          <span className="font-medium text-rose-600">Đăng xuất</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href={ROUTES.LOGIN}>
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-200 bg-white px-5 font-semibold transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                >
                  Đăng nhập
                </Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-700 hover:to-teal-700 hover:shadow-xl">
                    Đăng ký
                  </Button>
                </motion.div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <LogOut className="h-7 w-7 text-rose-600" />
            </div>
            <DialogTitle className="text-center text-xl">Đăng xuất khỏi Medigo?</DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleLogoutConfirm}
              className="w-full rounded-xl bg-rose-600 py-2.5 font-semibold hover:bg-rose-700"
            >
              Đăng xuất
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              className="w-full rounded-xl py-2.5 font-semibold"
            >
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
