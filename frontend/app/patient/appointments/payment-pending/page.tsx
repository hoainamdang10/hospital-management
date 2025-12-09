'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
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
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { toast } from 'sonner';
import { billingService } from '@/modules/billing/services/billing.service';
import type { Invoice } from '@/modules/billing/services/billing.service';
import { useAuth } from '@/hooks/useAuth';
import { showErrorToast } from '@/lib/utils/error-toast';
import { formatCurrency } from '@/lib/utils';

/**
 * Payment Pending Page
 * Route: /patient/appointments/payment-pending
 *
 * Displayed after scheduling appointment with prepaid payment model
 * Query params:
 * - appointmentId (required) - ID của appointment vừa tạo
 * - paymentLink (optional) - VNPay checkout URL từ backend response
 * - paymentDeadline (optional) - ISO string cho countdown timer
 * - invoiceId (optional) - Invoice ID để track payment status
 *
 * Features:
 * - Countdown timer (10 minutes)
 * - Payment link button (redirect to VNPay)
 * - Payment status polling (every 10 seconds)
 * - Auto-redirect when payment successful
 * - Graceful degradation if payment link not available
 */
const PAYMENT_TIMEOUT_SECONDS = 10 * 60; // 10 minutes
const MAX_PAYMENT_LINK_POLLS = 10;

function PaymentPendingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL params
  const appointmentId = searchParams?.get('appointmentId') || null;
  const initialPaymentLink = searchParams?.get('paymentLink') || null;
  const paymentDeadlineParam = searchParams?.get('paymentDeadline') || null;
  const invoiceIdParam = searchParams?.get('invoiceId') || null;

  // State
  const [paymentLink, setPaymentLink] = useState<string | null>(initialPaymentLink);
  const [invoiceId, setInvoiceId] = useState<string | null>(invoiceIdParam);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoadingPaymentLink, setIsLoadingPaymentLink] = useState(!initialPaymentLink);
  const [isPolling, setIsPolling] = useState(true);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // seconds
  const [isExpired, setIsExpired] = useState(false);

  // Ref to prevent duplicate payment link creation
  const isCreatingPaymentLinkRef = useRef(false);

  const getPatientLiability = useCallback((target: Invoice | null) => {
    if (!target) return 0;
    if (typeof target.patientPaymentAmount === 'number') {
      return Math.max(0, target.patientPaymentAmount);
    }
    return Math.max(0, (target.totalAmount ?? 0) - (target.insuranceCoverage ?? 0));
  }, []);

  const getOutstandingAmount = useCallback(
    (target: Invoice | null) => {
      if (!target) return 0;
      const patientLiability = getPatientLiability(target);
      const storedOutstanding =
        typeof target.outstandingAmount === 'number' ? target.outstandingAmount : 0;
      const paidAmount =
        typeof target.paidAmount === 'number'
          ? target.paidAmount
          : (target.payments?.reduce((sum, payment) => {
            if ((payment.method || '').toLowerCase() === 'refund') return sum;
            return sum + Math.max(0, payment.amount ?? 0);
          }, 0) ?? 0);
      const derivedOutstanding = Math.max(patientLiability - paidAmount, 0);

      if (storedOutstanding > 0 && storedOutstanding <= patientLiability) {
        return storedOutstanding;
      }
      if (derivedOutstanding > 0) {
        return derivedOutstanding;
      }
      return patientLiability;
    },
    [getPatientLiability]
  );

  // Calculate initial time remaining
  useEffect(() => {
    if (paymentDeadlineParam) {
      const deadline = new Date(paymentDeadlineParam);
      const now = new Date();
      const diff = Math.floor((deadline.getTime() - now.getTime()) / 1000);
      setTimeRemaining(Math.max(0, diff));
      setIsExpired(diff <= 0);
    } else {
      // Default: 10 minutes
      setTimeRemaining(PAYMENT_TIMEOUT_SECONDS);
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

  const resolvePatientIdentifier = useCallback((): string | null => {
    const preferValue = (value?: string | null) =>
      value && value.trim().length > 0 ? value : null;
    try {
      const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
      return (
        preferValue(user?.patientId) ||
        preferValue(cachedUser?.patientId) ||
        preferValue(user?.id) ||
        preferValue(user?.userId) ||
        preferValue(cachedUser?.id) ||
        preferValue(cachedUser?.userId) ||
        null
      );
    } catch {
      return (
        preferValue(user?.patientId) || preferValue(user?.id) || preferValue(user?.userId) || null
      );
    }
  }, [user?.patientId, user?.id, user?.userId]);

  // Poll for payment link if not available
  const pollForPaymentLink = useCallback(async () => {
    // Prevent multiple concurrent calls
    if (isCreatingPaymentLinkRef.current) {
      return;
    }

    if (
      !appointmentId ||
      paymentLink ||
      pollingAttempts >= MAX_PAYMENT_LINK_POLLS
    ) {
      setIsLoadingPaymentLink(false);
      return;
    }

    let targetInvoice: Invoice | undefined;

    try {
      setPollingAttempts((prev) => prev + 1);

      const patientIdentifier = resolvePatientIdentifier();
      if (!patientIdentifier) {
        setIsLoadingPaymentLink(false);
        setIsPolling(false);
        showErrorToast('Không tìm thấy thông tin bệnh nhân. Vui lòng đăng nhập lại.', {
          title: 'Thiếu thông tin bệnh nhân',
          fallbackMessage: 'Không tìm thấy thông tin bệnh nhân. Vui lòng đăng nhập lại.',
          context: 'Patient/PaymentPending:patientLookup',
        });
        return;
      }

      console.log('[PaymentPending] Looking for invoice:', {
        appointmentId,
        patientIdentifier,
        invoiceIdFromUrl: invoiceId,
        pollingAttempt: pollingAttempts,
      });

      // Fetch all patient invoices (simpler, more reliable)
      const invoices = await billingService.getPatientInvoices(patientIdentifier);
      console.log('[PaymentPending] Invoices from patient API:', {
        count: invoices.length,
        invoices: invoices.map(inv => ({
          id: inv.id,
          appointmentId: inv.appointmentId,
          status: inv.status,
        })),
      });

      // Find target invoice with simple logic (like old working version)
      if (invoiceId) {
        targetInvoice = invoices.find((inv) => inv.id === invoiceId);
      }
      if (!targetInvoice && appointmentId) {
        targetInvoice = invoices.find((inv) => inv.appointmentId === appointmentId);
      }
      if (!targetInvoice) {
        // Fallback: find any pending invoice
        targetInvoice = invoices.find((inv) => inv.status === 'pending');
      }

      console.log('[PaymentPending] Selected invoice:', targetInvoice ? {
        id: targetInvoice.id,
        appointmentId: targetInvoice.appointmentId,
        status: targetInvoice.status,
      } : 'none');

      if (!targetInvoice) {
        if (pollingAttempts + 1 >= MAX_PAYMENT_LINK_POLLS) {
          setIsLoadingPaymentLink(false);
          showErrorToast('Không tìm thấy hóa đơn cho lịch hẹn này.', {
            title: 'Không tìm thấy hóa đơn',
            fallbackMessage:
              'Không tìm thấy hóa đơn cho lịch hẹn này. Có thể lịch hẹn đã bị hủy hoặc chưa được tạo.',
            context: `Patient/PaymentPending:invoiceLookup:${appointmentId}`,
            id: 'payment-pending-missing-invoice',
          });
        }
        return;
      }

      setInvoice(targetInvoice);

      // Invoice is ready immediately when found
      // Backend will calculate insurance correctly regardless of sync timing


      if (!invoiceId || invoiceId !== targetInvoice.id) {
        setInvoiceId(targetInvoice.id);
      }

      if (!paymentLink && !isCreatingPaymentLinkRef.current) {
        // Mark as creating to prevent duplicate calls
        isCreatingPaymentLinkRef.current = true;

        try {
          const paymentLinkResponse = await billingService.createPayOSPaymentLink(targetInvoice.id, {
            buyerName: user?.fullName,
            buyerEmail: user?.email,
            buyerPhone: (user as any)?.phone || '',
          });

          setPaymentLink(paymentLinkResponse.checkoutUrl);
          setIsLoadingPaymentLink(false);
          toast.success('Đã tạo link thanh toán!');
        } finally {
          isCreatingPaymentLinkRef.current = false;
        }
      }
    } catch (error) {
      console.error('[PaymentPending] Failed to poll for payment link:', error);
      isCreatingPaymentLinkRef.current = false;

      if (pollingAttempts + 1 >= MAX_PAYMENT_LINK_POLLS) {
        setIsLoadingPaymentLink(false);
        showErrorToast(error, {
          title: 'Không thể tạo link thanh toán',
          fallbackMessage: 'Không thể tạo link thanh toán. Vui lòng thử lại sau.',
          context: `Patient/PaymentPending:createPaymentLink:${targetInvoice?.id || 'unknown'}`,
          id: 'payment-link-error',
        });
      }
    }
  }, [
    appointmentId,
    paymentLink,
    pollingAttempts,
    user?.fullName,
    user?.email,
    invoiceId,
    resolvePatientIdentifier,
  ]);

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
      showErrorToast(error, {
        title: 'Không thể kiểm tra trạng thái thanh toán',
        fallbackMessage: 'Không thể cập nhật trạng thái thanh toán. Vui lòng thử lại.',
        context: `Patient/PaymentPending:pollStatus:${invoiceId}`,
        id: 'payment-status-error',
      });
    }
  }, [invoiceId, isPolling, appointmentId, router]);

  // Initial payment link polling
  useEffect(() => {
    if (isLoadingPaymentLink && pollingAttempts < MAX_PAYMENT_LINK_POLLS) {
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
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-blue-900/5"
        >
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Đặt lịch thành công!
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Vui lòng thanh toán để hoàn tất xác nhận lịch hẹn
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="relative mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 p-8 text-center">
            <div className="absolute top-0 left-0 h-1 w-full bg-gray-200">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: '100%' }}
                animate={{
                  width: `${Math.min(
                    100,
                    ((timeRemaining || 0) / PAYMENT_TIMEOUT_SECONDS) * 100
                  )}%`,
                }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <Clock className={`h-5 w-5 ${getTimeRemainingColor()}`} />
                <span className="text-sm font-medium tracking-wider uppercase">
                  Thời gian thanh toán còn lại
                </span>
              </div>
              <p
                className={`text-5xl font-bold tracking-tight tabular-nums ${getTimeRemainingColor()}`}
              >
                {formatTimeRemaining(timeRemaining)}
              </p>
            </div>

            {timeRemaining !== null && timeRemaining < 5 * 60 && timeRemaining > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600"
              >
                <AlertCircle className="h-4 w-4" />
                Sắp hết thời gian! Vui lòng thanh toán ngay.
              </motion.p>
            )}
            {isExpired && (
              <p className="mt-4 inline-block rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">
                Hết thời gian thanh toán. Lịch hẹn sẽ bị hủy tự động.
              </p>
            )}
          </div>

          {/* Payment Link Section */}
          <div className="mt-8">
            {isLoadingPaymentLink ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-4 font-medium text-gray-900">
                  Đang tạo link thanh toán an toàn...
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Vui lòng không tắt trình duyệt ({pollingAttempts}/{MAX_PAYMENT_LINK_POLLS})
                </p>
              </div>
            ) : paymentLink ? (
              <div className="space-y-4">
                <Button
                  onClick={() => (window.location.href = paymentLink)}
                  className="h-14 w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-lg font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
                  disabled={isExpired}
                >
                  <CreditCard className="mr-2 h-6 w-6" />
                  Thanh toán ngay
                  <ExternalLink className="ml-2 h-5 w-5 opacity-70" />
                </Button>
                <p className="text-center text-sm text-gray-500">
                  Bạn sẽ được chuyển đến cổng thanh toán VNPay an toàn
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-orange-600" />
                <p className="mt-3 font-medium text-gray-900">
                  Không thể tạo link thanh toán tự động
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Vui lòng kiểm tra lại trong danh sách hóa đơn
                </p>
                <Button
                  onClick={() => router.push('/patient/billing')}
                  variant="outline"
                  className="mt-4 border-orange-200 bg-white text-orange-700 hover:bg-orange-100"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Xem danh sách hóa đơn
                </Button>
              </div>
            )}
          </div>

          {/* Invoice Info */}
          {invoice && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider text-gray-900 uppercase">
                  Chi tiết hóa đơn
                </h3>
                <span className="font-mono text-xs text-gray-500">
                  #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
                </span>
              </div>
              <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Phí khám</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(
                      typeof invoice.subtotal === 'number' ? invoice.subtotal : invoice.totalAmount
                    )}{' '}
                    {invoice.currency}
                  </span>
                </div>

                {/* Insurance Coverage */}
                {invoice.insuranceCoverage && invoice.insuranceCoverage > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                      🛡️ Bảo hiểm chi trả
                    </span>
                    <span className="font-semibold text-emerald-600">
                      -{formatCurrency(invoice.insuranceCoverage ?? 0)} {invoice.currency}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="my-2 h-px bg-gray-200" />

                {/* Total to pay */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-600">Người bệnh cần thanh toán</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(getOutstandingAmount(invoice))} {invoice.currency}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-2 text-sm">
                  <span className="text-gray-600">Trạng thái</span>
                  <span
                    className={`rounded-md px-2 py-0.5 font-medium ${invoice.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : invoice.status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
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
          <div className="mt-8 grid grid-cols-2 gap-4">
            <Button
              onClick={() => router.push('/patient/appointments')}
              variant="outline"
              className="h-12 w-full rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Về danh sách lịch
            </Button>
            <Button
              onClick={() => router.push('/patient/billing')}
              variant="ghost"
              className="h-12 w-full rounded-xl hover:bg-gray-100"
            >
              <FileText className="mr-2 h-4 w-4" />
              Lịch sử hóa đơn
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Mọi thắc mắc vui lòng liên hệ hotline 1900-xxxx để được hỗ trợ
          </p>
        </motion.div>
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
