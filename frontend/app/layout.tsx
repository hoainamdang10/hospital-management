import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hospital Management System - Modern Healthcare Platform",
  description:
    "Book appointments, access medical records, and connect with top healthcare professionals. Modern, secure, and HIPAA-compliant healthcare management system.",
  keywords: ["hospital", "healthcare", "doctor", "appointment", "medical records", "telemedicine"],
  authors: [{ name: "HMS Team" }],
  openGraph: {
    title: "Hospital Management System",
    description: "Modern Healthcare Platform - Book appointments and manage your health online",
    type: "website",
    locale: "vi_VN",
    siteName: "HMS",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
