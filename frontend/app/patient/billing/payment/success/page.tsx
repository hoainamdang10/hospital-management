'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { toast } from 'sonner';

/**
 * Payment Success Page
 * Route: /patient/billing/payment/success
 * 
 * Displayed after successful PayOS payment
 * Query params: orderCode, status
 */
export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);

  const orderCode = searchParams.get('orderCode');
  const status = searchParams.get('status');
  const appointmentId = searchParams.get('appointmentId');

  useEffect(() => {
    // Simulate verification delay
    const timer = setTimeout(() => {
      setIsVerifying(false);
      toast.success('Thanh toán thành công!');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleBackToBilling = () => {
    // If payment is for appointment, redirect to appointments page
    if (appointmentId) {
      router.push('/patient/appointments');
    } else {
      router.push('/patient/billing');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
          {isVerifying ? (
            <>
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-600" />
              <h1 className="mt-6 text-2xl font-bold text-gray-900">
                Đang xác nhận thanh toán...
              </h1>
              <p className="mt-2 text-gray-600">Vui lòng đợi trong giây lát</p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="mt-6 text-2xl font-bold text-gray-900">
                Thanh toán thành công!
              </h1>
              <p className="mt-2 text-gray-600">
                Giao dịch của bạn đã được xử lý thành công
              </p>

              {orderCode && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Mã giao dịch</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
                    {orderCode}
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <Button onClick={handleBackToBilling} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {appointmentId ? 'Xem danh sách lịch hẹn' : 'Quay lại trang thanh toán'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/patient/dashboard')}
                  className="w-full"
                >
                  Về trang chủ
                </Button>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                Bạn sẽ nhận được email xác nhận trong vài phút
              </p>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

