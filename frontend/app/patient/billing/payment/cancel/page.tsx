'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Payment Cancel Page
 * Route: /patient/billing/payment/cancel
 *
 * Displayed when user cancels PayOS payment
 * Query params: orderCode, status
 */
function PaymentCancelPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderCode = searchParams.get('orderCode');

  const handleBackToBilling = () => {
    router.push('/patient/billing');
  };

  const handleRetry = () => {
    router.push('/patient/billing');
  };

  return (
    <DashboardLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Thanh toán đã bị hủy</h1>
          <p className="mt-2 text-gray-600">Bạn đã hủy giao dịch thanh toán</p>

          {orderCode && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Mã giao dịch</p>
              <p className="mt-1 font-mono text-lg font-semibold text-gray-900">{orderCode}</p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại thanh toán
            </Button>
            <Button variant="outline" onClick={handleBackToBilling} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại trang thanh toán
            </Button>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Hóa đơn của bạn vẫn chưa được thanh toán. Bạn có thể thử lại bất kỳ lúc nào.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-sm text-gray-600">Đang tải trạng thái thanh toán...</p>
          </div>
        </DashboardLayout>
      }
    >
      <PaymentCancelPageContent />
    </Suspense>
  );
}
