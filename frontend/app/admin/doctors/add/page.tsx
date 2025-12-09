'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  ArrowLeft,
  Save,
  Mail,
  AlertCircle,
  CheckCircle2,
  Info,
  User,
  Briefcase,
  Send,
  ArrowRight,
  Check,
  Loader2,
  UserPlus,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Admin - Thêm bác sĩ mới với Multi-Step Wizard
 */
export default function AddDoctorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<
    Array<{ id: string; code: string; nameVi: string; nameEn: string }>
  >([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    nationality: 'Vietnamese',
    address: '',
    department: '',
    position: 'doctor',
    licenseNumber: '',
    experience: '',
    education: '',
    languages: 'Vietnamese, English',
    bio: '',
    sendInvitationEmail: true,
  });

  const steps = [
    { number: 1, title: 'Thông tin cá nhân', icon: User },
    { number: 2, title: 'Thông tin nghề nghiệp', icon: Briefcase },
    { number: 3, title: 'Gửi email mời', icon: Send },
  ];

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { getDepartments } = await import('@/lib/api/departments.service');
        const list = await getDepartments();
        const mapped = list.map((d) => ({
          id: d.id,
          code: d.code,
          nameVi: d.nameVi,
          nameEn: d.nameEn,
        }));
        setDepartments(mapped);
      } catch (e) {
        console.error('Error loading departments', e);
      }
    };
    loadDepartments();
  }, []);

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return !!(formData.fullName && formData.email && formData.phone && formData.department);
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError(null);
      setCurrentStep(currentStep + 1);
    } else {
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { authService } = await import('@/lib/api/auth.service');
      const selectedDept = departments.find((d) => d.code === formData.department);
      const educationArray = formData.education
        ? formData.education
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        email: formData.email,
        fullName: formData.fullName,
        roleType: 'doctor' as const,
        phoneNumber: formData.phone,
        // Các field chuyên môn gửi phẳng để backend lưu vào invitationData
        departmentCode: formData.department || 'GENERAL',
        departmentName: selectedDept?.nameVi || selectedDept?.nameEn,
        title: 'Bác sĩ',
        position: 'Bác sĩ điều trị',
        licenseNumber: formData.licenseNumber || `TEMP-${Date.now()}`,
        employmentType: 'full_time' as const,
        yearsOfExperience: Number(formData.experience || 0),
        education: educationArray.length > 0 ? educationArray : ['General Medicine'],
        bio: formData.bio || undefined,
        workSchedule: {
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          workingHours: { start: '08:00', end: '17:00' },
          timeZone: 'Asia/Ho_Chi_Minh',
          isFlexible: false,
        },
      };
      const res = await authService.inviteStaffAdmin(payload);
      if (!res?.success) {
        throw new Error(res?.message || 'Không thể tạo lời mời');
      }
      setShowSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/admin/doctors');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo tài khoản bác sĩ');
    } finally {
      setIsLoading(false);
    }
  };

  // Success Modal with Confetti
  if (showSuccess) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[80vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mx-auto max-w-2xl overflow-hidden"
          >
            {/* Confetti */}
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                }}
                animate={{
                  y: ['0vh', '100vh'],
                  x: [0, (Math.random() - 0.5) * 150],
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

            <div className="relative z-10 rounded-2xl border border-gray-200 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
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
                Tạo tài khoản thành công!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 leading-relaxed text-gray-600"
              >
                {formData.sendInvitationEmail
                  ? `Email kích hoạt đã được gửi đến ${formData.email}. Bác sĩ cần xác nhận email để kích hoạt tài khoản.`
                  : 'Tài khoản bác sĩ đã được tạo. Bạn có thể gửi thông tin đăng nhập cho họ sau.'}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <Info className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="text-left text-sm text-blue-900">
                    <p className="mb-2 font-semibold">Các bước tiếp theo:</p>
                    <ol className="list-inside list-decimal space-y-1.5">
                      <li>Bác sĩ kiểm tra email và click vào link kích hoạt</li>
                      <li>Đặt mật khẩu cho tài khoản</li>
                      <li>Đăng nhập vào hệ thống</li>
                    </ol>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 text-sm text-gray-500"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang chuyển hướng về danh sách bác sĩ...
              </motion.div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header with Gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link
            href="/admin/doctors"
            className="rounded-xl p-2.5 transition-all hover:bg-gray-100 hover:shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent">
              Thêm bác sĩ mới
            </h1>
            <p className="mt-1 text-gray-600">Tạo tài khoản và gửi email mời kích hoạt</p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex flex-1 items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e5e7eb',
                      }}
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                        isCompleted
                          ? 'shadow-lg shadow-green-200'
                          : isActive
                            ? 'shadow-lg shadow-blue-200'
                            : ''
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6 text-white" />
                      ) : (
                        <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </motion.div>
                    <div className="hidden md:block">
                      <p
                        className={`text-sm font-semibold ${
                          isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">Bước {step.number}/3</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 px-4">
                      <div className="h-1 overflow-hidden rounded-full bg-gray-200">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: isCompleted ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <div>
                  <h3 className="text-sm font-semibold text-red-900">Có lỗi xảy ra</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-lg backdrop-blur-xl"
          >
            <AnimatePresence mode="wait">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                      <p className="text-sm text-gray-600">Nhập thông tin cơ bản của bác sĩ</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="doctor@hospital.com"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="0901234567"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Khoa <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Chọn khoa</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.code}>
                            {d.nameVi} ({d.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Professional Info */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Thông tin nghề nghiệp</h2>
                      <p className="text-sm text-gray-600">Thông tin chuyên môn và kinh nghiệm</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Số chứng chỉ hành nghề
                      </label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseNumber: e.target.value })
                        }
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="BS-12345"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Kinh nghiệm (năm)
                      </label>
                      <input
                        type="number"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Học vấn
                      </label>
                      <input
                        type="text"
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="Bác sĩ, Đại học Y Hà Nội"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Giới thiệu
                      </label>
                      <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="Mô tả ngắn về bác sĩ..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Email Invitation */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                      <Send className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Gửi email mời kích hoạt</h2>
                      <p className="text-sm text-gray-600">Xác nhận và gửi email đến bác sĩ</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-1 h-6 w-6 shrink-0 text-blue-600" />
                      <div className="text-sm text-blue-900">
                        <p className="mb-3 text-base font-semibold">Cách thức hoạt động:</p>
                        <ul className="space-y-2 text-blue-800">
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                            <span>
                              Tài khoản sẽ được tạo với trạng thái <strong>chưa kích hoạt</strong>
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                            <span>
                              Email chứa link kích hoạt sẽ được gửi đến địa chỉ email của bác sĩ
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                            <span>Bác sĩ click vào link, đặt mật khẩu và kích hoạt tài khoản</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                            <span>Sau khi kích hoạt, bác sĩ có thể đăng nhập vào hệ thống</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-4 rounded-xl border-2 border-gray-200 p-4 transition-all hover:border-blue-300 hover:bg-blue-50/50">
                    <input
                      type="checkbox"
                      checked={formData.sendInvitationEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, sendInvitationEmail: e.target.checked })
                      }
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Gửi email mời kích hoạt tài khoản
                      </span>
                      <p className="mt-1 text-xs text-gray-600">
                        Email sẽ được gửi đến{' '}
                        <strong>{formData.email || '(chưa nhập email)'}</strong>
                      </p>
                    </div>
                  </label>

                  {!formData.sendInvitationEmail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Nếu không gửi email, bạn cần thông báo thông tin đăng nhập cho bác sĩ bằng
                          cách khác.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t pt-8">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Quay lại
              </button>

              {currentStep < 3 ? (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl"
                >
                  Tiếp theo
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      {formData.sendInvitationEmail ? 'Tạo và gửi email' : 'Tạo tài khoản'}
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
}
