'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Facebook, Twitter, Linkedin, Instagram, Search, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PublicLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children, currentPage }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <div className="bg-[#003087] text-white py-2 px-4 md:px-8 flex justify-between items-center">
        <div className="flex space-x-4">
          <Link href="#" aria-label="Facebook">
            <Facebook size={18} />
          </Link>
          <Link href="#" aria-label="Twitter">
            <Twitter size={18} />
          </Link>
          <Link href="#" aria-label="LinkedIn">
            <Linkedin size={18} />
          </Link>
          <Link href="#" aria-label="Instagram">
            <Instagram size={18} />
          </Link>
        </div>
        <div className="flex items-center">
          <Phone size={18} className="mr-2" />
          <span>+1-123-5663582</span>
        </div>
      </div>

      {/* Navigation */}
      <header className="bg-white py-4 px-4 md:px-8 flex justify-between items-center border-b">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="text-[#003087] font-bold text-4xl mr-2">H</div>
            <div>
              <div className="text-[#003087] font-bold text-xl">Hospital</div>
              <div className="text-gray-700">Management</div>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex space-x-6 ml-10">
          <Link 
            href="/" 
            className={`font-medium ${currentPage === 'home' ? 'text-[#003087] font-bold' : 'hover:text-[#003087]'}`}
          >
            Trang chủ
          </Link>
          <Link 
            href="/about" 
            className={`font-medium ${currentPage === 'about' ? 'text-[#003087] font-bold' : 'hover:text-[#003087]'}`}
          >
            Giới thiệu
          </Link>
          <Link 
            href="/doctors" 
            className={`font-medium ${currentPage === 'doctors' ? 'text-[#003087] font-bold' : 'hover:text-[#003087]'}`}
          >
            Bác sĩ
          </Link>
          <Link href="/services" className="font-medium hover:text-[#003087]">
            Dịch vụ
          </Link>
          <Link href="/patient/appointments" className="font-medium hover:text-[#003087]">
            Đặt lịch khám
          </Link>
          <Link href="/contact" className="font-medium hover:text-[#003087]">
            Liên hệ
          </Link>
          <Link href="/auth/login" className="font-medium hover:text-[#003087]">
            Đăng nhập / Đăng ký
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button aria-label="Search">
            <Search size={20} />
          </button>
          <Button variant="default" size="icon" className="md:hidden bg-[#003087]">
            <Menu />
          </Button>
          <Button variant="default" size="icon" className="hidden md:flex bg-[#003087]">
            <Menu />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                About Us
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-gray-900">
                Services
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                Contact
              </Link>
              <Link href="/privacy-policy" className="text-gray-600 hover:text-gray-900">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                Terms of Service
              </Link>
            </div>
            <div className="text-gray-600">© 2025 Hospital Management. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;