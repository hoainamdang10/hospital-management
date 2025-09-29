'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Phone,
  Mail,
  MapPin,
  Heart,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useTheme } from 'next-themes';

export function Footer() {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  const footerLinks = {
    company: [
      { label: t('footer.aboutUs'), href: '/about' },
      { label: t('footer.services'), href: '/departments' },
      { label: t('footer.contact'), href: '/contact' },
      { label: 'FAQ', href: '/faq' },
    ],
    services: [
      { label: language === 'vi' ? 'Đặt lịch khám' : 'Book Appointment', href: '/book-appointment' },
      { label: language === 'vi' ? 'Tìm bác sĩ' : 'Find Doctors', href: '/doctors' },
      { label: language === 'vi' ? 'Khám từ xa' : 'Telemedicine', href: '/telemedicine' },
      { label: language === 'vi' ? 'Cấp cứu 24/7' : '24/7 Emergency', href: '/emergency' },
    ],
    legal: [
      { label: t('footer.privacy'), href: '/privacy-policy' },
      { label: t('footer.terms'), href: '/terms-of-service' },
      { label: language === 'vi' ? 'Chính sách cookie' : 'Cookie Policy', href: '/cookie-policy' },
      { label: language === 'vi' ? 'Bảo mật dữ liệu' : 'Data Security', href: '/data-security' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  const contactInfo = [
    {
      icon: Phone,
      label: t('footer.hotline'),
      value: '+84 (028) 1234 5678',
      href: 'tel:+842812345678',
    },
    {
      icon: Mail,
      label: t('footer.email'),
      value: 'info@hospital.com',
      href: 'mailto:info@hospital.com',
    },
    {
      icon: MapPin,
      label: t('footer.address'),
      value: language === 'vi' 
        ? '123 Đường ABC, Quận 1, TP.HCM' 
        : '123 ABC Street, District 1, HCMC',
      href: '#',
    },
  ];

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand & Description */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  <div className="text-primary font-bold text-2xl mr-2">H</div>
                  <div>
                    <div className="text-primary font-bold text-lg">Hospital</div>
                    <div className="text-muted-foreground text-xs">Management</div>
                  </div>
                </div>
              </Link>
              
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {language === 'vi' 
                  ? 'Hệ thống quản lý bệnh viện hiện đại, cung cấp dịch vụ y tế chất lượng cao với công nghệ tiên tiến và đội ngũ chuyên nghiệp.'
                  : 'Modern hospital management system providing high-quality healthcare services with advanced technology and professional staff.'
                }
              </p>

              {/* Social Links */}
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    asChild
                  >
                    <Link href={social.href} aria-label={social.label}>
                      <social.icon className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold mb-4">
                {language === 'vi' ? 'Công ty' : 'Company'}
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Links */}
            <div>
              <h3 className="font-semibold mb-4">
                {language === 'vi' ? 'Dịch vụ' : 'Services'}
              </h3>
              <ul className="space-y-3">
                {footerLinks.services.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold mb-4">
                {language === 'vi' ? 'Liên hệ' : 'Contact'}
              </h3>
              <ul className="space-y-3">
                {contactInfo.map((contact, index) => (
                  <li key={index}>
                    <Link
                      href={contact.href}
                      className="flex items-start gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <contact.icon className="h-4 w-4 mt-0.5 flex-shrink-0 group-hover:text-primary" />
                      <div>
                        <div className="font-medium">{contact.label}</div>
                        <div>{contact.value}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bottom Footer */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-red-500" />
              <span>© 2025 {t('footer.rights')}</span>
            </div>

            {/* Legal Links */}
            <div className="hidden md:flex items-center space-x-6">
              {footerLinks.legal.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Settings */}
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="h-8 px-2"
              >
                <Globe className="h-4 w-4 mr-1" />
                <span className="text-xs">
                  {language === 'vi' ? 'EN' : 'VI'}
                </span>
              </Button>

              {/* Theme Switcher */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-8 px-2"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </div>
          </div>

          {/* Mobile Legal Links */}
          <div className="md:hidden mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-wrap justify-center gap-4">
              {footerLinks.legal.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
