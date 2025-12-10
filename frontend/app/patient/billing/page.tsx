'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  CreditCard,
  Download,
  FileText,
  Clock,
  Tag,
  Hash,
  Loader2,
  Search,
  AlertCircle,
  ArrowUpRight,
  Wallet,
  Receipt,
  Calendar,
  Stethoscope,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PlusCircle,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { DashboardLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useBilling } from '@/hooks/useBilling';
import { usePatient } from '@/hooks/usePatient';
import { useWallet } from '@/hooks/useWallet';
import { billingService, type Invoice } from '@/modules/billing/services/billing.service';
import {
  walletService,
  type WalletAccount,
  type WalletTransaction,
} from '@/modules/billing/services/wallet.service';
import { cn, formatCurrency } from '@/lib/utils';
import { showErrorToast } from '@/lib/utils/error-toast';
import { SmartSuggestions } from '@/components/ChatBot/SmartSuggestions';
import ChatBot, { type ChatBotHandle } from '@/components/ChatBot';

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
const NON_PAYABLE_STATUSES: Invoice['status'][] = ['cancelled', 'refunded', 'expired'];
const ITEMS_PER_PAGE = 5;

const APPOINTMENT_DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const APPOINTMENT_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

export default function PatientBillingPage() {
  const { patient } = usePatient();
  const canonicalPatientId = patient?.id || patient?.patientId || null;
  const { summary, invoices = [], isLoading, error, reload } = useBilling(canonicalPatientId);

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [walletPayingInvoice, setWalletPayingInvoice] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDescription, setTopUpDescription] = useState('');
  const [isCreatingTopUpLink, setIsCreatingTopUpLink] = useState(false);

  // ChatBot ref for SmartSuggestions integration
  const chatBotRef = useRef<ChatBotHandle>(null);

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Ưu tiên dùng patient UUID cho các API nội bộ; fallback sang mã PAT nếu thiếu
  const walletPatientId = patient?.id || patient?.patientId || null;
  const {
    account: walletAccount,
    transactions: walletTransactions,
    isLoading: isWalletLoading,
    error: walletError,
    reload: reloadWallet,
  } = useWallet(walletPatientId);
  const walletBalance = walletAccount?.balance ?? 0;
  const canWalletCoverInvoice = (invoice: Invoice) => {
    if (!walletAccount) return false;
    const outstanding = getOutstandingAmount(invoice);
    return outstanding > 0 && walletBalance >= outstanding;
  };

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
    return filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const handlePayment = async (invoice: Invoice) => {
    if (!patient) {
      toast.error('Không tìm thấy thông tin bệnh nhân');
      return;
    }

    if (hasInvoiceExpired(invoice, currentTime)) {
      toast.error('Hóa đơn này đã hết hạn thanh toán, vui lòng đặt lịch mới');
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
      showErrorToast(err, {
        title: 'Không thể tạo link thanh toán',
        fallbackMessage: 'Không thể tạo link thanh toán. Vui lòng thử lại sau.',
        context: `Patient/Billing:createPaymentLink:${invoice.id}`,
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleWalletPayment = async (invoice: Invoice) => {
    if (!walletPatientId || !walletAccount) {
      toast.error('Ví chưa sẵn sàng, vui lòng thử lại sau');
      return;
    }

    if (hasInvoiceExpired(invoice, currentTime)) {
      toast.error('Hóa đơn này đã hết hạn thanh toán');
      return;
    }

    const outstanding = getOutstandingAmount(invoice);
    if (outstanding <= 0) {
      toast.success('Hóa đơn này đã thanh toán xong');
      return;
    }

    if (walletBalance < outstanding) {
      toast.error('Số dư ví không đủ để thanh toán hóa đơn này');
      return;
    }

    const toastId = `wallet-pay-${invoice.id}`;

    try {
      setWalletPayingInvoice(invoice.id);
      toast.loading('Đang thanh toán bằng ví...', { id: toastId });
      const result = await billingService.payInvoiceWithWallet(invoice.id, {
        description: `Thanh toán hóa đơn ${getInvoiceLabel(invoice)} bằng ví`,
      });

      if (!result.success) {
        throw new Error(result.message || 'Thanh toán bằng ví thất bại');
      }

      toast.dismiss(toastId);
      toast.success('Đã thanh toán bằng ví');
      await Promise.all([reload(), reloadWallet()]);
    } catch (err: any) {
      toast.dismiss(toastId);
      showErrorToast(err, {
        title: 'Không thể thanh toán bằng ví',
        fallbackMessage:
          'Không thể thanh toán bằng ví. Vui lòng thử lại hoặc chọn phương thức khác.',
        context: `Patient/Billing:walletPayment:${invoice.id}`,
      });
    } finally {
      setWalletPayingInvoice(null);
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
      showErrorToast(err, {
        title: 'Không thể tải hóa đơn',
        fallbackMessage: 'Không thể tải hóa đơn. Vui lòng thử lại.',
        context: `Patient/Billing:downloadInvoice:${invoice.id}`,
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleCreateWalletTopUp = async () => {
    if (!walletPatientId) {
      toast.error('Không thể xác định bệnh nhân để nạp ví');
      return;
    }

    const numericAmount = Number(topUpAmount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Số tiền nạp phải lớn hơn 0');
      return;
    }

    try {
      setIsCreatingTopUpLink(true);
      toast.loading('Đang tạo link nạp ví...', { id: 'wallet-topup' });
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await walletService.createTopUpLink(walletPatientId, {
        amount: numericAmount,
        description: topUpDescription || undefined,
        returnUrl: baseUrl ? `${baseUrl}/patient/billing?wallet=success` : undefined,
        cancelUrl: baseUrl ? `${baseUrl}/patient/billing?wallet=cancelled` : undefined,
      });
      toast.dismiss('wallet-topup');
      toast.success('Đã tạo link thanh toán ví');
      setIsTopUpDialogOpen(false);
      setTopUpAmount('');
      setTopUpDescription('');
      if (typeof window !== 'undefined') {
        window.location.href = response.checkoutUrl;
      }
    } catch (err: any) {
      console.error('[Wallet] Failed to create top-up link:', err);
      toast.dismiss('wallet-topup');
      showErrorToast(err, {
        title: 'Không thể tạo link nạp ví',
        fallbackMessage: 'Không thể tạo link nạp ví. Vui lòng thử lại.',
        context: 'Patient/Billing:walletTopUp',
      });
    } finally {
      setIsCreatingTopUpLink(false);
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
        {walletPatientId && (
          <WalletSection
            account={walletAccount}
            transactions={walletTransactions}
            isLoading={isWalletLoading}
            error={walletError}
            onReload={reloadWallet}
            onTopUp={() => setIsTopUpDialogOpen(true)}
          />
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="text-slate-500">Đang tải dữ liệu tài chính...</span>
            </div>
          </div>
        ) : error ? (
          <Card className="rounded-2xl border-red-100 bg-red-50/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-red-500" />
              <h3 className="text-lg font-medium text-red-900">Không thể tải dữ liệu</h3>
              <p className="mb-4 text-red-600">{error}</p>
              <Button
                onClick={reload}
                variant="outline"
                className="rounded-xl border-red-200 text-red-700 hover:bg-red-100"
              >
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-4 md:gap-8">
              <StatItem
                label="Tổng chi phí"
                value={resolvedSummary.totalAmount}
                icon={Wallet}
                color="text-teal-600"
                bg="bg-teal-50"
              />
              <div className="hidden w-px bg-slate-100 md:block" />
              <StatItem
                label="Cần thanh toán"
                value={resolvedSummary.totalOutstanding}
                icon={AlertCircle}
                color="text-amber-600"
                bg="bg-amber-50"
                highlight={resolvedSummary.totalOutstanding > 0}
              />
              <div className="hidden w-px bg-slate-100 md:block" />
              <StatItem
                label="Đã thanh toán"
                value={resolvedSummary.totalPaid}
                icon={CheckCircle}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <div className="hidden w-px bg-slate-100 md:block" />
              <StatItem
                label="Đã hoàn tiền"
                value={resolvedSummary.totalRefunded}
                icon={ArrowUpRight}
                color="text-cyan-600"
                bg="bg-cyan-50"
              />
            </div>

            {/* Invoices Section */}
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Tabs
                  defaultValue="all"
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilterValue)}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 p-1 sm:inline-flex sm:w-auto">
                    <TabsTrigger
                      value="all"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
                    >
                      Tất cả
                    </TabsTrigger>
                    <TabsTrigger
                      value="pending"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
                    >
                      Chưa trả
                    </TabsTrigger>
                    <TabsTrigger
                      value="paid"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
                    >
                      Đã trả
                    </TabsTrigger>
                    <TabsTrigger
                      value="refunded"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
                    >
                      Hoàn tiền
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="rounded-xl border-slate-200 bg-white pl-9 focus-visible:ring-emerald-500"
                    placeholder="Tìm kiếm hóa đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Card className="overflow-hidden rounded-xl border-slate-100 shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="w-[180px]">Mã hóa đơn</TableHead>
                        <TableHead className="min-w-[200px]">Dịch vụ</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead className="w-[140px] text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-64 text-center">
                              <EmptyState />
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedInvoices.map((invoice, index) => (
                            <InvoiceRow
                              key={invoice.id}
                              invoice={invoice}
                              index={index}
                              currentTime={currentTime}
                              onPayment={handlePayment}
                              onWalletPayment={handleWalletPayment}
                              canPayWithWallet={canWalletCoverInvoice(invoice)}
                              onDownload={handleDownloadInvoice}
                              onViewDetails={setSelectedInvoice}
                              isProcessing={processingPayment === invoice.id}
                              isWalletProcessing={walletPayingInvoice === invoice.id}
                              isDownloading={downloadingInvoice === invoice.id}
                              formatDate={formatDate}
                            />
                          ))
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Pagination Controls */}
              {filteredInvoices.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="mx-2 flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-700">
                      Trang {currentPage} / {totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        <InvoiceDetailsDialog
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          formatDate={formatDate}
          currentTime={currentTime}
        />
        {walletPatientId && (
          <WalletTopUpDialog
            open={isTopUpDialogOpen}
            onOpenChange={(open) => {
              setIsTopUpDialogOpen(open);
              if (!open) {
                setTopUpAmount('');
                setTopUpDescription('');
              }
            }}
            amount={topUpAmount}
            onAmountChange={setTopUpAmount}
            description={topUpDescription}
            onDescriptionChange={setTopUpDescription}
            onSubmit={handleCreateWalletTopUp}
            isSubmitting={isCreatingTopUpLink}
            currency={walletAccount?.currency || 'VND'}
          />
        )}

        {/* Smart Suggestions - AI Powered */}
        <SmartSuggestions
          pagePath="/patient/billing"
          contextData={{
            unpaidCount: resolvedSummary.pendingCount,
            paidCount: resolvedSummary.paidCount,
            totalOutstanding: resolvedSummary.totalOutstanding,
            walletBalance,
            totalInvoices: invoices.length,
          }}
          onOpenChat={(message: string) => {
            chatBotRef.current?.openWithMessage(message);
          }}
          onCallFunction={(functionName: string) => {
            if (functionName === 'payFirstUnpaid') {
              const firstUnpaid = invoices.find(
                (inv) => isPendingStatus(inv.status) && getOutstandingAmount(inv) > 0
              );
              if (firstUnpaid) {
                handlePayment(firstUnpaid);
              } else {
                toast.info('Không có hóa đơn nào cần thanh toán');
              }
            }
          }}
          title="AI hỗ trợ thanh toán"
        />
      </motion.div>

      {/* ChatBot with Billing Context */}
      <ChatBot
        ref={chatBotRef}
        context={{
          page: '/patient/billing',
          data: {
            totalAmount: resolvedSummary.totalAmount,
            totalPaid: resolvedSummary.totalPaid,
            totalOutstanding: resolvedSummary.totalOutstanding,
            pendingInvoiceCount: resolvedSummary.pendingCount,
            paidInvoiceCount: resolvedSummary.paidCount,
            walletBalance,
            patientId: canonicalPatientId || '',
          },
        }}
      />
    </DashboardLayout>
  );
}

function WalletSection({
  account,
  transactions,
  isLoading,
  error,
  onReload,
  onTopUp,
}: {
  account: WalletAccount | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
  onReload: () => void;
  onTopUp: () => void;
}) {
  const balance = account?.balance ?? 0;
  const statusLabel = account?.status === 'frozen' ? 'Đang khóa' : 'Đang hoạt động';
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Wallet Card (Credit Card Style) */}
      <div className="lg:col-span-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-xl">
          {/* Background Pattern */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />

          {/* Shine Effect */}
          <motion.div
            className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'linear',
              repeatDelay: 2,
            }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Số dư khả dụng</p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-32 bg-white/20" />
                ) : (
                  <h3 className="mt-1 text-3xl font-bold tracking-tight">
                    {formatCurrency(balance)}
                  </h3>
                )}
              </div>
              <div className="rounded-lg bg-white/20 p-2 backdrop-blur-md">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    account?.status === 'frozen' ? 'bg-red-400' : 'bg-emerald-400'
                  )}
                />
                {statusLabel}
              </div>

              <Button
                onClick={onTopUp}
                className="w-full border-none bg-white font-semibold text-emerald-700 shadow-lg shadow-emerald-900/20 hover:bg-emerald-50"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nạp tiền vào ví
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            <p>{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-8 px-2 text-red-600 hover:bg-red-100"
              onClick={onReload}
            >
              Thử lại
            </Button>
          </div>
        )}
      </div>

      {/* Right: Recent Transactions (List) */}
      <Card className="rounded-2xl border-slate-100 bg-white/80 shadow-sm backdrop-blur-sm lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between border-b-0 px-6 py-4 pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Giao dịch gần đây
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReload}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600"
          >
            <RefreshCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))
            ) : recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-500">
                <Receipt className="h-8 w-8 text-gray-300" />
                <span>Chưa có giao dịch ví nào</span>
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const meta = getTransactionMeta(tx.type);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-gray-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          meta.badgeClass.replace('text-', 'bg-opacity-20 text-')
                        )}
                      >
                        {tx.type === 'topup' && <ArrowUpRight className="h-5 w-5" />}
                        {tx.type === 'refund' && <RefreshCcw className="h-5 w-5" />}
                        {tx.type === 'charge' && <CreditCard className="h-5 w-5" />}
                        {/* Fallback icon */}
                        {!['topup', 'refund', 'charge'].includes(tx.type) && (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.description || meta.label}
                        </p>
                        <p className="text-xs text-gray-500">{formatWalletDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        tx.amount >= 0 ? 'text-emerald-600' : 'text-gray-900'
                      )}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WalletTopUpDialog({
  open,
  onOpenChange,
  amount,
  onAmountChange,
  description,
  onDescriptionChange,
  onSubmit,
  isSubmitting,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  currency: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>Nạp tiền vào ví bệnh nhân</DialogTitle>
          <DialogDescription>
            Tạo link thanh toán VNPAY để nạp tiền vào ví. Số dư sẽ được cập nhật sau khi thanh toán
            thành công.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topup-amount">Số tiền ({currency})</Label>
            <Input
              id="topup-amount"
              type="number"
              min="0"
              placeholder="Ví dụ: 500000"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topup-description">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              id="topup-description"
              rows={3}
              placeholder="Ví dụ: Nạp tiền khám tổng quát tháng 12"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            Nạp qua VNPAY
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatItem({
  label,
  value,
  icon: Icon,
  color,
  bg,
  highlight,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      className="flex cursor-default items-center gap-4"
    >
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full shadow-sm',
          bg,
          color
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p
          className={cn(
            'text-2xl font-bold tracking-tight',
            highlight ? 'text-amber-600' : 'text-gray-900'
          )}
        >
          {formatCurrency(value)}
        </p>
      </div>
    </motion.div>
  );
}

function InvoiceRow({
  invoice,
  index,
  currentTime,
  onPayment,
  onWalletPayment,
  canPayWithWallet,
  onDownload,
  onViewDetails,
  isProcessing,
  isWalletProcessing,
  isDownloading,
  formatDate,
}: {
  invoice: Invoice;
  index: number;
  currentTime: number;
  onPayment: (invoice: Invoice) => void;
  onWalletPayment?: (invoice: Invoice) => void;
  canPayWithWallet?: boolean;
  onDownload: (invoice: Invoice) => void;
  onViewDetails: (invoice: Invoice) => void;
  isProcessing: boolean;
  isWalletProcessing?: boolean;
  isDownloading: boolean;
  formatDate: (value?: string) => string;
}) {
  const isPaid = invoice.status === 'paid';
  const isPending = isPendingStatus(invoice.status);
  const invoiceExpired = hasInvoiceExpired(invoice, currentTime);
  const badge = getStatusBadge(invoice.status);
  const outstanding = getOutstandingAmount(invoice);
  const patientLiability = Math.max(
    0,
    (invoice.totalAmount ?? 0) - (invoice.insuranceCoverage ?? 0)
  );
  const totalAmountLabel = formatCurrency(invoice.totalAmount);
  const patientLiabilityLabel = formatCurrency(patientLiability);
  const issuedDate = invoice.issueDate ?? invoice.issuedAt ?? invoice.createdAt;
  const invoiceTitle = getInvoiceTitle(invoice);
  const invoiceCodeLabel = getInvoiceLabel(invoice);
  const serviceSummary = getPrimaryServiceName(invoice);
  const canUseWallet =
    Boolean(onWalletPayment) &&
    Boolean(canPayWithWallet) &&
    !isPaid &&
    isPending &&
    outstanding > 0 &&
    !invoiceExpired;
  const isNonPayableStatus = NON_PAYABLE_STATUSES.includes(invoice.status);
  const canAttemptPayment = !isPaid && !isNonPayableStatus && !invoiceExpired;
  const countdownInfo = getCountdownInfo(invoice.dueDate, currentTime);
  const shouldShowCountdown = countdownInfo && isPending && !invoiceExpired;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: 'rgba(236, 253, 245, 0.8)', x: 4 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="group cursor-pointer border-b border-gray-50 last:border-none"
    >
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="text-gray-900">{invoiceCodeLabel}</span>
          <span className="text-xs text-gray-400">{invoiceTitle}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="line-clamp-1 text-gray-700" title={serviceSummary}>
          {serviceSummary}
        </span>
      </TableCell>
      <TableCell className="text-sm text-gray-500">{formatDate(issuedDate)}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge
            variant="secondary"
            className={cn(
              'w-fit font-normal capitalize',
              isPaid
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : isPending
                  ? 'border-amber-100 bg-amber-50 text-amber-700'
                  : invoice.status === 'expired'
                    ? 'border-red-100 bg-red-50 text-red-600'
                    : 'border-gray-200 bg-gray-100 text-gray-700'
            )}
          >
            {badge.label}
          </Badge>
          {shouldShowCountdown && <CountdownLabel info={countdownInfo} />}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span
            className={cn('font-semibold', isPending ? 'text-amber-600' : 'text-gray-900')}
            title={`Tổng: ${totalAmountLabel}`}
          >
            {patientLiabilityLabel}
          </span>
          {invoice.insuranceCoverage > 0 && (
            <span className="text-xs text-emerald-600">
              Bảo hiểm: -{formatCurrency(invoice.insuranceCoverage)}
            </span>
          )}
          {outstanding > 0 && isPending && (
            <span className="text-xs text-red-500">Nợ: {formatCurrency(outstanding)}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canUseWallet && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onWalletPayment?.(invoice)}
              disabled={isWalletProcessing}
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              title="Thanh toán bằng ví"
            >
              {isWalletProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
            </Button>
          )}

          {canAttemptPayment && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onPayment(invoice)}
              disabled={isProcessing}
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              title="Thanh toán ngay"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDownload(invoice)}
            disabled={isDownloading}
            className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Tải hóa đơn"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onViewDetails(invoice)}
            className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Xem chi tiết"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </motion.tr>
  );
}

