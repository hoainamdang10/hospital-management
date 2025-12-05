'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  CreditCard,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  MoreHorizontal,
  Banknote,
  Smartphone,
  Building2,
  Mail,
  Printer,
  Undo2,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  User,
  Stethoscope,
  CalendarCheck,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { billingService, Invoice } from '@/lib/api/billing.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================
type InvoiceStatus = 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
type PaymentMethod = 'PayOS' | 'VNPay' | 'MoMo' | 'Cash' | 'Card' | 'BankTransfer';

interface ExtendedInvoice extends Invoice {
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  doctorName?: string;
  departmentName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_TABS: { value: InvoiceStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'ALL', label: 'Tất cả', icon: FileText, color: 'slate' },
  { value: 'PAID', label: 'Đã thanh toán', icon: CheckCircle2, color: 'emerald' },
  { value: 'PENDING', label: 'Chờ thanh toán', icon: Clock, color: 'amber' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền', icon: Undo2, color: 'purple' },
  { value: 'CANCELLED', label: 'Đã hủy', icon: XCircle, color: 'slate' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; colors: string; bgColor: string }> = {
  PAID: {
    label: 'Đã thanh toán',
    icon: CheckCircle2,
    colors: 'text-emerald-600 border-emerald-200',
    bgColor: 'bg-emerald-50'
  },
  PENDING: {
    label: 'Chờ thanh toán',
    icon: Clock,
    colors: 'text-amber-600 border-amber-200',
    bgColor: 'bg-amber-50'
  },
  OVERDUE: {
    label: 'Quá hạn',
    icon: AlertCircle,
    colors: 'text-red-600 border-red-200',
    bgColor: 'bg-red-50'
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: XCircle,
    colors: 'text-slate-600 border-slate-200',
    bgColor: 'bg-slate-50'
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    icon: Undo2,
    colors: 'text-purple-600 border-purple-200',
    bgColor: 'bg-purple-50'
  },
  FAILED: {
    label: 'Thất bại',
    icon: AlertTriangle,
    colors: 'text-red-600 border-red-200',
    bgColor: 'bg-red-50'
  },
};

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ElementType; colors: string }> = {
  PayOS: { label: 'PayOS', icon: Smartphone, colors: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  VNPay: { label: 'VNPay', icon: CreditCard, colors: 'bg-blue-100 text-blue-700 border-blue-200' },
  MoMo: { label: 'MoMo', icon: Smartphone, colors: 'bg-pink-100 text-pink-700 border-pink-200' },
  Cash: { label: 'Tiền mặt', icon: Banknote, colors: 'bg-green-100 text-green-700 border-green-200' },
  Card: { label: 'Thẻ', icon: CreditCard, colors: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  BankTransfer: { label: 'Chuyển khoản', icon: Building2, colors: 'bg-slate-100 text-slate-700 border-slate-200' },
};

// ============================================================================
// MAIN COMPONENT (with Suspense wrapper for useSearchParams)
// ============================================================================
export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={<InvoicesLoadingFallback />}>
      <AdminInvoicesContent />
    </Suspense>
  );
}

function InvoicesLoadingFallback() {
  return (
    <DashboardLayout>
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-indigo-600" />
          </div>
          <p className="text-slate-500">Đang tải trang hóa đơn...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AdminInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as InvoiceStatus) || 'ALL';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<InvoiceStatus>(initialStatus);
  const [timeFilter, setTimeFilter] = useState('THIS_MONTH');
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Calculate stats
  const stats = useMemo(() => {
    const all = invoices.length;
    const paid = invoices.filter(i => i.status === 'PAID').length;
    const pending = invoices.filter(i => i.status === 'PENDING').length;
    const refunded = invoices.filter(i => i.status === 'REFUNDED' || i.status === 'CANCELLED').length;
    const totalRevenue = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    return { all, paid, pending, refunded, totalRevenue };
  }, [invoices]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    ALL: invoices.length,
    PAID: invoices.filter(i => i.status === 'PAID').length,
    PENDING: invoices.filter(i => i.status === 'PENDING').length,
    REFUNDED: invoices.filter(i => i.status === 'REFUNDED').length,
    CANCELLED: invoices.filter(i => i.status === 'CANCELLED').length,
    OVERDUE: invoices.filter(i => i.status === 'OVERDUE').length,
  }), [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Status filter
      if (activeTab !== 'ALL' && invoice.status !== activeTab) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          invoice.invoiceNumber?.toLowerCase().includes(search) ||
          invoice.patientName?.toLowerCase().includes(search) ||
          invoice.transactionId?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [invoices, activeTab, searchTerm]);

