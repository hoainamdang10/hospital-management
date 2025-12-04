import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Hospital Management System V2',
  description: 'Hệ thống quản lý bệnh viện hiện đại và toàn diện',
  keywords: ['hospital', 'healthcare', 'management', 'bệnh viện', 'y tế'],
  authors: [{ name: 'Hospital Management Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0066CC',
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