function InvoiceDetailsDialog({
  invoice,
  onClose,
  formatDate,
  currentTime,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  formatDate: (value?: string) => string;
  currentTime: number;
}) {
  if (!invoice) return null;

  const isPaid = invoice.status === 'paid';
  const badge = getStatusBadge(invoice.status);
  const countdownInfo = hasInvoiceExpired(invoice, currentTime)
    ? null
    : getCountdownInfo(invoice.dueDate, currentTime);

  // Calculate subtotal if missing
  const calculatedSubtotal =
    invoice.subtotal ||
    (invoice.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) ?? 0);

  const resolvedPatientName =
    invoice.patientName ||
    invoice.metadata?.patientName ||
    invoice.metadata?.patient_name ||
    invoice.metadata?.patient?.fullName ||
    invoice.metadata?.patient?.name ||
    'Khách vãng lai';

  const paymentMethodRaw =
    invoice.paymentMethod ||
    invoice.payments?.find((p) => p.status === 'completed' || p.method !== 'refund')?.method;
  const displayPaymentMethod = paymentMethodRaw
    ? getPaymentMethodLabel(paymentMethodRaw)
    : isPaid
      ? 'Không xác định'
      : 'Chưa thanh toán';

  const patientLiability = Math.max(
    0,
    typeof invoice.patientPaymentAmount === 'number'
      ? invoice.patientPaymentAmount
      : (invoice.totalAmount ?? 0) - (invoice.insuranceCoverage ?? 0)
  );
  const outstandingAmount = getOutstandingAmount(invoice);
  const paidAmountDisplay = Math.max(0, patientLiability - outstandingAmount);

  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-6 py-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Hóa đơn {getInvoiceLabel(invoice)}
              </DialogTitle>
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                )}
              >
                {badge.label}
              </Badge>
            </div>
            <DialogDescription className="text-sm text-gray-500">
              Phát hành ngày {formatDate(invoice.issueDate ?? invoice.issuedAt)}
            </DialogDescription>
          </div>
          {/* Close button is handled by DialogPrimitive, but we can add custom actions here if needed */}
        </div>

        <div className="max-h-[75vh] overflow-y-auto bg-white px-6 py-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Thông tin chung
              </h4>
              <div className="space-y-4">
                <InfoItem label="Khách hàng" value={resolvedPatientName} />
                <InfoItem label="Bác sĩ chỉ định" value={invoice.doctorName} />
                <InfoItem label="Khoa / Phòng" value={invoice.doctorDepartment} />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Chi tiết thanh toán
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">Hạn thanh toán</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
                  {countdownInfo && <CountdownLabel info={countdownInfo} className="mt-0.5" />}
                </div>
                <InfoItem label="Phương thức" value={displayPaymentMethod} className="capitalize" />
                <InfoItem label="Mã tham chiếu" value={invoice.appointmentId} />
              </div>
            </div>
          </div>

          <Separator className="my-8 opacity-50" />

          {/* Services Table */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Chi tiết dịch vụ</h4>
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-3 font-medium">Mô tả dịch vụ</th>
                    <th className="px-4 py-3 text-right font-medium">Đơn giá</th>
                    <th className="px-4 py-3 text-right font-medium">SL</th>
                    <th className="px-4 py-3 text-right font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.items?.length ? (
                    invoice.items.map((item) => (
                      <tr key={item.id} className="group transition-colors hover:bg-white">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                        Không có dịch vụ nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="mt-8 flex flex-col items-end gap-3">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tổng tiền hàng</span>
                <span>{formatCurrency(calculatedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Thuế (VAT)</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Bảo hiểm chi trả</span>
                <span>-{formatCurrency(invoice.insuranceCoverage)}</span>
              </div>

              <div className="my-2 h-px bg-gray-100" />

              <div className="flex items-baseline justify-between">
                <span className="text-base font-medium text-gray-900">
                  Người bệnh cần thanh toán
                </span>
                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  {formatCurrency(patientLiability)}
                </span>
              </div>
              <p className="text-right text-xs text-gray-500">
                Đã bao gồm VAT, trừ phần bảo hiểm chi trả
              </p>

              {paidAmountDisplay > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Đã thanh toán</span>
                  <span>{formatCurrency(paidAmountDisplay)}</span>
                </div>
              )}

              {outstandingAmount > 0 ? (
                <div className="flex justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                  <span>Còn lại phải trả</span>
                  <span>{formatCurrency(outstandingAmount)}</span>
                </div>
              ) : (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
                  Đã thanh toán đủ
                </div>
              )}
            </div>
          </div>

          {/* Transaction History (Timeline style) */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h4 className="mb-4 text-sm font-medium text-gray-900">Lịch sử thanh toán</h4>
              <div className="space-y-4">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        'ring-opacity-20 mt-0.5 flex h-2 w-2 flex-none rounded-full ring-4',
                        payment.method === 'refund'
                          ? 'bg-blue-500 ring-blue-500'
                          : 'bg-emerald-500 ring-emerald-500'
                      )}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">
                          {payment.method === 'refund' ? 'Hoàn tiền' : 'Thanh toán thành công'}
                        </span>
                        <span
                          className={cn(
                            'font-medium',
                            payment.method === 'refund' ? 'text-blue-600' : 'text-emerald-600'
                          )}
                        >
                          {payment.method === 'refund' ? '-' : '+'}
                          {formatCurrency(Math.abs(payment.amount))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(payment.processedAt || payment.paidAt)} qua{' '}
                        <span className="capitalize">{getPaymentMethodLabel(payment.method)}</span>
                      </p>
                    </div>
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

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <p className="mb-0.5 text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function getPaymentMethodLabel(method?: string) {
  const normalized = (method || '').toLowerCase();
  switch (normalized) {
    case 'payos':
    case 'vnpay':
      return 'VNPAY';
    case 'wallet':
      return 'Ví điện tử';
    case 'cash':
      return 'Tiền mặt';
    case 'card':
      return 'Thẻ ngân hàng';
    case 'bank_transfer':
      return 'Chuyển khoản';
    default:
      return method || 'Không xác định';
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white py-16 text-center">
      <div className="rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 p-4">
        <FileText className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">Chưa có hóa đơn nào</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Hiện tại bạn không có hóa đơn nào phù hợp với bộ lọc. Hãy thử thay đổi điều kiện tìm kiếm.
      </p>
    </div>
  );
}

function formatWalletDate(value?: string) {
  if (!value) return 'Không rõ thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getTransactionMeta(type: WalletTransaction['type']) {
  switch (type) {
    case 'topup':
      return { label: 'Nạp tiền', badgeClass: 'bg-emerald-100 text-emerald-700' };
    case 'refund':
      return { label: 'Hoàn tiền', badgeClass: 'bg-blue-100 text-blue-700' };
    case 'charge':
      return { label: 'Trừ tiền', badgeClass: 'bg-orange-100 text-orange-700' };
    default:
      return { label: 'Điều chỉnh', badgeClass: 'bg-gray-100 text-gray-700' };
  }
}

function getInvoiceLabel(invoice: Invoice) {
  return invoice.invoiceNumber || invoice.invoiceCode || invoice.id;
}

type CountdownInfo = {
  text: string;
  isExpired: boolean;
  tone: 'warning' | 'danger';
};

function getCountdownInfo(dueDate?: string | Date, currentTime?: number): CountdownInfo | null {
  if (!dueDate || !currentTime) {
    return null;
  }
  const target = new Date(dueDate).getTime();
  if (Number.isNaN(target)) {
    return null;
  }
  const diff = target - currentTime;
  const absSeconds = Math.max(0, Math.floor(Math.abs(diff) / 1000));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  if (diff <= 0) {
    return {
      text: `Đã quá hạn ${formatted}`,
      isExpired: true,
      tone: 'danger',
    };
  }

  const tone = diff < 5 * 60 * 1000 ? 'danger' : 'warning';
  return {
    text: `Còn ${formatted}`,
    isExpired: false,
    tone,
  };
}

function CountdownLabel({ info, className }: { info?: CountdownInfo | null; className?: string }) {
  if (!info) return null;
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        info.tone === 'danger' ? 'text-red-600' : 'text-amber-600',
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{info.text}</span>
    </div>
  );
}

const INVOICE_TYPE_LABELS: Record<string, string> = {
  appointment_booking: 'Đặt lịch khám',
  wallet_topup: 'Nạp ví tài khoản',
  late_cancellation_fee: 'Phí hủy lịch muộn',
  reschedule_fee: 'Phí đổi lịch hẹn',
  no_show_fee: 'Phí bỏ khám',
  prescription: 'Thanh toán đơn thuốc',
  lab_test: 'Thanh toán xét nghiệm',
  treatment_plan: 'Thanh toán kế hoạch điều trị',
  medical_record: 'Thanh toán hồ sơ y tế',
  refund: 'Hoàn tiền',
  medical_service: 'Dịch vụ y tế',
};

function getInvoiceTitle(invoice: Invoice) {
  const typeLabel = getInvoiceTypeLabel(invoice);
  if (typeLabel) {
    return typeLabel;
  }
  if (invoice.metadata?.serviceName) {
    return invoice.metadata.serviceName;
  }
  return getInvoiceLabel(invoice);
}

function getPrimaryServiceName(invoice: Invoice) {
  const meta = invoice.metadata || {};
  if (meta.serviceDescription) {
    const formatted = tryFormatServiceDescription(meta.serviceDescription);
    return formatted || meta.serviceDescription;
  }
  if (meta.serviceName) {
    return meta.serviceName;
  }
  if (invoice.items && invoice.items.length > 0) {
    return invoice.items[0]?.description || 'Dịch vụ y tế';
  }
  if (meta.description) {
    return meta.description;
  }
  return 'Dịch vụ y tế';
}

function tryFormatServiceDescription(description: string): string | null {
  if (!description) return null;
  const isoMatch = description.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/);
  if (isoMatch) {
    const parsed = new Date(isoMatch[0]);
    if (!isNaN(parsed.getTime())) {
      const formatted = formatAppointmentDateTimeDisplay(parsed);
      if (formatted) {
        return description.replace(isoMatch[0], formatted);
      }
    }
  }
  return null;
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
    case 'expired':
      return { label: 'Đã hết hạn', tone: 'danger' as const };
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

function getInvoiceTypeLabel(invoice: Invoice): string | null {
  const type = (
    (invoice.metadata?.invoiceType as string | undefined) ||
    (invoice.metadata?.invoice_type as string | undefined)
  )?.toLowerCase();
  if (type && INVOICE_TYPE_LABELS[type]) {
    return INVOICE_TYPE_LABELS[type];
  }
  return null;
}

function getInvoiceAppointmentDate(invoice: Invoice): Date | null {
  const metadata = (invoice.metadata || {}) as Record<string, any>;
  const candidates = [
    metadata.appointmentDateTime,
    metadata.appointment_datetime,
    metadata.appointmentDateTimeLocal,
    metadata.appointment_datetime_local,
    metadata.appointmentTime,
    metadata.appointment_time,
    metadata.appointmentStartAt,
    metadata.appointment_start_at,
    metadata.appointmentStartAtUtc,
  ];

  for (const value of candidates) {
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  const datePart =
    metadata.appointmentDate ||
    metadata.appointment_date ||
    metadata.appointmentDateLocal ||
    metadata.appointment_date_local;
  const timePart =
    metadata.appointmentTimeLocal ||
    metadata.appointment_time_local ||
    metadata.appointmentTime ||
    metadata.appointment_time;
  if (datePart && timePart) {
    const parsed = new Date(`${datePart}T${timePart}`);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function formatAppointmentDateTimeDisplay(date: Date | null): string | null {
  if (!date) return null;
  const dateLabel = APPOINTMENT_DATE_FORMATTER.format(date);
  const timeLabel = APPOINTMENT_TIME_FORMATTER.format(date);
  return `${dateLabel} • ${timeLabel}`;
}

function hasInvoiceExpired(invoice: Invoice, referenceTime = Date.now()): boolean {
  if (!invoice) return false;
  if (invoice.status === 'expired') {
    return true;
  }

  if (!invoice.dueDate) {
    return false;
  }

  const due = new Date(invoice.dueDate).getTime();
  if (Number.isNaN(due)) {
    return false;
  }

  return due <= referenceTime;
}

function getOutstandingAmount(invoice: Invoice): number {
  if (!invoice) return 0;
  if (typeof invoice.outstandingAmount === 'number') {
    return Math.max(0, invoice.outstandingAmount);
  }

  const fallbackOutstanding =
    typeof invoice.outstandingAmount === 'number' ? invoice.outstandingAmount : 0;
  const paidFromField = Math.max(
    0,
    invoice.paidAmount ?? (invoice.totalAmount ?? 0) - fallbackOutstanding
  );

  const paidFromPayments =
    invoice.payments
      ?.filter((p) => p.method !== 'refund')
      .reduce((sum, payment) => {
        const amount =
          typeof payment.amount === 'number' ? payment.amount : Number(payment.amount ?? 0);
        return sum + Math.max(0, amount);
      }, 0) ?? 0;

  const paid = Math.max(paidFromField, paidFromPayments);
  return Math.max(0, (invoice.totalAmount ?? 0) - paid);
}
