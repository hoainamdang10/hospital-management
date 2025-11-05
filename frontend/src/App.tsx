import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import { ThemeProvider } from "./components/common/ThemeProvider";
import { NotificationProvider } from "./components/communication/NotificationSystem";
import {
  PWAInstallPrompt,
  IOSInstallPrompt,
} from "./components/common/PWAInstallPrompt";

import { LoginForm } from "./components/auth/LoginForm";
import { MainLayout } from "./components/layout/MainLayout";
import { LandingPage } from "./components/LandingPage";
import { PaymentPage } from "./components/billing/PaymentPage";
import { Toaster } from "./components/ui/sonner";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);

  useEffect(() => {
    // Register service worker only in production and if supported
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered successfully: ", registration);
        })
        .catch((registrationError) => {
          console.log(
            "SW registration failed (this is normal in development): ",
            registrationError
          );
        });
    }
  }, []);

  const handleBookAppointment = (data: any) => {
    setAppointmentData(data);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setAppointmentData(null);
    // Could show a success message or redirect
  };

  if (isAuthenticated) {
    return <MainLayout />;
  }

  if (showPayment && appointmentData) {
    return (
      <PaymentPage
        appointmentData={appointmentData}
        onBack={() => setShowPayment(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  if (showLogin) {
    return <LoginForm onBackToLanding={() => setShowLogin(false)} />;
  }

  return (
    <LandingPage
      onShowLogin={() => setShowLogin(true)}
      onBookAppointment={handleBookAppointment}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
          <Toaster position="top-right" />
          <PWAInstallPrompt />
          <IOSInstallPrompt />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
