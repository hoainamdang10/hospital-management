'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2, AlertCircle, Eye, EyeOff, Loader2,
  Shield, Lock, Mail, Sparkles, ArrowRight, Check
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Staff Account Activation Page - Premium Version
 * Trang kích hoạt tài khoản cho nhân viên y tế - Nâng cấp UI/UX
 */
function StaffActivationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: 'gray',
    bgColor: 'bg-gray-400',
  });

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Validate token on mount
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      setIsValid(false);
      setError('Link kích hoạt không hợp lệ. Vui lòng kiểm tra lại email của bạn.');
      setIsValidating(false);
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);

    // TODO: Validate token with backend
    setTimeout(() => {
      setIsValid(true);
      setIsValidating(false);
    }, 1500);
  }, [searchParams]);

  // Check password requirements and strength
  useEffect(() => {
    const password = formData.password;

    const reqs = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    };

    setPasswordRequirements(reqs);

    if (!password) {
      setPasswordStrength({ score: 0, message: '', color: 'gray', bgColor: 'bg-gray-400' });
      return;
    }

    let score = 0;
    if (reqs.length) score++;
    if (password.length >= 12) score++;
    if (reqs.uppercase && reqs.lowercase) score++;
    if (reqs.number) score++;
    if (reqs.special) score++;

    const strengthLevels = [
      { score: 0, message: 'Rất yếu', color: 'text-red-600', bgColor: 'bg-red-500' },
      { score: 1, message: 'Yếu', color: 'text-orange-600', bgColor: 'bg-orange-500' },
      { score: 2, message: 'Trung bình', color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
      { score: 3, message: 'Tốt', color: 'text-blue-600', bgColor: 'bg-blue-500' },
      { score: 4, message: 'Mạnh', color: 'text-green-600', bgColor: 'bg-green-500' },
      { score: 5, message: 'Rất mạnh', color: 'text-emerald-600', bgColor: 'bg-emerald-500' },
    ];

    setPasswordStrength(strengthLevels[score]);
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call API to activate account
      console.log('Activating account with:', { token, email, password: formData.password });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?activated=true');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi kích hoạt tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state with enhanced animation
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-xl p-8 text-center shadow-2xl border border-white/20"
        >
          <div className="relative">
            <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-blue-600" />
            <Sparkles className="absolute top-0 right-1/3 h-6 w-6 text-yellow-400 animate-pulse" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Đang xác thực...</h2>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-blue-600"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Invalid token with enhanced error UI
  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-xl p-8 text-center shadow-2xl border border-white/20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500"
          >
            <AlertCircle className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900">Link không hợp lệ</h2>
          <p className="mb-8 text-gray-600 leading-relaxed">
            {error || 'Link kích hoạt không hợp lệ hoặc đã hết hạn.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
          >
            Về trang chủ
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success state with celebration animation
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-xl p-8 text-center shadow-2xl border border-white/20 relative overflow-hidden"
        >
          {/* Confetti effect */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                left: `${Math.random() * 100}%`,
                top: '-10%',
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [0, (Math.random() - 0.5) * 100],
                rotate: [0, 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"
          >
            <CheckCircle2 className="h-12 w-12 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-3 text-3xl font-bold text-gray-900"
          >
            Kích hoạt thành công!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 text-gray-600 leading-relaxed"
          >
            Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập vào hệ thống ngay bây giờ.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm text-gray-500"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang chuyển hướng đến trang đăng nhập...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Main activation form with premium design
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl"
            style={{
              width: `${300 + i * 100}px`,
              height: `${300 + i * 100}px`,
              left: `${20 + i * 30}%`,
              top: `${10 + i * 20}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, 50, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl bg-white/80 backdrop-blur-2xl p-8 md:p-10 shadow-2xl border border-white/20 relative z-10"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg"
          >
            <Shield className="h-10 w-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-2 text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          >
            Kích hoạt tài khoản
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 leading-relaxed"
          >
            Chào mừng bạn! Vui lòng đặt mật khẩu để kích hoạt tài khoản.
          </motion.p>
        </div>

        {/* Email info with premium styling */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium mb-0.5">Email tài khoản</p>
              <p className="text-sm text-blue-900 font-semibold">{email}</p>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="mb-2 block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-12 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password strength indicator */}
            {formData.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-3"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                      {passwordStrength.message}
                    </span>
                    <span className="text-xs text-gray-500">
                      {passwordStrength.score}/5
                    </span>
                  </div>
                  <div className="h-2 flex gap-1 overflow-hidden rounded-full bg-gray-200">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 transition-all duration-300 ${i < passwordStrength.score ? passwordStrength.bgColor : 'bg-gray-200'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Password requirements checklist */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'length', label: '8+ ký tự' },
                    { key: 'uppercase', label: 'Chữ hoa' },
                    { key: 'lowercase', label: 'Chữ thường' },
                    { key: 'number', label: 'Số' },
                    { key: 'special', label: 'Ký tự đặc biệt' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 text-xs ${passwordRequirements[key as keyof typeof passwordRequirements]
                          ? 'text-green-600'
                          : 'text-gray-400'
                        }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full ${passwordRequirements[key as keyof typeof passwordRequirements]
                            ? 'bg-green-100'
                            : 'bg-gray-100'
                          }`}
                      >
                        {passwordRequirements[key as keyof typeof passwordRequirements] && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span className="font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="mb-2 block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-12 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <AnimatePresence>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 flex items-center gap-2 text-xs text-red-600 font-medium"
                >
                  <AlertCircle className="h-4 w-4" />
                  Mật khẩu không khớp
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting || formData.password !== formData.confirmPassword}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang kích hoạt...
                </>
              ) : (
                <>
                  Kích hoạt tài khoản
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
            {!isSubmitting && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Đăng nhập
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function StaffActivationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl p-8 text-center shadow-2xl border border-white/20">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-medium text-gray-600">Đang tải thông tin kích hoạt nhân viên...</p>
          </div>
        </div>
      }
    >
      <StaffActivationPageContent />
    </Suspense>
  );
}
