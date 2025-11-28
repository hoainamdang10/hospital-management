'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Stethoscope } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b bg-white/80 shadow-sm backdrop-blur-md'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              Hospital<span className="text-primary">V2</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            {[
              { label: 'Trang chủ', href: '/' },
              { label: 'Giới thiệu', href: '/about' },
              { label: 'Dịch vụ', href: '/services' },
              { label: 'Bác sĩ', href: '/doctors' },
              { label: 'Liên hệ', href: '/contact' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden items-center space-x-4 md:flex">
            <Link href="/auth/login">
              <Button variant="ghost" className="font-medium text-gray-600 hover:text-primary hover:bg-primary/5">
                Đăng nhập
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="rounded-full bg-primary px-6 shadow-lg shadow-primary/20 hover:bg-primary-600 hover:shadow-primary/30">
                Đăng ký
              </Button>
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
          <div className="absolute left-0 right-0 top-full border-b bg-white p-4 shadow-lg md:hidden">
            <div className="flex flex-col space-y-4">
              {[
                { label: 'Trang chủ', href: '/' },
                { label: 'Giới thiệu', href: '/about' },
                { label: 'Dịch vụ', href: '/services' },
                { label: 'Bác sĩ', href: '/doctors' },
                { label: 'Liên hệ', href: '/contact' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-gray-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col space-y-3 pt-4 border-t">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full justify-center">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="w-full justify-center">Đăng ký</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
