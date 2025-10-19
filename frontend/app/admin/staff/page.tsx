'use client';

/**
 * Admin Staff Management Page
 * Allows admin to create staff invitations
 * 
 * URL: /admin/staff
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProvisionStaffForm } from '@/modules/identity/components/ProvisionStaffForm';

export default function AdminStaffPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
      router.push('/login?redirect=/admin/staff');
      return;
    }

    // Check if user is admin
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      setError('Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể tạo lời mời nhân viên.');
      setIsLoading(false);
      return;
    }

    setAccessToken(token);
    setIsLoading(false);
  }, [router]);

  const handleSuccess = (data: { invitationUrl: string; expiresAt: string }) => {
    console.log('Staff invitation created:', data);
  };

  const handleError = (errorMessage: string) => {
    console.error('Staff invitation error:', errorMessage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-neutral-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Không có quyền truy cập</h2>
              <p className="text-neutral-600 mb-6">{error}</p>
              <a
                href="/dashboard"
                className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
              >
                Quay lại Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Quản lý nhân viên</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Tạo lời mời kích hoạt tài khoản cho nhân viên mới
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              ← Quay lại Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8">
          {/* Create Invitation Card */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Tạo lời mời nhân viên</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Điền thông tin nhân viên để tạo lời mời kích hoạt tài khoản
              </p>
            </div>

            <ProvisionStaffForm
              accessToken={accessToken}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* How it works */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Quy trình kích hoạt</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">1.</span>
                  <span>Admin tạo lời mời với email và vai trò</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">2.</span>
                  <span>Nhân viên nhận email với link kích hoạt</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">3.</span>
                  <span>Nhân viên click link và tạo mật khẩu</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">4.</span>
                  <span>Tài khoản được kích hoạt và sẵn sàng sử dụng</span>
                </li>
              </ol>
            </div>

            {/* Roles Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">Vai trò nhân viên</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>Quản trị viên:</strong> Quản lý hệ thống</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>Bác sĩ:</strong> Khám và điều trị bệnh nhân</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>Y tá:</strong> Chăm sóc bệnh nhân</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>Lễ tân:</strong> Tiếp nhận bệnh nhân</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Lưu ý bảo mật</h3>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li>• Link kích hoạt có hiệu lực trong 7 ngày</li>
                  <li>• Mỗi link chỉ có thể sử dụng một lần</li>
                  <li>• Email phải là địa chỉ email chính thức của bệnh viện</li>
                  <li>• Không chia sẻ link kích hoạt với người khác</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
