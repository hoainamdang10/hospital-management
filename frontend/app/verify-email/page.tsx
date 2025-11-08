'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/api/auth.service';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Mã xác thực không hợp lệ');
        return;
      }

      try {
        const response = await authService.verifyEmail({ token });

        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email đã được xác thực thành công!');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.message || 'Xác thực email thất bại');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 'Có lỗi xảy ra khi xác thực email. Vui lòng thử lại.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-6 h-16 w-16 animate-spin text-primary" />
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Đang xác thực email...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Xác thực thành công!</h2>
            <p className="mb-6 text-gray-600">{message}</p>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Tài khoản của bạn đã được kích hoạt. Bạn sẽ được chuyển đến trang đăng nhập...
              </p>
            </div>
            <Button onClick={() => router.push('/login')} className="mt-6 w-full">
              Đăng nhập ngay
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Xác thực thất bại</h2>
            <p className="mb-6 text-gray-600">{message}</p>
            <div className="space-y-3">
              <div className="rounded-lg bg-red-50 p-4 text-left">
                <h3 className="mb-2 font-semibold text-red-900">Có thể do:</h3>
                <ul className="space-y-1 text-sm text-red-800">
                  <li>• Link xác thực đã hết hạn (24 giờ)</li>
                  <li>• Link đã được sử dụng</li>
                  <li>• Link không hợp lệ</li>
                </ul>
              </div>
              <Button onClick={() => router.push('/register')} variant="outline" className="w-full">
                Đăng ký lại
              </Button>
              <Button onClick={() => router.push('/login')} className="w-full">
                Quay lại đăng nhập
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
