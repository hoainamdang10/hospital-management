import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Medigo - Healthcare Platform',
  description: 'Nền tảng chăm sóc sức khỏe thông minh - Đặt lịch khám, tư vấn trực tuyến, quản lý hồ sơ y tế',
  keywords: ['medigo', 'healthcare', 'đặt lịch khám', 'bệnh viện', 'y tế', 'bác sĩ', 'sức khỏe'],
  authors: [{ name: 'Medigo Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0891B2',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
