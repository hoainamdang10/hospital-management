'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  FileText,
  Filter,
  Loader2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useBilling } from '@/hooks/useBilling';
import { usePatient } from '@/hooks/usePatient';
import { billingService, type Invoice } from '@/modules/billing/services/billing.service';
import { cn, formatCurrency } from '@/lib/utils';

type SummaryTone = 'primary' | 'warning' | 'success';
type StatusFilterValue = 'all' | 'pending' | 'paid' | 'overdue' | 'refunded' | 'cancelled';

const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chưa thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'overdue', label: 'Quá hạn' },
  { value: 'refunded', label: 'Hoàn tiền' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const PENDING_STATUSES: Invoice['status'][] = ['pending', 'partially_paid', 'overdue', 'draft'];

export default function PatientBillingPage() {
  const { patient } = usePatient();
  const { summary, invoices = [], isLoading, error, reload } = useBilling();

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const resolvedSummary = useMemo(() => {
    const totalsFromInvoices = invoices.reduce(
      (acc, inv) => {
        const totalAmt = inv.totalAmount ?? 0;
        const paidAmt = inv.status === 'paid' ? ((totalAmt || inv.paidAmount) ?? 0) : 0;
        const outstandingAmt =
          inv.outstandingAmount ?? Math.max(0, (inv.totalAmount ?? 0) - (inv.paidAmount ?? 0));

        acc.totalAmount += totalAmt;
        if (inv.status === 'paid') acc.totalPaid += totalAmt || paidAmt;
        if (isPendingStatus(inv.status) || inv.status === 'draft')
          acc.totalOutstanding += outstandingAmt;
        return acc;
      },
      { totalAmount: 0, totalPaid: 0, totalOutstanding: 0 }
    );

    const totalAmount =
      (invoices.length ? totalsFromInvoices.totalAmount : undefined) ??
      summary?.totalAmount ??
      summary?.total ??
      0;

    const totalPaid =
      (invoices.length ? totalsFromInvoices.totalPaid : undefined) ??
      summary?.paidAmount ??
      summary?.totalPaid ??
      0;

    const totalOutstanding =
      (invoices.length ? totalsFromInvoices.totalOutstanding : undefined) ??
      summary?.outstandingAmount ??
      summary?.totalOutstanding ??
      0;

    const pendingCount =
      invoices.length > 0
        ? invoices.filter((inv) => isPendingStatus(inv.status) || inv.status === 'draft').length
        : (summary?.pendingInvoiceCount ?? 0);

    const paidCount =
      invoices.length > 0
        ? invoices.filter((inv) => inv.status === 'paid').length
        : (summary?.paidInvoiceCount ?? 0);

    return { totalAmount, totalPaid, totalOutstanding, pendingCount, paidCount };
  }, [summary, invoices]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return invoices
      .filter((inv) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending')
          return isPendingStatus(inv.status) || inv.status === 'draft';
        return inv.status === statusFilter;
      })
      .filter((inv) => {
        if (!normalizedSearch) return true;
        const target = `${getInvoiceLabel(inv)} ${inv.appointmentId ?? ''}`.toLowerCase();
        return target.includes(normalizedSearch);
      })
      .sort(
        (a, b) =>
          getSortDate(b) - getSortDate(a) ||
          (b.invoiceNumber ?? '').localeCompare(a.invoiceNumber ?? '')
      );
  }, [invoices, statusFilter, searchTerm]);

  const handlePayment = async (invoice: Invoice) => {
    if (!patient) {
      toast.error('Không tìm thấy thông tin bệnh nhân');
      return;
    }

    try {
      setProcessingPayment(invoice.id);
      toast.loading('Đang tạo link thanh toán...', { id: 'payment-loading' });

      const buyerName =
        [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Bệnh nhân';
      const paymentLink = await billingService.createPayOSPaymentLink(invoice.id, {
        buyerName,
        buyerEmail: patient.email || '',
        buyerPhone: patient.phoneNumber || '',
      });

      toast.dismiss('payment-loading');
      toast.success('Đã tạo link thanh toán!');
      window.location.href = paymentLink.checkoutUrl;
    } catch (err: any) {
      console.error('[Payment] Failed to create payment link:', err);
      toast.dismiss('payment-loading');
      toast.error(err?.message || 'Không thể tạo link thanh toán');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      setDownloadingInvoice(invoice.id);
      const blob = await billingService.downloadInvoice(invoice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getInvoiceLabel(invoice) || invoice.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('[Billing] Failed to download invoice:', err);
      toast.error(err?.message || 'Không thể tải hóa đơn');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Không rõ ngày';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
          <p className="text-gray-600">Quản lý hóa đơn, số dư và thanh toán trực tuyến</p>
          {patient && (
            <p className="text-sm text-gray-500">
              {patient.firstName} {patient.lastName} • Mã bệnh nhân: {patient.patientId}
            </p>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center rounded-lg border bg-white py-12 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}

        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-700">Không tải được dữ liệu</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <CardDescription className="text-red-700">{error}</CardDescription>
              <Button onClick={reload} variant="outline" size="sm">
                Thử lại
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                title="Tổng chi phí"
                value={resolvedSummary.totalAmount}
                icon={CreditCard}
                tone="primary"
                desc={`${resolvedSummary.pendingCount + resolvedSummary.paidCount} hóa đơn`}
              />
              <SummaryCard
                title="Chưa thanh toán"
                value={resolvedSummary.totalOutstanding}
                icon={Clock}
                tone="warning"
                desc={`${resolvedSummary.pendingCount} hóa đơn cần xử lý`}
              />
              <SummaryCard
                title="Đã thanh toán"
                value={resolvedSummary.totalPaid}
                icon={CheckCircle}
                tone="success"
                desc={`${resolvedSummary.paidCount} hóa đơn hoàn tất`}
              />
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Hóa đơn của bạn</CardTitle>
                  <CardDescription>Tra cứu, lọc và thanh toán hóa đơn y tế</CardDescription>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="Tìm mã hóa đơn hoặc mã lịch hẹn..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {STATUS_FILTERS.map((filter) => (
                      <Button
                        key={filter.value}
                        variant={statusFilter === filter.value ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={() => setStatusFilter(filter.value)}
                      >
                        {filter.value === 'pending' && <Clock className="h-4 w-4" />}
                        {filter.value === 'paid' && <CheckCircle className="h-4 w-4" />}
                        {filter.value === 'all' && <Filter className="h-4 w-4" />}
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredInvoices.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-3">
                    {filteredInvoices.map((invoice) => (
                      <InvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onPayment={handlePayment}
                        onDownload={handleDownloadInvoice}
                        onViewDetails={setSelectedInvoice}
                        isProcessing={processingPayment === invoice.id}
                        isDownloading={downloadingInvoice === invoice.id}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <InvoiceDetailsDialog
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          formatDate={formatDate}
        />
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  desc,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  desc: string;
  icon: typeof CreditCard;
  tone: SummaryTone;
}) {
  const styles: Record<SummaryTone, { bg: string; text: string }> = {
    primary: { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700' },
    warning: { bg: 'bg-orange-50 text-orange-700', text: 'text-orange-700' },
    success: { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700' },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </div>
        <div className={cn('rounded-full p-3', styles[tone].bg)}>
          <Icon className={cn('h-6 w-6', styles[tone].text)} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-gray-900">{formatCurrency(value)}</p>
      </CardContent>
    </Card>
  );
}

function InvoiceCard({
  invoice,
  onPayment,
  onDownload,
  onViewDetails,
  isProcessing,
  isDownloading,
  formatDate,
}: {
  invoice: Invoice;
  onPayment: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onViewDetails: (invoice: Invoice) => void;
  isProcessing: boolean;
  isDownloading: boolean;
  formatDate: (value?: string) => string;
}) {
  const isPaid = invoice.status === 'paid';
  const isPending = isPendingStatus(invoice.status);
  const badge = getStatusBadge(invoice.status);
  const patientShare = Math.max(0, (invoice.totalAmount ?? 0) - (invoice.insuranceCoverage ?? 0));
  const outstanding = invoice.outstandingAmount ?? patientShare;
  const issuedDate = invoice.issueDate ?? invoice.issuedAt ?? invoice.createdAt;
  const dueDate = invoice.dueDate;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-full p-3',
            isPaid
              ? 'bg-emerald-50 text-emerald-600'
              : isPending
                ? 'bg-orange-50 text-orange-600'
                : 'bg-gray-50 text-gray-600'
          )}
        >
          {isPaid ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-gray-900">{getInvoiceLabel(invoice)}</p>
            <Badge variant="secondary" className="capitalize">
              {badge.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Ngày phát hành: {formatDate(issuedDate)}
            {dueDate && ` • Hạn thanh toán: ${formatDate(dueDate)}`}
          </p>
          {invoice.appointmentId && (
            <p className="text-xs text-gray-500">Mã lịch hẹn: {invoice.appointmentId}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span>Tổng: {formatCurrency(invoice.totalAmount)}</span>
            <span>• Bảo hiểm: {formatCurrency(invoice.insuranceCoverage ?? 0)}</span>
            <span>• Bệnh nhân trả: {formatCurrency(patientShare)}</span>
            {outstanding > 0 && <span>• Còn lại: {formatCurrency(outstanding)}</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownload(invoice)}
          disabled={isDownloading}
          className="gap-2"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Tải
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => onViewDetails(invoice)}
        >
          <FileText className="h-4 w-4" />
          Chi tiết
        </Button>
      </div>
    </div>
  );
}

function InvoiceDetailsDialog({
  invoice,
  onClose,
  formatDate,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  formatDate: (value?: string) => string;
}) {
  const patientShare = invoice
    ? Math.max(0, (invoice.totalAmount ?? 0) - (invoice.insuranceCoverage ?? 0))
    : 0;

  if (!invoice) return null;

  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết hóa đơn {getInvoiceLabel(invoice)}</DialogTitle>
          <DialogDescription>Xem thông tin chi tiết và lịch sử thanh toán</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {getStatusBadge(invoice.status).label}
            </Badge>
            {invoice.appointmentId && (
              <Badge variant="outline">Lịch hẹn: {invoice.appointmentId}</Badge>
            )}
            {invoice.invoiceCode && (
              <Badge variant="outline">Số hóa đơn: {invoice.invoiceCode}</Badge>
            )}
          </div>
          <div className="grid gap-3 rounded-lg border bg-gray-50 p-4 md:grid-cols-2">
            <InfoRow label="Phát hành" value={formatDate(invoice.issueDate ?? invoice.issuedAt)} />
            <InfoRow label="Hạn thanh toán" value={formatDate(invoice.dueDate)} />
            <InfoRow label="Trạng thái" value={getStatusBadge(invoice.status).label} />
            <InfoRow label="Cập nhật" value={formatDate(invoice.updatedAt)} />
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">Tổng cộng</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(invoice.totalAmount)}
              </p>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <InfoRow label="Tiền hàng" value={formatCurrency(invoice.subtotal)} />
              <InfoRow label="VAT" value={formatCurrency(invoice.tax)} />
              <InfoRow label="Bảo hiểm chi trả" value={formatCurrency(invoice.insuranceCoverage)} />
              <InfoRow label="Bệnh nhân trả" value={formatCurrency(patientShare)} />
              <InfoRow
                label="Còn lại"
                value={formatCurrency(invoice.outstandingAmount ?? patientShare)}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-gray-900">Dòng dịch vụ</p>
              <Badge variant="outline">{invoice.items?.length || 0} mục</Badge>
            </div>
            {invoice.items?.length ? (
              <div className="space-y-2">
                {invoice.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm text-gray-700"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{item.description}</span>
                      <span className="text-gray-500">
                        Số lượng {item.quantity} × {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Không có chi tiết dịch vụ.</p>
            )}
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-gray-900">Lịch sử thanh toán</p>
                <Badge variant="outline">{invoice.payments.length} giao dịch</Badge>
              </div>
              <div className="space-y-3">
                {invoice.payments.map((payment) => {
                  const isRefund = payment.method === 'refund' || payment.amount < 0;
                  const displayAmount = Math.abs(payment.amount);

                  return (
                    <div
                      key={payment.id}
                      className={cn(
                        "rounded-lg border p-3",
                        isRefund ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-semibold",
                              isRefund ? "text-blue-700" : "text-gray-900"
                            )}>
                              {isRefund ? '🔄 Hoàn tiền' : '💳 Thanh toán'}
                            </span>
                            <Badge variant={isRefund ? "default" : "secondary"} className="text-xs">
                              {payment.status === 'refund_pending' ? 'Đang xử lý' :
                               payment.status === 'refund_completed' ? 'Hoàn tất' :
                               payment.status === 'completed' ? 'Thành công' : payment.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            Phương thức: {payment.method === 'refund' ? 'Hoàn tiền' :
                                         payment.method === 'vnpay' ? 'VNPAY' :
                                         payment.method === 'payos' ? 'PayOS' : payment.method}
                          </p>
                          {payment.transactionId && (
                            <p className="text-xs text-gray-500">
                              Mã GD: {payment.transactionId}
                            </p>
                          )}
                          {isRefund && payment.refundReason && (
                            <p className="text-xs text-gray-600">
                              Lý do: {payment.refundReason}
                            </p>
                          )}
                          {isRefund && payment.refundedBy && (
                            <p className="text-xs text-gray-500">
                              Người xử lý: {payment.refundedBy}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {isRefund && payment.refundedAt
                              ? `Hoàn tiền: ${formatDate(payment.refundedAt)}`
                              : payment.paidAt
                              ? `Thanh toán: ${formatDate(payment.paidAt)}`
                              : `Tạo: ${formatDate(payment.processedAt)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-lg font-semibold",
                            isRefund ? "text-blue-700" : "text-emerald-700"
                          )}>
                            {isRefund ? '-' : '+'}{formatCurrency(displayAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value ?? '-'}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Clock className="h-8 w-8 text-gray-400" />
      <p className="mt-2 text-lg font-semibold text-gray-900">Không có hóa đơn phù hợp</p>
      <p className="text-sm text-gray-600">
        Thử đổi bộ lọc hoặc kiểm tra lại mã hóa đơn / mã lịch hẹn.
      </p>
    </div>
  );
}

function getInvoiceLabel(invoice: Invoice) {
  return invoice.invoiceNumber || invoice.invoiceCode || invoice.id;
}

function isPendingStatus(status: Invoice['status']) {
  return PENDING_STATUSES.includes(status);
}

function getStatusBadge(status: Invoice['status']) {
  switch (status) {
    case 'paid':
      return { label: 'Đã thanh toán', tone: 'success' as const };
    case 'partially_paid':
      return { label: 'Thanh toán một phần', tone: 'primary' as const };
    case 'overdue':
      return { label: 'Quá hạn', tone: 'danger' as const };
    case 'refunded':
      return { label: 'Đã hoàn tiền', tone: 'primary' as const };
    case 'cancelled':
      return { label: 'Đã hủy', tone: 'muted' as const };
    case 'pending':
    case 'draft':
    default:
      return { label: 'Chưa thanh toán', tone: 'warning' as const };
  }
}

function getSortDate(invoice: Invoice) {
  const dateValue =
    invoice.issueDate || invoice.issuedAt || invoice.createdAt || invoice.updatedAt || '';
  return dateValue ? new Date(dateValue).getTime() : 0;
}
