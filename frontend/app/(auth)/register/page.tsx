'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

const registerSchema = z
  .object({
    // Required fields (match backend)
    email: z.string().email('Email không hợp lệ'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    
    // Optional fields (match backend)
    phoneNumber: z
      .string()
      .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số')
      .optional()
      .or(z.literal('')),
    citizenId: z
      .string()
      .regex(/^[0-9]{9,12}$/, 'Số CMND/CCCD phải có 9-12 chữ số')
      .optional()
      .or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
    address: z.string().optional(),
    
    // UI only
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Bạn phải đồng ý với điều khoản sử dụng',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Register Page
 * Route: /register
 */
export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, acceptTerms, ...rest } = data;
    
    // Clean up empty optional fields
    const registerData: any = {
      email: rest.email,
      password: rest.password,
      fullName: rest.fullName,
    };
    
    // Only include optional fields if they have values
    if (rest.phoneNumber) registerData.phoneNumber = rest.phoneNumber;
    if (rest.citizenId) registerData.citizenId = rest.citizenId;
    if (rest.dateOfBirth) registerData.dateOfBirth = rest.dateOfBirth;
    if (rest.gender) registerData.gender = rest.gender;
    if (rest.address) registerData.address = rest.address;
    
    registerUser(registerData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Đăng ký tài khoản</h1>
          <p className="mt-2 text-sm text-gray-600">
            Tạo tài khoản bệnh nhân để đặt lịch khám và quản lý sức khỏe
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg bg-white p-8 shadow">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                {...register('fullName')}
                type="text"
                id="fullName"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nguyễn Văn An"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                {...register('phoneNumber')}
                type="tel"
                id="phoneNumber"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0912345678 (10-11 số)"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Citizen ID */}
            <div>
              <label htmlFor="citizenId" className="block text-sm font-medium text-gray-700">
                Số CMND/CCCD
              </label>
              <input
                {...register('citizenId')}
                type="text"
                id="citizenId"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="9-12 chữ số"
              />
              {errors.citizenId && (
                <p className="mt-1 text-sm text-red-600">{errors.citizenId.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Ngày sinh
              </label>
              <input
                {...register('dateOfBirth')}
                type="date"
                id="dateOfBirth"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Giới tính
              </label>
              <select
                {...register('gender')}
                id="gender"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Chọn giới tính</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Địa chỉ
              </label>
              <input
                {...register('address')}
                type="text"
                id="address"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="flex items-start">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              id="acceptTerms"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
              Tôi đồng ý với{' '}
              <Link href="/terms" className="text-primary hover:text-primary/80">
                Điều khoản sử dụng
              </Link>{' '}
              và{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80">
                Chính sách bảo mật
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
          )}

          {/* Info Box */}
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">📌 Lưu ý:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Chỉ cần điền <strong>Email, Mật khẩu và Họ tên</strong> để đăng ký</li>
              <li>Các thông tin khác có thể bổ sung sau khi xác thực email</li>
              <li>Bạn sẽ nhận email xác thực để kích hoạt tài khoản</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:text-primary/80">
              Đăng nhập ngay
            </Link>
          </p>
        </form>

        {/* Back to Home */}
        <div className="text-center">
          <Link href={ROUTES.HOME} className="text-sm text-gray-600 hover:text-gray-900">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
