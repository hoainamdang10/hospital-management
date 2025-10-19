'use client';

/**
 * Staff Activation Page
 * Allows staff to activate their account from invitation link
 * 
 * URL: /auth/activate?token=xxx
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { StaffActivationForm } from '@/modules/identity/components/StaffActivationForm';

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Liên kết kích hoạt không hợp lệ. Vui lòng kiểm tra lại email của bạn.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSuccess = (data: { userId: string; email: string; role: string }) => {
    console.log('Staff activation successful:', data);
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Lỗi kích hoạt</h2>
              <p className="text-neutral-600 mb-6">{error}</p>
              <a
                href="/login"
                className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
              >
                Quay lại đăng nhập
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-neutral-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">
            Kích hoạt tài khoản nhân viên
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Vui lòng điền thông tin để hoàn tất kích hoạt tài khoản
          </p>
        </div>

        {/* Activation Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <StaffActivationForm
            invitationToken={token}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Gặp vấn đề?{' '}
            <a href="mailto:support@hospital.vn" className="text-brand hover:underline">
              Liên hệ hỗ trợ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StaffActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-neutral-600">Đang tải...</p>
        </div>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}
