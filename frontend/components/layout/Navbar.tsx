'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Settings, ChevronDown, Menu, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotificationCenter } from '@/components/shared';

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
    } else if (pathname?.startsWith('/nurse')) {
      displayName = 'Y tá';
      displayRole = 'NURSE';
    } else if (pathname?.startsWith('/admin')) {
      displayName = 'Quản trị viên';
      displayRole = 'ADMIN';
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section: Hamburger + Logo */}
        <div className="flex items-center space-x-4">
          {/* Hamburger Menu (Mobile Only) */}
          {showAuthenticatedUI && (
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2">
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg text-white">
              <span className="text-xl font-bold">H</span>
            </div>
            <span className="hidden text-lg font-semibold text-gray-900 sm:block">
              Hospital Management
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {showAuthenticatedUI ? (
            <>
              {isPatientRole && patientId && (
                <Link
                  href="/patient/billing"
                  className="ring-primary/20 hover:ring-primary/40 flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 hover:shadow-sm hover:ring"
                >
                  <Wallet className="mr-1.5 h-4 w-4" />
                  {walletLoading ? 'Đang tải...' : formatCurrency(account?.balance ?? 0)}
                </Link>
              )}

              <NotificationCenter />

              {/* User Menu with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
                  aria-label="User menu"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {displayRole?.toLowerCase().replace('_', ' ') || 'Guest'}
                    </p>
                  </div>

                  {/* Avatar */}
                  <div className="bg-primary-100 text-primary-700 flex h-10 w-10 items-center justify-center rounded-full">
                    <User className="h-5 w-5" />
                  </div>

                  {/* Dropdown Arrow */}
                  <ChevronDown
                    className={`h-4 w-4 text-gray-600 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-xl duration-200">
                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-3 border-b border-gray-100 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Settings className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">Cài đặt</span>
                      </Link>
                      <button
                        onClick={handleLogoutClick}
                        className="flex w-full items-center space-x-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <LogOut className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href={ROUTES.LOGIN}>
                <Button
                  variant="outline"
                  className="border-gray-300 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                >
                  Đăng nhập
                </Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button className="from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 bg-linear-to-r text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng xuất</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn đăng xuất?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleLogoutConfirm} className="bg-red-600 hover:bg-red-700">
              Đăng xuất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
