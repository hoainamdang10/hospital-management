'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { ArrowLeft, Save, Mail, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Admin - Thêm bác sĩ mới
 */
export default function AddDoctorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; code: string; nameVi: string; nameEn: string }>>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    nationality: 'Vietnamese',
    address: '',
    specialization: '',
    department: '',
    position: 'doctor',
    licenseNumber: '',
    experience: '',
    education: '',
    languages: 'Vietnamese, English',
    bio: '',
    sendInvitationEmail: true, // Mặc định gửi email
  });

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { getDepartments } = await import('@/lib/api/departments.service');
        const list = await getDepartments();
        const mapped = list.map(d => ({ id: d.id, code: d.code, nameVi: d.nameVi, nameEn: d.nameEn }));
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
        roleType: 'doctor' as const,
        phoneNumber: formData.phone,
        invitationData: {
          department_code: formData.department || 'GENERAL',
          specialization: formData.specialization,
          title: 'Bác sĩ',
          licenseNumber: formData.licenseNumber || `TEMP-${Date.now()}`,
          employmentType: 'full_time',
          yearsOfExperience: Number(formData.experience || 0),
          education: formData.education ? [formData.education] : ['General Medicine'],
          languages: formData.languages ? formData.languages.split(',').map(s => s.trim()) : ['vi'],
          bio: formData.bio || '',
        }
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

  // Success Modal
  if (showSuccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tạo tài khoản thành công!</h2>
            <p className="text-gray-600 mb-6">
              {formData.sendInvitationEmail
                ? `Email kích hoạt đã được gửi đến ${formData.email}. Bác sĩ cần xác nhận email để kích hoạt tài khoản.`
                : 'Tài khoản bác sĩ đã được tạo. Bạn có thể gửi thông tin đăng nhập cho họ sau.'
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left text-sm text-blue-900">
                  <p className="font-medium mb-1">Các bước tiếp theo:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Bác sĩ kiểm tra email và click vào link kích hoạt</li>
                    <li>Đặt mật khẩu cho tài khoản</li>
                    <li>Đăng nhập vào hệ thống</li>
                  </ol>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">Đang chuyển hướng về danh sách bác sĩ...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/doctors"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm bác sĩ mới</h1>
            <p className="text-gray-600 mt-1">Tạo tài khoản và gửi email mời kích hoạt</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Có lỗi xảy ra</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            {/* Thông tin cá nhân */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="doctor@hospital.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0901234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khoa <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Chọn khoa</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.code}>
                        {d.nameVi} ({d.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Thông tin nghề nghiệp */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin nghề nghiệp</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chuyên khoa <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Chọn chuyên khoa</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.code.toLowerCase()}>
                        {d.nameVi}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số chứng chỉ hành nghề
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="BS-12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kinh nghiệm (năm)
                  </label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Học vấn
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bác sĩ, Đại học Y Hà Nội"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới thiệu
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Mô tả ngắn về bác sĩ..."
                  />
                </div>
              </div>
            </div>

            {/* Email Invitation Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Gửi email mời kích hoạt</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Cách thức hoạt động:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Tài khoản sẽ được tạo với trạng thái <strong>chưa kích hoạt</strong></li>
                      <li>Email chứa link kích hoạt sẽ được gửi đến địa chỉ email của bác sĩ</li>
                      <li>Bác sĩ click vào link, đặt mật khẩu và kích hoạt tài khoản</li>
                      <li>Sau khi kích hoạt, bác sĩ có thể đăng nhập vào hệ thống</li>
                    </ul>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendInvitationEmail}
                  onChange={(e) => setFormData({ ...formData, sendInvitationEmail: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Gửi email mời kích hoạt tài khoản
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Email sẽ được gửi đến <strong>{formData.email || '(chưa nhập email)'}</strong>
                  </p>
                </div>
              </label>

              {!formData.sendInvitationEmail && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-800">
                      Nếu không gửi email, bạn cần thông báo thông tin đăng nhập cho bác sĩ bằng cách khác.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link
                href="/admin/doctors"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {formData.sendInvitationEmail ? 'Tạo và gửi email' : 'Tạo tài khoản'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
