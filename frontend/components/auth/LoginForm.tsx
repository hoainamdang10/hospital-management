"use client";

/**
 * Login Form Component
 * Enhanced login form with rate limiting awareness and security features
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnifiedAuth } from "@/lib/auth/unified-auth-context";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Mail,
  Shield,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CaptchaWidget } from "./CaptchaWidget";

interface LoginFormProps {
  onSuccess?: (data: { user: any; role: string; redirect_url: string }) => void;
  className?: string;
}

export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const message = searchParams.get("message");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");

  // Use unified auth context
  const { signIn, loading: authLoading, error: authError } = useUnifiedAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      remember_me: false,
    },
  });

  useEffect(() => {
    // Handle success messages
    if (message) {
      switch (message) {
        case "registration_success":
          setSuccessMessage(
            "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."
          );
          break;
        case "email_verified":
          setSuccessMessage(
            "Email đã được xác thực thành công! Bạn có thể đăng nhập ngay."
          );
          break;
        case "password_reset_success":
          setSuccessMessage(
            "Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập với mật khẩu mới."
          );
          break;
        case "logout_success":
          setSuccessMessage("Đăng xuất thành công!");
          break;
      }
    }

    // Check for existing rate limit status
    checkRateLimitStatus();
  }, [message]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockTimeRemaining]);

  const checkRateLimitStatus = async () => {
    try {
      const response = await fetch("/api/auth/rate-limit-status");
      if (response.ok) {
        const data = await response.json();
        if (data.blocked) {
          setIsBlocked(true);
          setBlockTimeRemaining(data.retryAfter || 0);
          setFailedAttempts(data.attempts || 0);
        }
        if (data.attempts >= 3) {
          setShowCaptcha(true);
        }
      }
    } catch (error) {
      console.error("Failed to check rate limit status:", error);
    }
  };

  const onSubmit = async (data: LoginInput) => {
    if (isBlocked) {
      setSubmitError(
        `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${blockTimeRemaining} giây.`
      );
      return;
    }

    if (showCaptcha && !captchaToken) {
      setSubmitError("Vui lòng hoàn thành xác thực CAPTCHA");
      return;
    }

    setIsLoading(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      // Use unified auth context instead of frontend API route
      await signIn(data.email, data.password);

      // If we reach here, login was successful
      const result = { success: true, user: { role: "doctor" } }; // Simplified for now

      if (result.success) {
        // Reset failed attempts on success
        setFailedAttempts(0);
        setShowCaptcha(false);
        setSuccessMessage("Đăng nhập thành công!");

        if (onSuccess) {
          onSuccess(result.user);
        } else {
          // Redirect will be handled by the auth context
          // The middleware will redirect to appropriate dashboard
          const redirectUrl = returnUrl || getDashboardUrl(result.user.role);
          router.push(redirectUrl);
        }
      } else {
        // Handle authentication errors
        setFailedAttempts((prev) => {
          const newAttempts = prev + 1;
          if (newAttempts >= 3) {
            setShowCaptcha(true);
          }
          return newAttempts;
        });
        setSubmitError(result.error || "Email hoặc mật khẩu không chính xác");
        setCaptchaToken(""); // Reset captcha
      }
    } catch (error) {
      console.error("Login error:", error);
      setSubmitError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardUrl = (role: string): string => {
    switch (role) {
      case "admin":
      case "superadmin":
        return "/admin";
      case "doctor":
        return "/doctor";
      case "staff":
        return "/staff";
      case "patient":
        return "/patient";
      default:
        return "/dashboard";
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <LogIn className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>
          Đăng nhập vào tài khoản của bạn để tiếp tục
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Rate Limit Warning */}
        {isBlocked && (
          <Alert variant="destructive" className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập thất bại.
              <br />
              Thời gian còn lại:{" "}
              <strong>{formatTime(blockTimeRemaining)}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Failed Attempts Warning */}
        {failedAttempts > 0 && failedAttempts < 5 && !isBlocked && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              Đăng nhập thất bại {failedAttempts} lần.
              {failedAttempts >= 3 && " CAPTCHA đã được kích hoạt để bảo mật."}
              {5 - failedAttempts > 0 &&
                ` Còn ${5 - failedAttempts} lần thử trước khi bị khóa.`}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="example@email.com"
                className={errors.email ? "border-red-500" : ""}
                disabled={isBlocked}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Nhập mật khẩu"
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  disabled={isBlocked}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isBlocked}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember_me"
                {...register("remember_me")}
                disabled={isBlocked}
              />
              <Label
                htmlFor="remember_me"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ghi nhớ đăng nhập
              </Label>
            </div>
            <a
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Quên mật khẩu?
            </a>
          </div>

          {/* CAPTCHA */}
          {showCaptcha && (
            <div className="space-y-2">
              <Label>Xác thực bảo mật</Label>
              <CaptchaWidget
                onVerify={setCaptchaToken}
                onError={() => setCaptchaToken("")}
                onExpire={() => setCaptchaToken("")}
              />
            </div>
          )}

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={
              isLoading ||
              authLoading ||
              !isValid ||
              isBlocked ||
              (showCaptcha && !captchaToken)
            }
            className="w-full"
          >
            {isLoading || authLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : isBlocked ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Tài khoản bị khóa ({formatTime(blockTimeRemaining)})
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập
              </>
            )}
          </Button>
        </form>

        {/* Alternative Login Methods */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Hoặc</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/magic-link")}
              disabled={isBlocked}
            >
              <Mail className="mr-2 h-4 w-4" />
              Đăng nhập bằng email (không cần mật khẩu)
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Đăng ký ngay
            </a>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Bảo mật tài khoản:</p>
              <ul className="space-y-1">
                <li>• Tài khoản sẽ bị khóa tạm thời sau 5 lần đăng nhập sai</li>
                <li>• CAPTCHA được kích hoạt sau 3 lần thất bại</li>
                <li>• Sử dụng mật khẩu mạnh và không chia sẻ với người khác</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
