"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { authService } from "./services";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EmailVerification() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");

  // Check if token in URL (from email link)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      handleVerifyByToken(token);
    }
  }, []);

  const handleVerifyByToken = async (token: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await authService.verifyEmail(token);
      if (response.success) {
        setVerified(true);
        toast.success("Email đã được xác thực thành công!");
      } else {
        setError(response.error || "Token không hợp lệ hoặc đã hết hạn");
      }
    } catch (err) {
      setError("Lỗi xác thực email. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await authService.resendVerification(email);
      if (response.success) {
        toast.success("Email xác thực đã được gửi lại!");
        setStep("verify");
      } else {
        setError(response.error || "Không thể gửi email xác thực");
      }
    } catch (err) {
      setError("Lỗi gửi email. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setError("Vui lòng nhập đầy đủ email và mã xác thực");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await authService.verifyEmailByCode(email, code);
      if (response.success) {
        setVerified(true);
        toast.success("Email đã được xác thực thành công!");
      } else {
        setError(response.error || "Mã xác thực không đúng");
      }
    } catch (err) {
      setError("Lỗi xác thực email. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Email đã được xác thực!</CardTitle>
          <CardDescription>
            Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập
            ngay bây giờ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => (window.location.href = "/login")}
          >
            Đăng nhập
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Xác thực Email</CardTitle>
        <CardDescription>
          {step === "email"
            ? "Nhập email để nhận mã xác thực"
            : "Nhập mã xác thực đã gửi đến email của bạn"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "email" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleResendVerification}
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi mã xác thực"
              )}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleVerifyByCode} className="space-y-4">
            <div>
              <Label htmlFor="email-readonly">Email</Label>
              <Input
                id="email-readonly"
                type="email"
                value={email}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="code">Mã xác thực</Label>
              <Input
                id="code"
                type="text"
                placeholder="Nhập mã 6 số"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("email")}
                disabled={loading}
              >
                Quay lại
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  "Xác thực"
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={handleResendVerification}
              disabled={loading}
            >
              Gửi lại mã xác thực
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

