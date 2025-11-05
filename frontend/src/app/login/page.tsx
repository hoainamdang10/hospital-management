"use client";

import { useEffect } from "react";
import { useAuth } from "../../components/auth/AuthContext";
import { LoginForm } from "../../components/auth/LoginForm";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return <LoginForm onBackToLanding={() => router.push("/")} />;
}
