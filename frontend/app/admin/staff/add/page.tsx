'use client';

import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import {
  ArrowLeft,
  Send,
  Mail,
  AlertCircle,
  CheckCircle2,
  Info,
  User,
  Shield,
  Briefcase,
  Phone,
  Calendar,
  MapPin,
  Loader2,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

function AddStaffPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<
    Array<{ id: string; code: string; nameVi: string; nameEn: string }>
  >([]);

  // Check if adding admin (from URL param)
  const isAdminMode = roleParam === 'admin';

  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',

    // Professional Info  
    title: isAdminMode ? 'Quản trị viên' : '',
    department: '',
    experience: '',
    education: '',
    languages: 'Vietnamese, English',
    bio: '',

    // Options
    sendInvitationEmail: true,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { authService } = await import('@/lib/api/auth.service');
      const payload = {
        email: formData.email,
        fullName: formData.fullName,
        roleType: 'admin' as const,
        phoneNumber: formData.phone,
        invitationData: {
          departmentCode: formData.department || 'ADMIN',
          title: formData.title || 'Quản trị viên',
          position: 'Admin',
          licenseNumber: `ADMIN-${Date.now()}`,
          employmentType: 'full_time',
          yearsOfExperience: Number(formData.experience || 0),
          education: formData.education ? [formData.education] : ['Administration'],
          languages: formData.languages
            ? formData.languages.split(',').map((s) => s.trim())
            : ['vi'],
          bio: formData.bio || '',
        },
      };

      const res = await authService.inviteStaffAdmin(payload);
      if (!res?.success) {
        throw new Error(res?.message || 'Không thể tạo lời mời');
      }
      setShowSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/admin/staff');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo tài khoản quản trị viên');
    } finally {
      setIsLoading(false);
    }
  };

  // Success Modal with beautiful animation
  if (showSuccess) {
    return (
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto mt-20 max-w-2xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-8 text-center shadow-xl">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-3 text-2xl font-bold text-slate-900"
            >
              Tạo tài khoản thành công!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 text-slate-600"
            >
              Email kích hoạt đã được gửi đến <span className="font-semibold text-cyan-600">{formData.email}</span>.
              <br />Quản trị viên cần xác nhận email để kích hoạt tài khoản.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <Info className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="text-left text-sm text-slate-700">
                  <p className="mb-2 font-semibold text-slate-900">Các bước tiếp theo:</p>
                  <ol className="list-inside list-decimal space-y-1.5">
                    <li>Quản trị viên kiểm tra email và click vào link kích hoạt</li>
                    <li>Đặt mật khẩu cho tài khoản</li>
                    <li>Đăng nhập vào hệ thống với quyền Admin</li>
                  </ol>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 text-sm text-slate-500"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang chuyển về danh sách quản trị viên...
            </motion.div>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6 max-w-4xl"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-4">
          <Link
            href="/admin/staff"
            className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Thêm quản trị viên mới</h1>
              <p className="text-slate-500">Tạo tài khoản và gửi email mời kích hoạt</p>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-900">Có lỗi xảy ra</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <motion.div
            variants={fadeInUp}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-xl"
          >
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />

            <div className="p-6 space-y-8">
              {/* Admin Badge */}
              <motion.div
                variants={fadeInUp}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200"
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Quản trị viên hệ thống</h3>
                  <p className="text-sm text-slate-600">Toàn quyền quản lý hệ thống, tạo và quản lý tài khoản</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  ADMIN
                </div>
              </motion.div>

              {/* Thông tin cá nhân */}
              <motion.div variants={fadeInUp}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <User className="h-5 w-5 text-slate-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Thông tin cá nhân</h2>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Full Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        placeholder="admin@hospital.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        placeholder="0901234567"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">Format: 0XXXXXXXXX (10-11 số)</p>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Ngày sinh</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Giới tính</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Địa chỉ</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        placeholder="Số nhà, đường, phường, quận, thành phố"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Thông tin công việc */}
              <motion.div variants={fadeInUp}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Briefcase className="h-5 w-5 text-slate-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Thông tin công việc</h2>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Title */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Chức danh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Quản trị viên hệ thống"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Phòng ban</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer"
                    >
                      <option value="">Chọn phòng ban (tùy chọn)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.nameVi}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Kinh nghiệm (năm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="5"
                    />
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Ngôn ngữ</label>
                    <input
                      type="text"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Vietnamese, English"
                    />
                  </div>

                  {/* Education */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Học vấn</label>
                    <input
                      type="text"
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Đại học Công nghệ Thông tin"
                    />
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Giới thiệu</label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                      placeholder="Mô tả ngắn về quản trị viên..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Email Invitation Section */}
              <motion.div variants={fadeInUp} className="border-t border-slate-100 pt-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Mail className="h-5 w-5 text-slate-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Gửi email kích hoạt</h2>
                </div>

                <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-5 mb-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-cyan-100">
                      <Info className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div className="text-sm text-slate-700">
                      <p className="mb-2 font-semibold text-slate-900">Quy trình kích hoạt tài khoản:</p>
                      <ul className="list-inside list-disc space-y-1 text-slate-600">
                        <li>Tài khoản được tạo với trạng thái <span className="font-medium text-cyan-700">chưa kích hoạt</span></li>
                        <li>Email chứa link kích hoạt sẽ được gửi tự động</li>
                        <li>Quản trị viên click link, đặt mật khẩu và kích hoạt</li>
                        <li>Sau khi kích hoạt, có thể đăng nhập với quyền Admin</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.sendInvitationEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, sendInvitationEmail: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900">
                      Gửi email mời kích hoạt tài khoản
                    </span>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Email sẽ được gửi đến{' '}
                      <span className="font-medium text-cyan-600">
                        {formData.email || '(chưa nhập email)'}
                      </span>
                    </p>
                  </div>
                </label>

                <AnimatePresence>
                  {!formData.sendInvitationEmail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          Nếu không gửi email, bạn cần thông báo thông tin đăng nhập cho quản trị viên bằng cách khác.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Actions */}
              <motion.div
                variants={fadeInUp}
                className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6"
              >
                <Link
                  href="/admin/staff"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Hủy
                </Link>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium shadow-lg shadow-cyan-500/25 hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {formData.sendInvitationEmail ? 'Tạo và gửi email' : 'Tạo tài khoản'}
                    </>
                  )}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}

/**
 * Admin - Thêm quản trị viên mới
 * Route: /admin/staff/add?role=admin
 */
export default function AddStaffPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      </DashboardLayout>
    }>
      <AddStaffPageContent />
    </Suspense>
  );
}
