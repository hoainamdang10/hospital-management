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
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type StaffType = 'doctor' | 'admin';

const STAFF_TYPES: { value: StaffType; label: string; icon: string; description: string }[] = [
  {
    value: 'doctor',
    label: 'Bác sĩ',
    icon: '👨‍⚕️',
    description: 'Khám bệnh, kê đơn, quản lý hồ sơ bệnh án',
  },
  {
    value: 'admin',
    label: 'Quản trị viên',
    icon: '👔',
    description: 'Quản lý toàn bộ hệ thống, tạo tài khoản',
  },
];

const DEPARTMENTS: { value: string; label: string }[] = [];

const DOCTOR_SPECIALIZATIONS = [
  { value: 'cardiology', label: 'Tim mạch' },
  { value: 'neurology', label: 'Thần kinh' },
  { value: 'orthopedics', label: 'Chỉnh hình' },
  { value: 'pediatrics', label: 'Nhi khoa' },
  { value: 'dermatology', label: 'Da liễu' },
  { value: 'general', label: 'Đa khoa' },
];

/**
 * Admin - Thêm nhân viên mới
 */
export default function AddStaffPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<
    Array<{ id: string; code: string; nameVi: string; nameEn: string }>
  >([]);

  const [formData, setFormData] = useState({
    // Staff Type
    staffType: 'doctor' as StaffType,

    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    nationality: 'Vietnamese',
    address: '',

    // Professional Info
    title: '',
    department: '',
    position: '',
    specialization: '',
    licenseNumber: '',
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
      const roleType = formData.staffType === 'admin' ? 'admin' : 'doctor';
      const payload = {
        email: formData.email,
        fullName: formData.fullName,
        roleType: roleType as 'doctor' | 'admin',
        phoneNumber: formData.phone,
        invitationData: {
          departmentCode: formData.department || 'INTE',
          specializationCode: isDoctorType ? formData.specialization || undefined : undefined,
          specializationName: isDoctorType ? formData.specialization || undefined : undefined,
          title: formData.title || (isDoctorType ? 'Bác sĩ' : 'Quản trị viên'),
          position: formData.position || (isDoctorType ? 'Bác sĩ điều trị' : 'Admin'),
          licenseNumber: formData.licenseNumber || `TEMP-${Date.now()}`,
          employmentType: 'full_time',
          yearsOfExperience: Number(formData.experience || 0),
          education: formData.education ? [formData.education] : ['General Medicine'],
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
      setError(err.message || 'Có lỗi xảy ra khi tạo tài khoản nhân viên');
    } finally {
      setIsLoading(false);
    }
  };

  const getStaffTypeLabel = () => {
    return STAFF_TYPES.find((t) => t.value === formData.staffType)?.label || 'Nhân viên';
  };

  const isDoctorType = formData.staffType === 'doctor';

  // Success Modal
  if (showSuccess) {
    return (
      <DashboardLayout>
        <div className="mx-auto mt-20 max-w-2xl">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Tạo tài khoản thành công!</h2>
            <p className="mb-6 text-gray-600">
              {formData.sendInvitationEmail
                ? `Email kích hoạt đã được gửi đến ${formData.email}. ${getStaffTypeLabel()} cần xác nhận email để kích hoạt tài khoản.`
                : `Tài khoản ${getStaffTypeLabel().toLowerCase()} đã được tạo. Bạn có thể gửi thông tin đăng nhập cho họ sau.`}
            </p>
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div className="text-left text-sm text-blue-900">
                  <p className="mb-1 font-medium">Các bước tiếp theo:</p>
                  <ol className="list-inside list-decimal space-y-1">
                    <li>{getStaffTypeLabel()} kiểm tra email và click vào link kích hoạt</li>
                    <li>Đặt mật khẩu cho tài khoản</li>
                    <li>Đăng nhập vào hệ thống</li>
                  </ol>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">Đang chuyển hướng về danh sách nhân viên...</p>
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
          <Link href="/admin/staff" className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h1>
            <p className="mt-1 text-gray-600">Tạo tài khoản và gửi email mời kích hoạt</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Có lỗi xảy ra</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
            {/* Loại nhân viên */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Loại nhân viên</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {STAFF_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, staffType: type.value, specialization: '' })
                    }
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      formData.staffType === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{type.icon}</div>
                      <div className="flex-1">
                        <div className="mb-1 text-sm font-semibold text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-600">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Thông tin cá nhân */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder="email@hospital.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder="0901234567"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Quốc tịch</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder="Vietnamese"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder="Số nhà, đường, phường, quận, thành phố"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin nghề nghiệp */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Thông tin nghề nghiệp</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Chức danh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder={
                      isDoctorType
                        ? 'Bác sĩ'
                        : formData.staffType === 'admin'
                          ? 'Quản trị viên'
                          : 'Lễ tân'
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Khoa/Phòng ban <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  >
                    <option value="">Chọn khoa/phòng ban</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.code}>
                        {d.nameVi} ({d.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                {isDoctorType && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Chuyên khoa <span className="text-red-500">*</span>
                    </label>
                    <select
                      required={isDoctorType}
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    >
                      <option value="">Chọn chuyên khoa</option>
                      {DOCTOR_SPECIALIZATIONS.map((spec) => (
                        <option key={spec.value} value={spec.value}>
                          {spec.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isDoctorType && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Số chứng chỉ hành nghề
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                      placeholder="BS-12345"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Kinh nghiệm (năm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Ngôn ngữ</label>
                  <input
                    type="text"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder="Vietnamese, English"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Học vấn</label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder={
                      isDoctorType ? 'Bác sĩ, Đại học Y Hà Nội' : 'Đại học, chuyên ngành'
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Giới thiệu</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                    placeholder="Mô tả ngắn về nhân viên..."
                  />
                </div>
              </div>
            </div>

            {/* Email Invitation Section */}
            <div className="border-t pt-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Gửi email mời kích hoạt</h2>

              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <p className="mb-1 font-medium">Cách thức hoạt động:</p>
                    <ul className="list-inside list-disc space-y-1 text-blue-800">
                      <li>
                        Tài khoản sẽ được tạo với trạng thái <strong>chưa kích hoạt</strong>
                      </li>
                      <li>Email chứa link kích hoạt sẽ được gửi đến địa chỉ email của nhân viên</li>
                      <li>Nhân viên click vào link, đặt mật khẩu và kích hoạt tài khoản</li>
                      <li>Sau khi kích hoạt, nhân viên có thể đăng nhập vào hệ thống</li>
                    </ul>
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.sendInvitationEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, sendInvitationEmail: e.target.checked })
                  }
                  className="text-primary-600 focus:ring-primary-500 h-5 w-5 rounded border-gray-300 focus:ring-2"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Gửi email mời kích hoạt tài khoản
                  </span>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Email sẽ được gửi đến <strong>{formData.email || '(chưa nhập email)'}</strong>
                  </p>
                </div>
              </label>

              {!formData.sendInvitationEmail && (
                <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                    <p className="text-xs text-yellow-800">
                      Nếu không gửi email, bạn cần thông báo thông tin đăng nhập cho nhân viên bằng
                      cách khác.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Link
                href="/admin/staff"
                className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