  const fetchInvoices = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const now = new Date();
      let fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      let toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      if (timeFilter === 'LAST_MONTH') {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        toDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (timeFilter === 'LAST_3_MONTHS') {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      } else if (timeFilter === 'LAST_7_DAYS') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const res = await billingService.searchInvoices({
        search: '',
        fromDate: format(fromDate, 'yyyy-MM-dd'),
        toDate: format(toDate, 'yyyy-MM-dd'),
        limit: 100,
      });

      if (res && res.data) {
        // Enrich with mock payment method for demo
        const enrichedInvoices = res.data.map((inv: Invoice) => ({
          ...inv,
          paymentMethod: getRandomPaymentMethod(),
          transactionId: `TXN${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          doctorName: 'BS. Nguyễn Văn A',
          departmentName: 'Khoa Tim mạch',
          appointmentDate: inv.createdAt,
          appointmentTime: '09:00',
        }));
        setInvoices(enrichedInvoices);
      }

      if (showRefreshToast) {
        toast.success('Đã cập nhật danh sách hóa đơn');
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [timeFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  };

  const handleExportReport = () => {
    toast.info('Đang xuất báo cáo...', { description: 'Tính năng đang phát triển' });
  };

  const handlePrintInvoice = (invoice: ExtendedInvoice) => {
    toast.success('Đang in hóa đơn...', { description: `Mã: ${invoice.invoiceNumber}` });
  };

  const handleSendEmail = (invoice: ExtendedInvoice) => {
    toast.success('Đã gửi email', { description: `Hóa đơn ${invoice.invoiceNumber} đã được gửi` });
  };

  const handleRefund = (invoice: ExtendedInvoice) => {
    toast.info('Yêu cầu hoàn tiền', { description: `Đang xử lý hoàn tiền cho ${invoice.invoiceNumber}` });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Premium Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/20" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/20" />
              <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-white/10" />
            </div>

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                >
                  <Receipt className="h-7 w-7" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Quản lý Hóa đơn</h1>
                  <p className="mt-1 text-indigo-100">
                    Theo dõi và quản lý thanh toán Prepaid
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchInvoices(true)}
                  disabled={isRefreshing}
                  className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                  Làm mới
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportReport}
                  className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Xuất báo cáo
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Tổng hóa đơn"
              value={stats.all.toString()}
              subtitle="Trong kỳ chọn"
              icon={FileText}
              gradient="from-blue-500 to-indigo-600"
              delay={0.1}
            />
            <StatCard
              title="Đã thanh toán"
              value={stats.paid.toString()}
              subtitle={`${stats.all ? Math.round((stats.paid / stats.all) * 100) : 0}% tổng số`}
              icon={CheckCircle2}
              gradient="from-emerald-500 to-green-600"
              delay={0.15}
            />
            <StatCard
              title="Chờ thanh toán"
              value={stats.pending.toString()}
              subtitle="Cần xử lý"
              icon={Clock}
              gradient="from-amber-500 to-orange-600"
              delay={0.2}
            />
            <StatCard
              title="Tổng doanh thu"
              value={formatCurrency(stats.totalRevenue)}
              subtitle="Thực thu"
              icon={Wallet}
              gradient="from-purple-500 to-pink-600"
              delay={0.25}
            />
          </div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/50 bg-white/70 p-2 shadow-lg backdrop-blur-sm"
          >
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => {
                const count = tabCounts[tab.value];
                const isActive = activeTab === tab.value;
                const TabIcon = tab.icon;

                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-sm"
          >
            {/* Search */}
            <div className="relative min-w-[300px] flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã hóa đơn, tên bệnh nhân, mã giao dịch..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Time Filter */}
            <div className="relative">
              <select
                className="h-12 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="LAST_7_DAYS">7 ngày qua</option>
                <option value="THIS_MONTH">Tháng này</option>
                <option value="LAST_MONTH">Tháng trước</option>
                <option value="LAST_3_MONTHS">3 tháng gần nhất</option>
              </select>
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </motion.div>

          {/* Invoices Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-lg"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Hóa đơn
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Bệnh nhân
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Thanh toán
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Số tiền
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="relative mb-4">
                              <div className="h-12 w-12 rounded-full border-4 border-indigo-100" />
                              <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-indigo-600" />
                            </div>
                            <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                              <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="font-medium text-slate-600">Không tìm thấy hóa đơn</p>
                            <p className="mt-1 text-sm text-slate-400">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice, index) => (
                        <InvoiceRow
                          key={invoice.id}
                          invoice={invoice}
                          index={index}
                          formatCurrency={formatCurrency}
                          onView={() => router.push(`/admin/invoices/${invoice.id}`)}
                          onPrint={() => handlePrintInvoice(invoice)}
                          onEmail={() => handleSendEmail(invoice)}
                          onRefund={() => handleRefund(invoice)}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {!isLoading && filteredInvoices.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <p className="text-sm text-slate-600">
                  Hiển thị <span className="font-semibold text-slate-900">{filteredInvoices.length}</span> hóa đơn
                  {activeTab !== 'ALL' && (
                    <span className="text-slate-400"> (lọc từ {invoices.length} tổng)</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled className="text-slate-400">
                    Trước
                  </Button>
                  <Button variant="outline" size="sm" disabled className="text-slate-400">
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getRandomPaymentMethod(): PaymentMethod {
  const methods: PaymentMethod[] = ['PayOS', 'VNPay', 'MoMo', 'Cash', 'Card', 'BankTransfer'];
  return methods[Math.floor(Math.random() * methods.length)];
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}

function StatCard({ title, value, subtitle, icon: Icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-5 shadow-lg transition-all hover:shadow-xl"
    >
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transition-all group-hover:opacity-20 group-hover:scale-150`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4 flex items-center text-sm font-medium text-slate-400 transition-colors group-hover:text-indigo-600">
        Xem chi tiết
        <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </motion.div>
  );
}

interface InvoiceRowProps {
  invoice: ExtendedInvoice;
  index: number;
  formatCurrency: (amount: number) => string;
  onView: () => void;
  onPrint: () => void;
  onEmail: () => void;
  onRefund: () => void;
}

function InvoiceRow({ invoice, index, formatCurrency, onView, onPrint, onEmail, onRefund }: InvoiceRowProps) {
  const [showActions, setShowActions] = useState(false);
  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const paymentConfig = PAYMENT_METHOD_CONFIG[invoice.paymentMethod || 'PayOS'];
  const PaymentIcon = paymentConfig?.icon || CreditCard;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group cursor-pointer transition-colors hover:bg-slate-50"
      onClick={onView}
    >
      {/* Invoice Info */}
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Hash className="h-3 w-3" />
              {invoice.transactionId?.slice(0, 12)}...
            </p>
          </div>
        </div>
      </td>

      {/* Patient Info */}
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300">
            <User className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{invoice.patientName || 'Khách vãng lai'}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <CalendarCheck className="h-3 w-3" />
              {format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
        </div>
      </td>

      {/* Payment Method */}
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium',
            paymentConfig?.colors || 'bg-slate-100 text-slate-600'
          )}>
            <PaymentIcon className="h-3.5 w-3.5" />
            {paymentConfig?.label || invoice.paymentMethod}
          </span>
        </div>
      </td>

      {/* Amount */}
      <td className="whitespace-nowrap px-6 py-4">
        <p className="text-lg font-bold text-slate-900">
          {formatCurrency(invoice.amount)}
        </p>
      </td>

      {/* Status */}
      <td className="whitespace-nowrap px-6 py-4">
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
          statusConfig.colors,
          statusConfig.bgColor
        )}>
          <StatusIcon className="h-3.5 w-3.5" />
          {statusConfig.label}
        </span>
      </td>

      {/* Actions */}
      <td className="whitespace-nowrap px-6 py-4 text-right">
        <div className="relative flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </button>

          {invoice.status === 'PAID' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600"
                title="In hóa đơn"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEmail();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                title="Gửi email"
              >
                <Mail className="h-4 w-4" />
              </button>
            </>
          )}

          {invoice.status === 'PAID' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefund();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"
              title="Hoàn tiền"
            >
              <Undo2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}
