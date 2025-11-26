'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  Mail,
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

function ActivateStaffPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Check password requirements and strength
  useEffect(() => {
    const pwd = password;

    const reqs = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[^a-zA-Z0-9]/.test(pwd),
    };

    setPasswordRequirements(reqs);

    if (!pwd) {
      setPasswordStrength({ score: 0, message: '', color: 'gray', bgColor: 'bg-gray-400' });
      return;
    }

    let score = 0;
    if (reqs.length) score++;
    if (pwd.length >= 12) score++;
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
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage(null);
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      setIsLoading(false);
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      setIsLoading(false);
      return;
    }

    try {
      const { authService } = await import('@/lib/api/auth.service');
      const activateRes = await authService.activateStaff({
        invitationToken: token!,
        password,
        confirmPassword,
      });
      if (!activateRes?.success) {
        throw new Error(activateRes?.error || 'Kích hoạt thất bại');
      }

      // API có thể trả userId dạng root hoặc trong user
      const userId =
        (activateRes as any)?.userId ||
        (activateRes as any)?.user?.id ||
        (activateRes as any)?.user?.userId;
      const email = (activateRes as any)?.email || (activateRes as any)?.user?.email || '';

      if (!userId) {
        throw new Error('Thiếu userId trong phản hồi kích hoạt');
      }

      /**
       * Hồ sơ staff đã được auto-provision bởi Identity → Provider qua UserCreatedEvent.
       * Không gọi lại /api/v1/staff để tránh trùng “Nhân viên đã được đăng ký”.
       * Nếu cần hiển thị thông tin bổ sung, có thể fetch sau bằng getStaffByUserId.
       */
      setSuccessMessage('Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập ngay.');
      setIsSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(ROUTES.LOGIN + '?activated=true');
      }, 3000);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || 'Có lỗi xảy ra trong quá trình kích hoạt';
      setError(message);
    }
    setIsLoading(false);
  };

  // Invalid token
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500"
          >
            <AlertCircle className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900">Link không hợp lệ</h2>
          <p className="mb-8 leading-relaxed text-gray-600">
            Link kích hoạt không hợp lệ hoặc đã hết hạn.
          </p>
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex transform items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-medium text-white transition-all hover:scale-105 hover:from-blue-700 hover:to-indigo-700"
          >
            Đăng nhập
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl"
        >
          {/* Confetti effect */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full"
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
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"
          >
            <CheckCircle className="h-12 w-12 text-white" />
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
            className="mb-8 leading-relaxed text-gray-600"
          >
            {successMessage || 'Tài khoản của bạn đã được kích hoạt.'}
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

  // Main activation form
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl md:p-10"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg"
          >
            <Shield className="h-10 w-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
          >
            Kích hoạt tài khoản
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="leading-relaxed text-gray-600"
          >
            Đặt mật khẩu để kích hoạt tài khoản nhân viên
          </motion.p>
        </div>

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
                <p className="text-sm font-medium text-red-800">{error}</p>
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
            transition={{ delay: 0.3 }}
          >
            <label className="mb-2 block flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Lock className="h-4 w-4" />
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="group relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-12 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password strength indicator */}
            {password && (
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
                    <span className="text-xs text-gray-500">{passwordStrength.score}/5</span>
                  </div>
                  <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-gray-200">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 transition-all duration-300 ${
                          i < passwordStrength.score ? passwordStrength.bgColor : 'bg-gray-200'
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
                      className={`flex items-center gap-2 text-xs ${
                        passwordRequirements[key as keyof typeof passwordRequirements]
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full ${
                          passwordRequirements[key as keyof typeof passwordRequirements]
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
            transition={{ delay: 0.4 }}
          >
            <label className="mb-2 block flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Lock className="h-4 w-4" />
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-12 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <AnimatePresence>
              {confirmPassword && password !== confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 flex items-center gap-2 text-xs font-medium text-red-600"
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
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || password !== confirmPassword}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang kích hoạt...
                </>
              ) : (
                <>
                  Kích hoạt tài khoản
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
            {!isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link
              href={ROUTES.LOGIN}
              className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Đăng nhập
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ActivateStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
          <div className="rounded-2xl border border-white/20 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-medium text-gray-600">
              Đang tải thông tin kích hoạt nhân viên...
            </p>
          </div>
        </div>
      }
    >
      <ActivateStaffPageContent />
    </Suspense>
  );
}
