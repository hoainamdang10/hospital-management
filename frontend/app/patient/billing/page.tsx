'use client';

import { useState } from 'react';
import { CreditCard, Download, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { useBilling } from '@/hooks/useBilling';
import { usePatient } from '@/hooks/usePatient';
import { billingService, type Invoice } from '@/modules/billing/services/billing.service';
import { toast } from 'sonner';

/**
 * Patient Billing Page
 * Route: /patient/billing
 */
export default function PatientBillingPage() {
  const { patient } = usePatient();
  const { summary, pendingInvoices, paidInvoices, isLoading, error, reload } = useBilling();
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  // Handle PayOS payment
  const handlePayment = async (invoice: Invoice) => {
    if (!patient) {
      toast.error('Không tìm thấy thông tin bệnh nhân');
      return;
    }

    try {
      setProcessingPayment(invoice.id);
      toast.loading('Đang tạo link thanh toán...', { id: 'payment-loading' });

      // Create PayOS payment link
      const paymentLink = await billingService.createPayOSPaymentLink(invoice.id, {
        name: patient.fullName || 'Bệnh nhân',
        email: patient.email || '',
        phone: patient.phoneNumber || '',
      });

      toast.dismiss('payment-loading');
      toast.success('Đã tạo link thanh toán!');

      // Redirect to PayOS checkout
      window.location.href = paymentLink.checkoutUrl;
    } catch (err: any) {
      console.error('[Payment] Failed to create payment link:', err);
      toast.dismiss('payment-loading');
      toast.error(err.message || 'Không thể tạo link thanh toán');
    } finally {
      setProcessingPayment(null);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
          <p className="mt-2 text-gray-600">Quản lý hóa đơn và thanh toán</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="ml-3 text-red-800">{error}</p>
            </div>
            <Button onClick={reload} variant="outline" className="mt-4">
              Thử lại
            </Button>
          </div>
        )}

        {/* Summary */}
        {!isLoading && !error && summary && (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <SummaryCard
                title="Tổng chi phí"
                value={`${formatCurrency(summary.totalAmount)} VNĐ`}
                icon={CreditCard}
                color="blue"
              />
              <SummaryCard
                title="Chưa thanh toán"
                value={`${formatCurrency(summary.totalOutstanding)} VNĐ`}
                icon={Clock}
                color="orange"
              />
              <SummaryCard
                title="Đã thanh toán"
                value={`${formatCurrency(summary.totalPaid)} VNĐ`}
                icon={CheckCircle}
                color="green"
              />
            </div>

            {/* Pending Invoices */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Hóa đơn chưa thanh toán ({pendingInvoices.length})
              </h2>
              {pendingInvoices.length === 0 ? (
                <p className="text-gray-500">Không có hóa đơn chưa thanh toán</p>
              ) : (
                <div className="space-y-4">
                  {pendingInvoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      onPayment={handlePayment}
                      isProcessing={processingPayment === invoice.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Paid Invoices */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Lịch sử thanh toán ({paidInvoices.length})
              </h2>
              {paidInvoices.length === 0 ? (
                <p className="text-gray-500">Chưa có lịch sử thanh toán</p>
              ) : (
                <div className="space-y-4">
                  {paidInvoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      onPayment={handlePayment}
                      isProcessing={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
  }[color];

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({
  invoice,
  formatCurrency,
  formatDate,
  onPayment,
  isProcessing,
}: {
  invoice: Invoice;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  onPayment: (invoice: Invoice) => void;
  isProcessing: boolean;
}) {
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';

  // Get status badge
  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'paid':
        return <span className="text-xs font-medium text-green-600">Đã thanh toán</span>;
      case 'pending':
        return <span className="text-xs font-medium text-orange-600">Chưa thanh toán</span>;
      case 'partially_paid':
        return <span className="text-xs font-medium text-blue-600">Thanh toán một phần</span>;
      case 'overdue':
        return <span className="text-xs font-medium text-red-600">Quá hạn</span>;
      default:
        return <span className="text-xs font-medium text-gray-600">{invoice.status}</span>;
    }
  };

  // Get description from items
  const getDescription = () => {
    if (invoice.items && invoice.items.length > 0) {
      return invoice.items.map((item) => item.description).join(', ');
    }
    return 'Hóa đơn y tế';
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center space-x-4">
        <div
          className={`rounded-full p-3 ${
            isPaid ? 'bg-green-100' : isOverdue ? 'bg-red-100' : 'bg-orange-100'
          }`}
        >
          {isPaid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Clock className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
          <p className="text-sm text-gray-600">{getDescription()}</p>
          <p className="text-xs text-gray-500">
            Ngày: {formatDate(invoice.issueDate)}
            {invoice.dueDate && ` • Hạn: ${formatDate(invoice.dueDate)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.totalAmount)} VNĐ</p>
          {invoice.status === 'partially_paid' && invoice.paidAmount && (
            <p className="text-xs text-gray-500">
              Đã trả: {formatCurrency(invoice.paidAmount)} VNĐ
            </p>
          )}
          {getStatusBadge()}
        </div>
        <div className="flex space-x-2">
          {!isPaid && (
            <Button size="sm" onClick={() => onPayment(invoice)} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Thanh toán'
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" title="Tải hóa đơn">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
