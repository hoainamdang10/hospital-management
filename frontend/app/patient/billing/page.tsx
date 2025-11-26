'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Search,
  AlertCircle,
  ArrowUpRight,
  Wallet,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { DashboardLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBilling } from '@/hooks/useBilling';
import { usePatient } from '@/hooks/usePatient';
import { billingService, type Invoice } from '@/modules/billing/services/billing.service';
import { cn, formatCurrency } from '@/lib/utils';

type SummaryTone = 'primary' | 'warning' | 'success' | 'info';
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
const ITEMS_PER_PAGE = 5;

export default function PatientBillingPage() {
  const { patient } = usePatient();
  const { summary, invoices = [], isLoading, error, reload } = useBilling();

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const resolvedSummary = useMemo(() => {
    const eligibleInvoices = invoices.filter((inv) => inv.status !== 'cancelled');

    const totalsFromInvoices = eligibleInvoices.reduce(
      (acc, inv) => {
        const refundedAmt = getRefundAmount(inv);
        const totalAmt = Math.max(0, (inv.totalAmount ?? 0) - refundedAmt);

        const paidFromPayments =
          inv.payments
            ?.filter((p) => p.method !== 'refund' && (p.status === 'completed' || !p.status))
            .reduce((sum, p) => sum + Math.max(0, p.amount ?? 0), 0) ?? 0;

        const paidFromOutstanding = Math.max(
          0,
          (inv.totalAmount ?? 0) - (inv.outstandingAmount ?? 0)
        );

        const paidBase = paidFromPayments || paidFromOutstanding || inv.paidAmount || 0;
        const netPaid = Math.max(0, paidBase - refundedAmt);

        const outstandingAmt =
          inv.outstandingAmount ?? Math.max(0, (inv.totalAmount ?? 0) - Math.max(0, netPaid));

        acc.totalAmount += totalAmt;
        if (inv.status === 'paid' || inv.status === 'partially_paid') {
          acc.totalPaid += netPaid;
        }
        if (refundedAmt > 0) acc.totalRefunded += refundedAmt;
        if (isPendingStatus(inv.status) || inv.status === 'draft')
          acc.totalOutstanding += outstandingAmt;
        return acc;
      },
      { totalAmount: 0, totalPaid: 0, totalOutstanding: 0, totalRefunded: 0 }
    );

    const totalAmount =
      (eligibleInvoices.length ? totalsFromInvoices.totalAmount : undefined) ??
      summary?.totalAmount ??
      summary?.total ??
      0;

    const totalPaid =
      (eligibleInvoices.length ? totalsFromInvoices.totalPaid : undefined) ??
      summary?.paidAmount ??
      summary?.totalPaid ??
      0;

    const totalOutstanding =
      (eligibleInvoices.length ? totalsFromInvoices.totalOutstanding : undefined) ??
      summary?.outstandingAmount ??
      summary?.totalOutstanding ??
      0;

    const pendingCount =
      eligibleInvoices.length > 0
        ? eligibleInvoices.filter((inv) => isPendingStatus(inv.status) || inv.status === 'draft')
          .length
        : (summary?.pendingInvoiceCount ?? 0);

    const paidCount =
      eligibleInvoices.length > 0
        ? eligibleInvoices.filter((inv) => inv.status === 'paid').length
        : (summary?.paidInvoiceCount ?? 0);

    return {
      totalAmount,
      totalPaid,
      totalOutstanding,
      pendingCount,
      paidCount,
      totalRefunded: totalsFromInvoices.totalRefunded,
    };
  }, [summary, invoices]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return invoices
      .filter((inv) => {
        if (statusFilter === 'all') return inv.status !== 'cancelled';
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

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredInvoices, currentPage]);

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 p-1"
      >
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Thanh toán & Hóa đơn</h1>
            <p className="mt-1 text-gray-500">
              Quản lý tài chính cá nhân và lịch sử giao dịch y tế
            </p>
          </div>
          {patient && (
            <div className="hidden text-right md:block">
              <p className="font-medium text-gray-900">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-sm text-gray-500">ID: {patient.patientId}</p>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-gray-500">Đang tải dữ liệu tài chính...</span>
            </div>
          </div>
        ) : error ? (
          <Card className="border-red-100 bg-red-50/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
              <h3 className="text-lg font-medium text-red-900">Không thể tải dữ liệu</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={reload} variant="outline" className="border-red-200 hover:bg-red-100 text-red-700">
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Tổng chi phí"
                value={resolvedSummary.totalAmount}
                icon={Wallet}
                tone="primary"
                subtext={`${resolvedSummary.pendingCount + resolvedSummary.paidCount} hóa đơn`}
              />
              <SummaryCard
                title="Cần thanh toán"
                value={resolvedSummary.totalOutstanding}
                icon={AlertCircle}
                tone="warning"
                subtext={`${resolvedSummary.pendingCount} hóa đơn chưa trả`}
                highlight
              />
              <SummaryCard
                title="Đã thanh toán"
                value={resolvedSummary.totalPaid}
                icon={CheckCircle}
                tone="success"
                subtext={`${resolvedSummary.paidCount} hóa đơn hoàn tất`}
              />
              <SummaryCard
                title="Đã hoàn tiền"
                value={resolvedSummary.totalRefunded}
                icon={ArrowUpRight}
                tone="info"
                subtext="Tổng tiền được hoàn lại"
              />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Left Column: Filters & List */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Tabs
                    defaultValue="all"
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as StatusFilterValue)}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
                      <TabsTrigger value="all">Tất cả</TabsTrigger>
                      <TabsTrigger value="pending">Chưa trả</TabsTrigger>
                      <TabsTrigger value="paid">Đã trả</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-9 bg-white"
                      placeholder="Tìm kiếm hóa đơn..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredInvoices.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <EmptyState />
                      </motion.div>
                    ) : (
                      <>
                        {paginatedInvoices.map((invoice, index) => (
                          <motion.div
                            key={invoice.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <InvoiceCard
                              invoice={invoice}
                              onPayment={handlePayment}
                              onDownload={handleDownloadInvoice}
                              onViewDetails={setSelectedInvoice}
                              isProcessing={processingPayment === invoice.id}
                              isDownloading={downloadingInvoice === invoice.id}
                              formatDate={formatDate}
                            />
                          </motion.div>
                        ))}
                      </>
                    )}
                  </AnimatePresence>

                  {/* Pagination Controls */}
                  {filteredInvoices.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1 mx-2">
                        <span className="text-sm font-medium text-gray-700">
                          Trang {currentPage} / {totalPages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <InvoiceDetailsDialog
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          formatDate={formatDate}
        />
      </motion.div>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  subtext,
  icon: Icon,
  tone,
  highlight,
}: {
  title: string;
  value: number;
  subtext: string;
  icon: any;
  tone: SummaryTone;
  highlight?: boolean;
}) {
  const styles = {
    primary: 'from-blue-500 to-blue-600 text-white shadow-blue-200',
    warning: 'from-orange-400 to-orange-500 text-white shadow-orange-200',
    success: 'from-emerald-500 to-emerald-600 text-white shadow-emerald-200',
    info: 'from-indigo-400 to-indigo-500 text-white shadow-indigo-200',
  };

  const iconStyles = {
    primary: 'bg-blue-400/20 text-blue-100',
    warning: 'bg-orange-400/20 text-orange-100',
    success: 'bg-emerald-400/20 text-emerald-100',
    info: 'bg-indigo-400/20 text-indigo-100',
  };

  // Modern clean look for non-highlighted cards
  const cleanStyles = {
    primary: 'bg-white border-blue-100 text-blue-900',
    warning: 'bg-white border-orange-100 text-orange-900',
    success: 'bg-white border-emerald-100 text-emerald-900',
    info: 'bg-white border-indigo-100 text-indigo-900',
  };

  const cleanIconStyles = {
    primary: 'bg-blue-50 text-blue-600',
    warning: 'bg-orange-50 text-orange-600',
    success: 'bg-emerald-50 text-emerald-600',
    info: 'bg-indigo-50 text-indigo-600',
  };

  if (highlight) {
    return (
      <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
        <Card className={cn('border-none shadow-lg', `bg-gradient-to-br ${styles[tone]}`)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={cn('rounded-xl p-3 backdrop-blur-sm', iconStyles[tone])}>
                <Icon className="h-6 w-6" />
              </div>
              {tone === 'warning' && value > 0 && (
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">
                  Cần xử lý
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-white/80">{title}</p>
              <h3 className="mt-1 text-3xl font-bold">{formatCurrency(value)}</h3>
              <p className="mt-1 text-sm text-white/70">{subtext}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className={cn('border shadow-sm transition-shadow hover:shadow-md', cleanStyles[tone])}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className={cn('rounded-xl p-3', cleanIconStyles[tone])}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(value)}</h3>
            <p className="mt-1 text-sm text-gray-400">{subtext}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      {/* Status Strip */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1.5',
          isPaid ? 'bg-emerald-500' : isPending ? 'bg-orange-500' : 'bg-gray-300'
        )}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pl-2">
        {/* Left Info */}
        <div className="flex items-start gap-4">
          <div className="hidden rounded-lg bg-gray-50 p-3 md:block">
            <Receipt className="h-6 w-6 text-gray-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{getInvoiceLabel(invoice)}</span>
              <Badge
                variant="secondary"
                className={cn(
                  'capitalize',
                  isPaid
                    ? 'bg-emerald-100 text-emerald-700'
                    : isPending
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                )}
              >
                {badge.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(issuedDate)}
              </span>
              {invoice.doctorName && (
                <span>
                  BS. <span className="font-medium text-gray-700">{invoice.doctorName}</span>
                </span>
              )}
              {invoice.appointmentId && <span>Lịch hẹn: {invoice.appointmentId}</span>}
            </div>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500">Tổng thanh toán</p>
            <p className={cn("text-xl font-bold", isPending ? "text-orange-600" : "text-gray-900")}>
              {formatCurrency(invoice.totalAmount)}
            </p>
            {outstanding > 0 && isPending && (
              <p className="text-xs font-medium text-red-500">
                Còn nợ: {formatCurrency(outstanding)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isPaid && (
              <Button
                onClick={() => onPayment(invoice)}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thanh toán
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload(invoice)}
                disabled={isDownloading}
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                title="Tải hóa đơn"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewDetails(invoice)}
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                title="Xem chi tiết"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
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
  const refundAmount = invoice ? getRefundAmount(invoice) : 0;

  if (!invoice) return null;

  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-hidden p-0 gap-0">
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl">Hóa đơn {getInvoiceLabel(invoice)}</DialogTitle>
            <DialogDescription className="mt-1">
              Được tạo ngày {formatDate(invoice.issueDate ?? invoice.issuedAt)}
            </DialogDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'px-3 py-1 text-sm font-medium',
              invoice.status === 'paid'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-orange-200 bg-orange-50 text-orange-700'
            )}
          >
            {getStatusBadge(invoice.status).label}
          </Badge>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-8">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Thông tin chung</h4>
              <div className="space-y-3">
                <InfoRow label="Mã hóa đơn" value={invoice.invoiceCode || invoice.invoiceNumber} />
                <InfoRow label="Lịch hẹn" value={invoice.appointmentId} />
                <InfoRow label="Bác sĩ" value={invoice.doctorName} />
                <InfoRow label="Khoa" value={invoice.doctorDepartment} />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Thanh toán</h4>
              <div className="space-y-3">
                <InfoRow label="Hạn thanh toán" value={formatDate(invoice.dueDate)} />
                <InfoRow label="Ngày cập nhật" value={formatDate(invoice.updatedAt)} />
                <InfoRow label="Phương thức" value={invoice.paymentMethod || 'Chưa có'} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Chi tiết dịch vụ</h4>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Dịch vụ</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">SL</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items?.length ? (
                    invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        Không có chi tiết dịch vụ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng tiền hàng</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Thuế (VAT)</span>
                <span className="font-medium">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bảo hiểm chi trả</span>
                <span className="font-medium text-emerald-600">-{formatCurrency(invoice.insuranceCoverage)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Tổng thanh toán</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              {invoice.outstandingAmount !== undefined && invoice.outstandingAmount > 0 && (
                <div className="flex justify-between text-sm font-medium text-red-600">
                  <span>Còn lại phải trả</span>
                  <span>{formatCurrency(invoice.outstandingAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Lịch sử giao dịch</h4>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "rounded-full p-2",
                        payment.method === 'refund' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {payment.method === 'refund' ? <ArrowUpRight className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payment.method === 'refund' ? 'Hoàn tiền' : 'Thanh toán thành công'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(payment.processedAt || payment.paidAt)} • {payment.method}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-semibold",
                      payment.method === 'refund' ? "text-blue-600" : "text-emerald-600"
                    )}>
                      {payment.method === 'refund' ? '-' : '+'}{formatCurrency(Math.abs(payment.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-16 text-center">
      <div className="rounded-full bg-gray-100 p-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Chưa có hóa đơn nào</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Hiện tại bạn không có hóa đơn nào phù hợp với bộ lọc. Hãy thử thay đổi điều kiện tìm kiếm.
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
      return { label: 'Thanh toán 1 phần', tone: 'primary' as const };
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

function getRefundAmount(invoice: Invoice): number {
  if (!invoice?.payments?.length) return 0;
  return invoice.payments
    .filter((p) => p.method === 'refund' || p.amount < 0)
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);
}
