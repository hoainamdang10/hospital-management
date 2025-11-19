'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { toast } from 'sonner';
import { billingService } from '@/modules/billing/services/billing.service';
import type { Invoice } from '@/modules/billing/services/billing.service';
import { useAuth } from '@/hooks/useAuth';

/**
 * Payment Pending Page
 * Route: /patient/appointments/payment-pending
 *
 * Displayed after scheduling appointment with prepaid payment model
 * Query params:
 * - appointmentId (required) - ID của appointment vừa tạo
 * - paymentLink (optional) - PayOS checkout URL từ backend response
 * - paymentDeadline (optional) - ISO string cho countdown timer
 * - invoiceId (optional) - Invoice ID để track payment status
 *
 * Features:
 * - Countdown timer (30 minutes)
 * - Payment link button (redirect to PayOS)
 * - Payment status polling (every 10 seconds)
 * - Auto-redirect when payment successful
 * - Graceful degradation if payment link not available
 */
function PaymentPendingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL params
  const appointmentId = searchParams.get('appointmentId');
  const initialPaymentLink = searchParams.get('paymentLink');
  const paymentDeadlineParam = searchParams.get('paymentDeadline');
  const invoiceIdParam = searchParams.get('invoiceId');

  // State
  const [paymentLink, setPaymentLink] = useState<string | null>(initialPaymentLink);
  const [invoiceId, setInvoiceId] = useState<string | null>(invoiceIdParam);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoadingPaymentLink, setIsLoadingPaymentLink] = useState(!initialPaymentLink);
  const [isPolling, setIsPolling] = useState(true);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // seconds
  const [isExpired, setIsExpired] = useState(false);

  // Calculate initial time remaining
  useEffect(() => {
    if (paymentDeadlineParam) {
      const deadline = new Date(paymentDeadlineParam);
      const now = new Date();
      const diff = Math.floor((deadline.getTime() - now.getTime()) / 1000);
      setTimeRemaining(Math.max(0, diff));
      setIsExpired(diff <= 0);
    } else {
      // Default: 30 minutes
      setTimeRemaining(30 * 60);
      setIsExpired(false);
    }
  }, [paymentDeadlineParam]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null) {
      return;
    }

    if (timeRemaining <= 0) {
      setIsExpired(true);
      setIsPolling(false);
      return;
    }

    setIsExpired(false);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsExpired(true);
          setIsPolling(false);
          clearInterval(timer);
        }
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get time remaining color
  const getTimeRemainingColor = (): string => {
    if (timeRemaining === null) return 'text-gray-900';
    if (timeRemaining <= 0) return 'text-red-600';
    if (timeRemaining < 5 * 60) return 'text-orange-600'; // < 5 minutes
    return 'text-gray-900';
  };

  // Poll for payment link if not available
  const pollForPaymentLink = useCallback(async () => {
    if (!appointmentId || paymentLink || pollingAttempts >= 5) {
      setIsLoadingPaymentLink(false);
      return;
    }

    try {
      setPollingAttempts((prev) => prev + 1);

      const patientIdentifier = (() => {
        if (user?.id) {
          return user.id;
        }
        if (user?.userId) {
          return user.userId;
        }
        try {
          const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (cachedUser?.id) {
            return cachedUser.id;
          }
          if (cachedUser?.userId) {
            return cachedUser.userId;
          }
          if (user?.patientId) {
            return user.patientId;
          }
          return cachedUser?.patientId || null;
        } catch {
          return user?.patientId || null;
        }
      })();
      if (!patientIdentifier) {
        setIsLoadingPaymentLink(false);
        setIsPolling(false);
        toast.error('Không tìm thấy thông tin bệnh nhân. Vui lòng đăng nhập lại.');
        return;
      }

      const invoices = await billingService.getPatientInvoices(patientIdentifier);

      let targetInvoice: Invoice | undefined;
      if (invoiceId) {
        targetInvoice = invoices.find((inv) => inv.id === invoiceId);
      }
      if (!targetInvoice && appointmentId) {
        targetInvoice = invoices.find((inv) => inv.appointmentId === appointmentId);
      }
      if (!targetInvoice) {
        targetInvoice = invoices.find((inv) => inv.status === 'pending');
      }

      if (!targetInvoice) {
        if (pollingAttempts >= 5) {
          setIsLoadingPaymentLink(false);
          toast.error(
            'Không tìm thấy hóa đơn cho lịch hẹn này. Có thể lịch hẹn đã bị hủy hoặc chưa được tạo.'
          );
        }
        return;
      }

      setInvoice(targetInvoice);
      setInvoiceId(targetInvoice.id);

      if (!paymentLink) {
        const paymentLinkResponse = await billingService.createPayOSPaymentLink(targetInvoice.id, {
          buyerName: user?.fullName,
          buyerEmail: user?.email,
          buyerPhone: user?.phone,
        });

        setPaymentLink(paymentLinkResponse.checkoutUrl);
        setIsLoadingPaymentLink(false);
        toast.success('Đã tạo link thanh toán!');
      }
    } catch (error) {
      console.error('[PaymentPending] Failed to poll for payment link:', error);

      if (pollingAttempts >= 5) {
        setIsLoadingPaymentLink(false);
        toast.error('Không thể tạo link thanh toán. Vui lòng thử lại sau.');
      }
    }
  }, [appointmentId, paymentLink, invoiceId, pollingAttempts, user]);

  // Poll for payment status
  const pollForPaymentStatus = useCallback(async () => {
    if (!invoiceId || !isPolling) return;

    try {
      const updatedInvoice = await billingService.getInvoiceById(invoiceId);
      setInvoice(updatedInvoice);

      // Check if payment is completed
      if (updatedInvoice.status === 'paid') {
        setIsPolling(false);
        toast.success('Thanh toán thành công!');

        // Redirect to success page
        setTimeout(() => {
          router.push(
            `/patient/billing/payment/success?appointmentId=${appointmentId}&orderCode=${updatedInvoice.payments[0]?.transactionId || 'N/A'}`
          );
        }, 1500);
      }
    } catch (error) {
      console.error('[PaymentPending] Failed to poll for payment status:', error);
    }
  }, [invoiceId, isPolling, appointmentId, router]);

  // Initial payment link polling
  useEffect(() => {
    if (isLoadingPaymentLink && pollingAttempts < 5) {
      const timer = setTimeout(() => {
        pollForPaymentLink();
      }, 2000); // Poll every 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isLoadingPaymentLink, pollingAttempts, pollForPaymentLink]);

  // Payment status polling
  useEffect(() => {
    if (!isPolling || !invoiceId) return;

    const interval = setInterval(() => {
      pollForPaymentStatus();
    }, 10000); // Poll every 10 seconds

    // Initial poll
    pollForPaymentStatus();

    return () => clearInterval(interval);
  }, [isPolling, invoiceId, pollForPaymentStatus]);

  // Auto-redirect when expired
  useEffect(() => {
    if (isExpired) {
      toast.error('Hết thời gian thanh toán. Vui lòng đặt lịch lại.');

      const timer = setTimeout(() => {
        router.push('/patient/appointments');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isExpired, router]);

  // Validate required params
  if (!appointmentId) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto h-16 w-16 text-red-600" />
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Thiếu thông tin</h1>
            <p className="mt-2 text-gray-600">Không tìm thấy thông tin lịch hẹn</p>
            <Button onClick={() => router.push('/patient/appointments')} className="mt-6 w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách lịch hẹn
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-lg border bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Đặt lịch thành công!</h1>
            <p className="mt-2 text-gray-600">Vui lòng thanh toán để xác nhận lịch hẹn</p>
          </div>

          {/* Countdown Timer */}
          <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
            <div className="flex items-center justify-center space-x-3">
              <Clock className={`h-6 w-6 ${getTimeRemainingColor()}`} />
              <div className="text-center">
                <p className="text-sm text-gray-600">Thời gian còn lại</p>
                <p className={`text-3xl font-bold ${getTimeRemainingColor()}`}>
                  {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            </div>
            {timeRemaining !== null && timeRemaining < 5 * 60 && timeRemaining > 0 && (
              <p className="mt-3 text-center text-sm text-orange-600">
                ⚠️ Còn ít hơn 5 phút! Vui lòng thanh toán ngay.
              </p>
            )}
            {isExpired && (
              <p className="mt-3 text-center text-sm text-red-600">
                ⏰ Hết thời gian thanh toán. Lịch hẹn sẽ bị hủy tự động.
              </p>
            )}
          </div>

          {/* Payment Link Section */}
          <div className="mt-8">
            {isLoadingPaymentLink ? (
              <div className="rounded-lg border bg-blue-50 p-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-sm text-gray-700">Đang tạo link thanh toán...</p>
                <p className="mt-1 text-xs text-gray-500">
                  Vui lòng đợi trong giây lát ({pollingAttempts}/5)
                </p>
              </div>
            ) : paymentLink ? (
              <div className="space-y-4">
                <Button
                  onClick={() => (window.location.href = paymentLink)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  disabled={isExpired}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Thanh toán ngay
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-center text-xs text-gray-500">
                  Bạn sẽ được chuyển đến trang thanh toán PayOS
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-orange-600" />
                <p className="mt-3 text-sm text-gray-700">Không thể tạo link thanh toán tự động</p>
                <p className="mt-1 text-xs text-gray-500">
                  Vui lòng vào trang thanh toán để xem hóa đơn
                </p>
                <Button
                  onClick={() => router.push('/patient/billing')}
                  variant="outline"
                  className="mt-4"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Xem danh sách hóa đơn
                </Button>
              </div>
            )}
          </div>

          {/* Invoice Info */}
          {invoice && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Thông tin hóa đơn</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã hóa đơn:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-semibold text-gray-900">
                    {invoice.totalAmount.toLocaleString('vi-VN')} {invoice.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span
                    className={`font-semibold ${
                      invoice.status === 'paid'
                        ? 'text-green-600'
                        : invoice.status === 'pending'
                          ? 'text-orange-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {invoice.status === 'paid'
                      ? 'Đã thanh toán'
                      : invoice.status === 'pending'
                        ? 'Chờ thanh toán'
                        : invoice.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback Actions */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={() => router.push('/patient/appointments')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách lịch hẹn
            </Button>
            <Button
              onClick={() => router.push('/patient/billing')}
              variant="ghost"
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Xem danh sách hóa đơn
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-center text-xs text-gray-500">
            Bạn sẽ nhận được thông báo qua email khi thanh toán thành công
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex h-[70vh] items-center justify-center">
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow">
              <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
              <p className="mt-3 text-sm text-gray-600">Đang tải thông tin thanh toán...</p>
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <PaymentPendingPageContent />
    </Suspense>
  );
}
