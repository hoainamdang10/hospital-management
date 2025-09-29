import { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    default: 'Hospital Management System - Đặt lịch khám thông minh',
    template: '%s | Hospital Management System',
  },
  description: 'Hệ thống quản lý bệnh viện hiện đại với dịch vụ đặt lịch khám thông minh, bác sĩ chuyên nghiệp và công nghệ tiên tiến. Đặt lịch nhanh chóng, an toàn và tiện lợi.',
  keywords: [
    'bệnh viện',
    'đặt lịch khám',
    'bác sĩ',
    'y tế',
    'sức khỏe',
    'hospital',
    'appointment booking',
    'healthcare',
    'medical',
    'telemedicine',
    'khám từ xa',
  ],
  authors: [{ name: 'Hospital Management Team' }],
  creator: 'Hospital Management System',
  publisher: 'Hospital Management System',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'vi-VN': '/vi',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    title: 'Hospital Management System - Đặt lịch khám thông minh',
    description: 'Hệ thống quản lý bệnh viện hiện đại với dịch vụ đặt lịch khám thông minh, bác sĩ chuyên nghiệp và công nghệ tiên tiến.',
    siteName: 'Hospital Management System',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hospital Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hospital Management System - Đặt lịch khám thông minh',
    description: 'Hệ thống quản lý bệnh viện hiện đại với dịch vụ đặt lịch khám thông minh, bác sĩ chuyên nghiệp và công nghệ tiên tiến.',
    images: ['/og-image.jpg'],
    creator: '@hospital_mgmt',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  category: 'healthcare',
  classification: 'Healthcare Management System',
  referrer: 'origin-when-cross-origin',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#003087',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hospital Management',
  },
  applicationName: 'Hospital Management System',
  generator: 'Next.js',
  abstract: 'Modern hospital management system with smart appointment booking, professional doctors, and advanced technology.',
  archives: [],
  assets: [],
  bookmarks: [],
  other: {
    'msapplication-TileColor': '#003087',
    'msapplication-config': '/browserconfig.xml',
  },
};

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
