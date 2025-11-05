"use client";

import { useState } from "react";
import { useAuth } from "../components/auth/AuthContext";
import { LoginForm } from "../components/auth/LoginForm";
import { MainLayout } from "../components/layout/MainLayout";
import { LandingPage } from "../components/LandingPage";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  if (showLogin) {
    return <LoginForm onBackToLanding={() => setShowLogin(false)} />;
  }

  return <LandingPage onShowLogin={() => setShowLogin(true)} />;
}
