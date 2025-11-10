'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">
              🏥 <span className="hidden sm:inline">Hospital V2</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-6 md:flex">
            <Link href="/" className="text-gray-700 hover:text-primary">
              Trang chủ
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary">
              Giới thiệu
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-primary">
              Dịch vụ
            </Link>
            <Link href="/doctors" className="text-gray-700 hover:text-primary">
              Bác sĩ
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary">
              Liên hệ
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden items-center space-x-3 md:flex">
            <Link href="/auth/login">
              <Button variant="outline">Đăng nhập</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Đăng ký</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Giới thiệu
              </Link>
              <Link
                href="/services"
                className="text-gray-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Dịch vụ
              </Link>
              <Link
                href="/doctors"
                className="text-gray-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Bác sĩ
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Liên hệ
              </Link>
              <div className="flex flex-col space-y-2 pt-3">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="w-full">Đăng ký</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
