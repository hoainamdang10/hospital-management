'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { ArrowLeft, Save, Mail, AlertCircle, CheckCircle2, Info, User, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type StaffType = 'doctor' | 'admin' | 'receptionist';

const STAFF_TYPES: { value: StaffType; label: string; icon: string; description: string }[] = [
  { 
    value: 'doctor', 
    label: 'Bác sĩ', 
    icon: '👨‍⚕️',
    description: 'Khám bệnh, kê đơn, quản lý hồ sơ bệnh án'
  },
  { 
    value: 'admin', 
    label: 'Quản trị viên', 
    icon: '👔',
    description: 'Quản lý toàn bộ hệ thống, tạo tài khoản'
  },
  { 
    value: 'receptionist', 
    label: 'Lễ tân', 
    icon: '📋',
    description: 'Check-in bệnh nhân, xác nhận lịch hẹn'
  },
];

const DEPARTMENTS = [
  { value: 'cardiology', label: 'Tim mạch' },
  { value: 'neurology', label: 'Thần kinh' },
  { value: 'orthopedics', label: 'Chỉnh hình' },
  { value: 'pediatrics', label: 'Nhi khoa' },
  { value: 'dermatology', label: 'Da liễu' },
  { value: 'emergency', label: 'Cấp cứu' },
  { value: 'general', label: 'Đa khoa' },
  { value: 'administration', label: 'Hành chính' },
];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement API call to create staff and send invitation
      console.log('Creating staff with data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
    return STAFF_TYPES.find(t => t.value === formData.staffType)?.label || 'Nhân viên';
  };

  const isDoctorType = formData.staffType === 'doctor';

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
                ? `Email kích hoạt đã được gửi đến ${formData.email}. ${getStaffTypeLabel()} cần xác nhận email để kích hoạt tài khoản.`
                : `Tài khoản ${getStaffTypeLabel().toLowerCase()} đã được tạo. Bạn có thể gửi thông tin đăng nhập cho họ sau.`
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-left text-sm text-blue-900">
                  <p className="font-medium mb-1">Các bước tiếp theo:</p>
                  <ol className="list-decimal list-inside space-y-1">
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
          <Link
            href="/admin/staff"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h1>
            <p className="text-gray-600 mt-1">Tạo tài khoản và gửi email mời kích hoạt</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
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
            
            {/* Loại nhân viên */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Loại nhân viên</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STAFF_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, staffType: type.value, specialization: '' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.staffType === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{type.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">{type.label}</div>
                        <div className="text-xs text-gray-600">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Thông tin cá nhân */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
              </div>
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
                    placeholder="email@hospital.com"
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
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quốc tịch
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Vietnamese"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Số nhà, đường, phường, quận, thành phố"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin nghề nghiệp */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Thông tin nghề nghiệp</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chức danh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={isDoctorType ? "Bác sĩ" : formData.staffType === 'admin' ? "Quản trị viên" : "Lễ tân"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khoa/Phòng ban <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Chọn khoa/phòng ban</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                </div>

                {isDoctorType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chuyên khoa <span className="text-red-500">*</span>
                    </label>
                    <select
                      required={isDoctorType}
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Chọn chuyên khoa</option>
                      {DOCTOR_SPECIALIZATIONS.map(spec => (
                        <option key={spec.value} value={spec.value}>{spec.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {isDoctorType && (
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
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kinh nghiệm (năm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngôn ngữ
                  </label>
                  <input
                    type="text"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Vietnamese, English"
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
                    placeholder={isDoctorType ? "Bác sĩ, Đại học Y Hà Nội" : "Đại học, chuyên ngành"}
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
                    placeholder="Mô tả ngắn về nhân viên..."
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
                      <li>Email chứa link kích hoạt sẽ được gửi đến địa chỉ email của nhân viên</li>
                      <li>Nhân viên click vào link, đặt mật khẩu và kích hoạt tài khoản</li>
                      <li>Sau khi kích hoạt, nhân viên có thể đăng nhập vào hệ thống</li>
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
                      Nếu không gửi email, bạn cần thông báo thông tin đăng nhập cho nhân viên bằng cách khác.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link
                href="/admin/staff"
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
