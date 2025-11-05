import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "../components/auth/AuthContext";
import { ThemeProvider } from "../components/common/ThemeProvider";
import { NotificationProvider } from "../components/communication/NotificationSystem";
import {
  PWAInstallPrompt,
  IOSInstallPrompt,
} from "../components/common/PWAInstallPrompt";
import { ChatSystem } from "../components/communication/ChatSystem";
import { Toaster } from "../components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediCare Hospital - Hệ thống quản lý bệnh viện",
  description:
    "Hệ thống quản lý bệnh viện hiện đại với giao diện thân thiện và tính năng toàn diện",
  keywords: "bệnh viện, quản lý, y tế, sức khỏe, medicare",
  authors: [{ name: "MediCare Hospital" }],
  creator: "MediCare Hospital",
  publisher: "MediCare Hospital",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://medicare-hospital.com"),
  openGraph: {
    title: "MediCare Hospital - Hệ thống quản lý bệnh viện",
    description:
      "Hệ thống quản lý bệnh viện hiện đại với giao diện thân thiện và tính năng toàn diện",
    url: "https://medicare-hospital.com",
    siteName: "MediCare Hospital",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MediCare Hospital Management System",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediCare Hospital - Hệ thống quản lý bệnh viện",
    description:
      "Hệ thống quản lý bệnh viện hiện đại với giao diện thân thiện và tính năng toàn diện",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <NotificationProvider>
              {children}
              <Toaster position="top-right" />
              <PWAInstallPrompt />
              <IOSInstallPrompt />
              <ChatSystem />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
