"use client";

import { useState, useEffect, type FormEvent } from "react";
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
import { Badge } from "../ui/badge";
import { useAuth } from "./AuthContext";
import { authService } from "./services";
import type { LoginRequest } from "./services";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  AlertCircle,
  Shield,
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  Stethoscope,
} from "lucide-react";

export function LoginForm({
  onBackToLanding,
}: {
  onBackToLanding?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { login } = useAuth();

  // Utility functions for error handling
  const handleAuthError = (error: string, message?: string) => {
    switch (error) {
      case "INVALID_CREDENTIALS":
        return "Sai thông tin đăng nhập. Vui lòng kiểm tra lại email và mật khẩu.";
      case "EMAIL_NOT_VERIFIED":
        return "Email chưa được xác thực. Vui lòng kiểm tra email và click vào link xác thực.";
      case "ACCOUNT_LOCKED":
        return "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";
      case "MFA_REQUIRED":
        return "Cần xác thực 2 bước. Vui lòng nhập mã từ ứng dụng xác thực.";
      case "TOKEN_EXPIRED":
        return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      case "PASSWORD_TOO_WEAK":
        return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.";
      case "EMAIL_ALREADY_EXISTS":
        return "Email đã được sử dụng. Vui lòng chọn email khác.";
      default:
        return message || "Đã xảy ra lỗi. Vui lòng thử lại sau.";
    }
  };

  // Check authentication status
  const checkAuthStatus = () => {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    const currentToken = authService.getCurrentToken();
    const isMfaEnabled = authService.isMfaEnabled();

    console.log("Auth Status:", {
      isAuthenticated,
      user: currentUser,
      hasToken: !!currentToken,
      mfaEnabled: isMfaEnabled,
    });

    return {
      isAuthenticated,
      user: currentUser,
      hasToken: !!currentToken,
      mfaEnabled: isMfaEnabled,
    };
  };

  useEffect(() => {
    setIsVisible(true);

    // Check authentication status on mount
    const authStatus = checkAuthStatus();
    if (authStatus.isAuthenticated && authStatus.user) {
      console.log(
        `User ${authStatus.user.fullName} (${authStatus.user.email}) is already logged in`
      );
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loginData: LoginRequest = {
        email,
        password,
        deviceInfo: {
          platform: "web",
          browser: navigator.userAgent.includes("Chrome") ? "Chrome" : "Other",
          version: navigator.userAgent,
        },
      };

      const response = await authService.login(loginData);

      if (response.success && response.data) {
        // Check if MFA is required
        if (response.data.requiresMfa) {
          setError(
            `Cần xác thực 2 bước. Vui lòng kiểm tra ${
              response.data.mfaMethod === "EMAIL"
                ? "email"
                : "ứng dụng xác thực"
            }`
          );
          return;
        }

        // Login successful, update auth context
        const success = await login(email, password);
        if (!success) {
          setError("Đăng nhập không thành công");
        }
      } else {
        // Handle different error types
        const errorMessage = handleAuthError(
          response.error || "UNKNOWN_ERROR",
          response.message
        );
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Lỗi kết nối mạng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Multi-layered Gradient Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700"
        animate={{
          background: [
            "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0f766e 100%)",
            "linear-gradient(135deg, #1e40af 0%, #0ea5e9 50%, #0d9488 100%)",
            "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0f766e 100%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-cyan-600/30 via-blue-600/20 to-teal-500/40"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-blue-500/10 to-cyan-400/30" />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"
        animate={{
          background: [
            "radial-gradient(ellipse at top right, rgba(96, 165, 250, 0.2) 0%, transparent 60%)",
            "radial-gradient(ellipse at top right, rgba(34, 211, 238, 0.25) 0%, transparent 70%)",
            "radial-gradient(ellipse at top right, rgba(96, 165, 250, 0.2) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-400/20 via-transparent to-transparent"
        animate={{
          background: [
            "radial-gradient(ellipse at bottom left, rgba(45, 212, 191, 0.2) 0%, transparent 60%)",
            "radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.25) 0%, transparent 70%)",
            "radial-gradient(ellipse at bottom left, rgba(45, 212, 191, 0.2) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 7, repeat: Infinity, delay: 1 }}
      />

      {/* Enhanced Animated Particles */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-300/30 via-cyan-200/20 to-teal-200/30 rounded-full blur-2xl shadow-2xl"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.2, 0.8, 1],
          opacity: [0.3, 0.7, 0.4, 0.3],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-32 right-16 w-40 h-40 bg-gradient-to-tr from-teal-300/25 via-blue-200/20 to-cyan-300/25 rounded-full blur-3xl shadow-xl"
        animate={{
          x: [0, -25, 40, 0],
          y: [0, 30, -50, 0],
          scale: [1, 0.9, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-20 w-24 h-24 bg-gradient-to-bl from-cyan-400/30 via-blue-300/20 to-teal-300/25 rounded-full blur-xl shadow-lg"
        animate={{
          x: [0, 15, -25, 0],
          y: [0, -20, 35, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute top-32 right-32 w-28 h-28 bg-gradient-to-br from-white/15 via-blue-200/20 to-cyan-200/15 rounded-full blur-2xl shadow-xl"
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 25, -15, 0],
          scale: [1, 0.8, 1.2, 1],
          opacity: [0.15, 0.4, 0.2, 0.15],
        }}
        transition={{ duration: 14, repeat: Infinity, delay: 3 }}
      />

      {/* Medium floating elements with enhanced animations */}
      <motion.div
        className="absolute top-64 left-1/4 w-20 h-20 bg-gradient-to-tr from-teal-300/20 via-cyan-300/15 to-blue-300/20 rounded-full blur-lg shadow-lg"
        animate={{
          x: [0, 20, -15, 0],
          y: [0, -25, 30, 0],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-48 left-32 w-36 h-36 bg-gradient-to-bl from-blue-300/15 via-teal-200/20 to-cyan-200/15 rounded-full blur-2xl shadow-2xl"
        animate={{
          scale: [1, 1.3, 0.7, 1],
          opacity: [0.15, 0.4, 0.25, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* Interactive sparkles */}
      <motion.div
        className="absolute top-60 right-1/3 w-4 h-4 bg-gradient-to-br from-white/40 to-cyan-200/30 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.8, 0.2],
          rotate: [0, 360],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-60 left-2/3 w-3 h-3 bg-gradient-to-tr from-blue-300/40 to-teal-200/35 rounded-full"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.25, 0.7, 0.25],
          y: [0, -20, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute top-3/4 left-1/5 w-5 h-5 bg-gradient-to-bl from-cyan-400/30 to-blue-300/25 rounded-full"
        animate={{
          x: [0, 15, -10, 0],
          scale: [1, 1.2, 0.8, 1],
          opacity: [0.2, 0.6, 0.3, 0.2],
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 2 }}
      />

      {/* Additional floating sparkle effects */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 0.8, 0],
            y: [0, -30, -60],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut",
          }}
        />
      ))}

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Enhanced Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
          <motion.div
            className="max-w-md"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              className="flex items-center mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mr-4 relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(255, 255, 255, 0.1)",
                    "0 0 30px rgba(255, 255, 255, 0.2)",
                    "0 0 20px rgba(255, 255, 255, 0.1)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Heart className="h-12 w-12 text-white" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: [-100, 100] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.div>
              <div>
                <motion.h1
                  className="text-4xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  MediCare
                </motion.h1>
                <motion.p
                  className="text-blue-100 text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Hệ thống Quản lý Bệnh viện
                </motion.p>
              </div>
            </motion.div>

            <motion.h2
              className="text-3xl font-semibold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Chăm sóc sức khỏe
              <br />
              <motion.span
                className="text-teal-300"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(94, 234, 212, 0.5)",
                    "0 0 20px rgba(94, 234, 212, 0.8)",
                    "0 0 10px rgba(94, 234, 212, 0.5)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Hiện đại & Thông minh
              </motion.span>
            </motion.h2>

            <motion.p
              className="text-blue-100 text-lg mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Nền tảng quản lý bệnh viện toàn diện với công nghệ tiên tiến, giúp
              tối ưu hóa quy trình chăm sóc bệnh nhân và quản lý y tế.
            </motion.p>

            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {[
                {
                  icon: Users,
                  number: "2,500+",
                  label: "Bệnh nhân",
                  color: "teal",
                },
                {
                  icon: Stethoscope,
                  number: "150+",
                  label: "Bác sĩ",
                  color: "blue",
                },
                {
                  icon: Calendar,
                  number: "98%",
                  label: "Hiệu quả",
                  color: "purple",
                },
                {
                  icon: Clock,
                  number: "24/7",
                  label: "Hỗ trợ",
                  color: "green",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isVisible ? 1 : 0,
                    scale: isVisible ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    className={`p-2 bg-${stat.color}-400/20 rounded-lg relative overflow-hidden`}
                    whileHover={{
                      boxShadow: `0 0 20px rgba(${
                        stat.color === "teal"
                          ? "45, 212, 191"
                          : stat.color === "blue"
                          ? "59, 130, 246"
                          : stat.color === "purple"
                          ? "168, 85, 247"
                          : "34, 197, 94"
                      }, 0.4)`,
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.5,
                      }}
                    >
                      <stat.icon className={`h-5 w-5 text-${stat.color}-300`} />
                    </motion.div>
                    <motion.div
                      className="absolute top-0 right-0"
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 0.6, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.3 + 1,
                      }}
                    >
                      <Sparkles className="h-3 w-3 text-white" />
                    </motion.div>
                  </motion.div>
                  <div>
                    <motion.p
                      className="text-white font-medium"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                    >
                      {stat.number}
                    </motion.p>
                    <p className="text-blue-200 text-sm">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Enhanced Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Enhanced Mobile Header */}
            <motion.div
              className="lg:hidden text-center mb-8"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -30 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.div
                className="flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255, 255, 255, 0.1)",
                      "0 0 30px rgba(255, 255, 255, 0.2)",
                      "0 0 20px rgba(255, 255, 255, 0.1)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart className="h-8 w-8 text-white" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-50, 50] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  />
                </motion.div>
              </motion.div>
              <motion.h1
                className="text-2xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Hệ thống Bệnh viện
              </motion.h1>
              <motion.p
                className="text-blue-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Đăng nhập để tiếp tục
              </motion.p>
            </motion.div>

            {/* Enhanced Back to Landing Button */}
            {onBackToLanding && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={onBackToLanding}
                    className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm transition-all duration-300 group"
                  >
                    <motion.div
                      className="flex items-center justify-center space-x-2"
                      whileHover={{ x: -3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowLeft className="h-4 w-4 group-hover:text-teal-300 transition-colors" />
                      <span>Quay lại trang chủ</span>
                    </motion.div>
                  </Button>
                </motion.div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                y: isVisible ? 0 : 30,
                scale: isVisible ? 1 : 0.95,
              }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="backdrop-blur-2xl bg-white/90 border-white/30 shadow-2xl ring-1 ring-white/20 relative overflow-hidden">
                {/* Card glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-teal-500/5 to-cyan-500/5"
                  animate={{
                    background: [
                      "linear-gradient(45deg, rgba(59, 130, 246, 0.05) 0%, rgba(20, 184, 166, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)",
                      "linear-gradient(45deg, rgba(6, 182, 212, 0.05) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(20, 184, 166, 0.05) 100%)",
                      "linear-gradient(45deg, rgba(59, 130, 246, 0.05) 0%, rgba(20, 184, 166, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)",
                    ],
                  }}
                  transition={{ duration: 6, repeat: Infinity }}
                />

                <CardHeader className="space-y-1 pb-6 relative">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-center"
                  >
                    <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Lock className="h-6 w-6 text-blue-600" />
                      </motion.div>
                      Đăng nhập
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                      Truy cập vào hệ thống quản lý bệnh viện
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <CardContent className="space-y-6 relative">
                  <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                    >
                      <Label
                        htmlFor="email"
                        className="text-gray-700 font-medium flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4 text-blue-600" />
                        Địa chỉ Email
                      </Label>
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          id="email"
                          type="email"
                          placeholder="Nhập email của bạn"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                          required
                        />
                      </motion.div>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <Label
                        htmlFor="password"
                        className="text-gray-700 font-medium flex items-center gap-2"
                      >
                        <Lock className="h-4 w-4 text-blue-600" />
                        Mật khẩu
                      </Label>
                      <motion.div
                        className="relative"
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 pr-10 transition-all duration-300"
                          required
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </motion.button>
                      </motion.div>
                    </motion.div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert className="border-red-200 bg-red-50">
                            <motion.div
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 0.5 }}
                            >
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            </motion.div>
                            <AlertDescription className="text-red-700">
                              {error}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          className="w-full h-11 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-300 hover:shadow-xl relative overflow-hidden group"
                          disabled={loading}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: loading ? ["-100%", "100%"] : "-100%",
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: loading ? Infinity : 0,
                              ease: "linear",
                            }}
                          />
                          {loading ? (
                            <motion.div
                              className="flex items-center space-x-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              />
                              <span>Đang đăng nhập...</span>
                            </motion.div>
                          ) : (
                            <motion.span className="flex items-center justify-center gap-2 group-hover:gap-3 transition-all duration-300">
                              Đăng nhập
                              <motion.div
                                animate={{ x: [0, 3, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                              </motion.div>
                            </motion.span>
                          )}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.form>

                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  ></motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Security Badge */}
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant="secondary"
                  className="bg-white/15 text-white border-white/30 backdrop-blur-lg shadow-lg relative overflow-hidden group cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-100, 100] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  />
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Shield className="h-3 w-3 mr-1 relative" />
                  </motion.div>
                  <span className="relative">Bảo mật SSL 256-bit</span>
                  <motion.div
                    className="absolute top-0 right-0"
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 0.8, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 1,
                    }}
                  >
                    <Sparkles className="h-2 w-2 text-green-300" />
                  </motion.div>
                </Badge>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
