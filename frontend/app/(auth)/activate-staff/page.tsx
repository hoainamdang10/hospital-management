'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

function ActivateStaffPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
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
        throw new Error('Kích hoạt thất bại');
      }
      const userId = activateRes.user.id;
      const validateRes = await authService.validateInvitation(token!);
      const invitationData = validateRes?.invitationData || {};
      const { createStaffProfile, getStaffByUserId, assignStaffToDepartment } = await import(
        '@/lib/api/staff.service'
      );
      const { getDepartments } = await import('@/lib/api/departments.service');
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        userId,
        staffType: 'doctor' as const,
        personalInfo: {
          fullName: activateRes.user?.email?.split('@')[0] || 'Chưa cập nhật',
          dateOfBirth: '1990-01-01',
          gender: 'other' as const,
          nationalId: '000000000',
          nationality: 'Vietnamese',
          phoneNumber: invitationData.phoneNumber || '0900000000',
          email: activateRes.user.email,
          address: {
            street: 'Chưa cập nhật',
            ward: 'Chưa cập nhật',
            district: 'Chưa cập nhật',
            city: 'Chưa cập nhật',
            province: 'Chưa cập nhật',
            country: 'Vietnam',
          },
        },
        professionalInfo: {
          title: invitationData.title || 'Bác sĩ',
          department: (invitationData.department_code || 'GENERAL').toString().toUpperCase(),
          position: 'Bác sĩ điều trị',
          specialization: invitationData.specialization || '',
          education: invitationData.education || ['General Medicine'],
          languages: invitationData.languages || ['vi'],
          bio: invitationData.bio || '',
        },
        workSchedule: {
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          workingHours: { start: '08:00', end: '17:00' },
          timeZone: 'Asia/Ho_Chi_Minh',
          isFlexible: false,
        },
        licenseNumber: invitationData.licenseNumber || `TEMP-${Date.now()}`,
        employmentType: invitationData.employmentType || 'full_time',
        hireDate: today,
        yearsOfExperience: Number(invitationData.yearsOfExperience || 0),
        consultationFee: invitationData.consultationFee ?? null,
        specializations: invitationData.specializations || [
          {
            code: (invitationData.specialization || invitationData.department_code || 'GENMED').toString().toUpperCase(),
            name: invitationData.specialization ? 'Chuyên khoa chính' : 'General Medicine',
            isActive: true,
          },
        ],
      };
      const createRes = await createStaffProfile(payload);
      if (!createRes?.success) {
        throw new Error('Tạo hồ sơ bác sĩ thất bại');
      }
      const staff = await getStaffByUserId(userId);
      const departments = await getDepartments();
      const deptCode = (invitationData.department_code || 'INTE').toString().toUpperCase();
      const targetDept = departments.find((d) => d.code === deptCode);
      if (staff && targetDept) {
        await assignStaffToDepartment(staff.staffId, {
          departmentId: targetDept.id,
          role: 'Member',
          isPrimary: true,
          startDate: today,
        });
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình kích hoạt');
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Link không hợp lệ</h2>
          <p className="mb-6 text-gray-600">Link kích hoạt không hợp lệ hoặc đã hết hạn.</p>
          <Link href={ROUTES.LOGIN}>
            <Button className="w-full">Đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="mt-4 mb-2 text-2xl font-bold text-gray-900">Kích hoạt thành công!</h2>
          <p className="mb-6 text-gray-600">Tài khoản của bạn đã được kích hoạt.</p>
          <Link href={ROUTES.LOGIN}>
            <Button className="w-full">Đăng nhập ngay</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Kích hoạt tài khoản</h2>
          <p className="mt-2 text-gray-600">Đặt mật khẩu để kích hoạt tài khoản nhân viên</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 focus:ring-1 focus:outline-none"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-1 focus:outline-none"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Kích hoạt tài khoản
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ActivateStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-sm text-gray-600">Đang tải thông tin kích hoạt...</p>
          </div>
        </div>
      }
    >
      <ActivateStaffPageContent />
    </Suspense>
  );
}
