"use client";

/**
 * Patient Registration Form (Step 1)
 * Progressive disclosure form with CAPTCHA integration
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmailValidation } from "@/hooks/useEmailValidation";
import {
  patientRegistrationSchema,
  type PatientRegistrationFormData,
} from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CaptchaWidget } from "./CaptchaWidget";
import { EnhancedPasswordStrengthIndicator } from "./EnhancedPasswordStrengthIndicator";

interface PatientRegistrationFormProps {
  onSuccess?: (data: {
    user_id: string;
    email: string;
    next_step: string;
  }) => void;
  className?: string;
}

export function PatientRegistrationForm({
  onSuccess,
  className,
}: PatientRegistrationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<
    "basic" | "security" | "consent"
  >("basic");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
  } = useForm<PatientRegistrationFormData>({
    resolver: zodResolver(patientRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      accept_tos: false,
      accept_privacy: false,
    },
  });

  const watchedPassword = watch("password");
  const watchedEmail = watch("email");
  const watchedFullName = watch("full_name");

  // Email validation hook
  const {
    isChecking: isCheckingEmail,
    isAvailable: isEmailAvailable,
    error: emailError,
    message: emailMessage,
    checkEmail,
    clearValidation: clearEmailValidation,
  } = useEmailValidation(800); // 800ms debounce

  // Watch email changes and trigger validation
  useEffect(() => {
    if (watchedEmail) {
      checkEmail(watchedEmail);
    } else {
      clearEmailValidation();
    }
  }, [watchedEmail]); // Only depend on watchedEmail to prevent infinite loops

  const handleStepNext = async () => {
    let fieldsToValidate: (keyof PatientRegistrationFormData)[] = [];

    switch (currentStep) {
      case "basic":
        fieldsToValidate = ["full_name", "date_of_birth", "gender", "email"];
        break;
      case "security":
        fieldsToValidate = ["password", "confirm_password"];
        break;
    }

    const isStepValid = await trigger(fieldsToValidate);

    // Additional validation for basic step
    if (currentStep === "basic" && isStepValid) {
      // Check if email is available
      if (isEmailAvailable === false) {
        setSubmitError("Email đã được sử dụng. Vui lòng chọn email khác.");
        return;
      }

      // Check if email validation is still in progress
      if (isCheckingEmail) {
        setSubmitError("Đang kiểm tra email. Vui lòng chờ...");
        return;
      }

      // Check if email validation failed
      if (emailError) {
        setSubmitError("Không thể kiểm tra email. Vui lòng thử lại.");
        return;
      }
    }

    if (isStepValid) {
      setSubmitError(""); // Clear any previous errors
      if (currentStep === "basic") {
        setCurrentStep("security");
      } else if (currentStep === "security") {
        setCurrentStep("consent");
      }
    }
  };

  const handleStepBack = () => {
    if (currentStep === "security") {
      setCurrentStep("basic");
    } else if (currentStep === "consent") {
      setCurrentStep("security");
    }
  };

  const onSubmit = async (data: PatientRegistrationFormData) => {
    // Final validation before submit
    if (isEmailAvailable === false) {
      setSubmitError("Email đã được sử dụng. Vui lòng chọn email khác.");
      return;
    }

    if (isCheckingEmail) {
      setSubmitError("Đang kiểm tra email. Vui lòng chờ...");
      return;
    }

    if (emailError) {
      setSubmitError("Không thể kiểm tra email. Vui lòng thử lại.");
      return;
    }

    if (!captchaToken) {
      setSubmitError("Vui lòng hoàn thành xác thực CAPTCHA");
      return;
    }

    setIsLoading(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          captcha_token: captchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setSubmitError(
            `Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau ${result.retryAfter} giây.`
          );
        } else {
          setSubmitError(result.error || "Đăng ký thất bại");
        }
        return;
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push("/login?message=registration_success");
        }
      } else {
        setSubmitError(result.error || "Đăng ký thất bại");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <UserPlus className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Thông tin cơ bản</h2>
        <p className="text-gray-600">
          Vui lòng cung cấp thông tin cá nhân của bạn
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="full_name">Họ và tên *</Label>
          <Input
            id="full_name"
            {...register("full_name")}
            placeholder="Nhập họ và tên đầy đủ"
            className={errors.full_name ? "border-red-500" : ""}
          />
          {errors.full_name && (
            <p className="text-sm text-red-600 mt-1">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="date_of_birth">Ngày sinh *</Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register("date_of_birth")}
            max={new Date().toISOString().split("T")[0]}
            className={errors.date_of_birth ? "border-red-500" : ""}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-red-600 mt-1">
              {errors.date_of_birth.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="gender">Giới tính</Label>
          <Select
            onValueChange={(value) =>
              setValue("gender", value as "male" | "female" | "other")
            }
          >
            <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
              <SelectValue placeholder="Chọn giới tính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Nam</SelectItem>
              <SelectItem value="female">Nữ</SelectItem>
              <SelectItem value="other">Khác</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="example@email.com"
              className={`${errors.email ? "border-red-500" : ""} ${
                isEmailAvailable === false ? "border-red-500" : ""
              } ${isEmailAvailable === true ? "border-green-500" : ""}`}
            />
            {isCheckingEmail && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Form validation errors */}
          {errors.email && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email.message}
            </p>
          )}

          {/* Email availability validation */}
          {!errors.email && emailError && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {emailError}
            </p>
          )}

          {!errors.email && !emailError && isEmailAvailable === false && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Email đã được sử dụng. Vui lòng chọn email khác.
            </p>
          )}

          {!errors.email && !emailError && isEmailAvailable === true && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Email có thể sử dụng
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurityStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Shield className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Bảo mật tài khoản</h2>
        <p className="text-gray-600">Tạo mật khẩu mạnh để bảo vệ tài khoản</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="password">Mật khẩu *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Nhập mật khẩu"
              className={errors.password ? "border-red-500 pr-10" : "pr-10"}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
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
          {watchedPassword && (
            <EnhancedPasswordStrengthIndicator password={watchedPassword} />
          )}
        </div>

        <div>
          <Label htmlFor="confirm_password">Xác nhận mật khẩu *</Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirm_password")}
              placeholder="Nhập lại mật khẩu"
              className={
                errors.confirm_password ? "border-red-500 pr-10" : "pr-10"
              }
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-sm text-red-600 mt-1">
              {errors.confirm_password.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderConsentStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <AlertCircle className="mx-auto h-12 w-12 text-orange-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Điều khoản và chính sách
        </h2>
        <p className="text-gray-600">
          Vui lòng đọc và đồng ý với các điều khoản
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="accept_tos"
            {...register("accept_tos")}
            className={errors.accept_tos ? "border-red-500" : ""}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="accept_tos"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Tôi đồng ý với{" "}
              <a
                href="/terms"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Điều khoản sử dụng
              </a>{" "}
              *
            </Label>
            {errors.accept_tos && (
              <p className="text-sm text-red-600">
                {errors.accept_tos.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="accept_privacy"
            {...register("accept_privacy")}
            className={errors.accept_privacy ? "border-red-500" : ""}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="accept_privacy"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Tôi đồng ý với{" "}
              <a
                href="/privacy"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Chính sách bảo mật
              </a>{" "}
              *
            </Label>
            {errors.accept_privacy && (
              <p className="text-sm text-red-600">
                {errors.accept_privacy.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <CaptchaWidget
            onVerify={setCaptchaToken}
            onError={() => setCaptchaToken("")}
            onExpire={() => setCaptchaToken("")}
          />
        </div>
      </div>
    </div>
  );

  const getStepProgress = () => {
    switch (currentStep) {
      case "basic":
        return 33;
      case "security":
        return 66;
      case "consent":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-center">
          Đăng ký tài khoản bệnh nhân
        </CardTitle>
        <CardDescription className="text-center">
          Tạo tài khoản để sử dụng dịch vụ y tế
        </CardDescription>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Bước{" "}
          {currentStep === "basic"
            ? "1"
            : currentStep === "security"
            ? "2"
            : "3"}{" "}
          / 3
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === "basic" && renderBasicInfoStep()}
          {currentStep === "security" && renderSecurityStep()}
          {currentStep === "consent" && renderConsentStep()}

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between space-x-4">
            {currentStep !== "basic" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleStepBack}
                disabled={isLoading}
                className="flex-1"
              >
                Quay lại
              </Button>
            )}

            {currentStep !== "consent" ? (
              <Button
                type="button"
                onClick={handleStepNext}
                disabled={isLoading}
                className="flex-1"
              >
                Tiếp tục
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || !isValid || !captchaToken}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng ký...
                  </>
                ) : (
                  "Hoàn tất đăng ký"
                )}
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Đăng nhập ngay
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
