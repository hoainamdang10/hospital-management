'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { useSidebar } from '@/lib/contexts/SidebarContext';

/**
 * Navbar Component
 * Top navigation bar with user menu and notifications
 */
export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // DEV_MODE: Bypass authentication check
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const showAuthenticatedUI = isAuthenticated || isDevMode;

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
    }
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
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null;
  }

  // In DEV_MODE, detect role from pathname
  let displayEmail = user?.email || 'Bệnh nhân';
  let displayRole = user?.role || 'PATIENT';
  
  if (isDevMode && !user) {
    if (pathname?.startsWith('/patient')) {
      displayEmail = 'Bệnh nhân';
      displayRole = 'PATIENT';
    } else if (pathname?.startsWith('/doctor')) {
      displayEmail = 'Bác sĩ';
      displayRole = 'DOCTOR';
    } else if (pathname?.startsWith('/nurse')) {
      displayEmail = 'Y tá';
      displayRole = 'NURSE';
    } else if (pathname?.startsWith('/admin')) {
      displayEmail = 'Quản trị viên';
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
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
              {/* Notifications */}
              <button 
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Thông báo"
                title="Thông báo"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* User Menu with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {displayEmail}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {displayRole?.toLowerCase().replace('_', ' ') || 'Guest'}
                    </p>
                  </div>

                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
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
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <Settings className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">Cài đặt</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
            <div className="flex items-center space-x-2">
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost">Đăng nhập</Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button>Đăng ký</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
