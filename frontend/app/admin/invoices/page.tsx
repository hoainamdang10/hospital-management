'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { billingService, Invoice } from '@/lib/api/billing.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * Admin Invoices Management Page
 * Route: /admin/invoices
 */
export default function AdminInvoicesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('THIS_MONTH');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCount: 0,
    paidCount: 0,
    pendingCount: 0,
    totalRevenue: 0
  });

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      // Calculate date range based on timeFilter
      const now = new Date();
      let fromDate = new Date(now.getFullYear(), now.getMonth(), 1); // Default: This month
      let toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      if (timeFilter === 'LAST_MONTH') {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        toDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (timeFilter === 'LAST_3_MONTHS') {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      }

      const res = await billingService.searchInvoices({
        search: searchTerm,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        fromDate: format(fromDate, 'yyyy-MM-dd'),
        toDate: format(toDate, 'yyyy-MM-dd'),
        limit: 50 // Fetch up to 50 for now
      });

      if (res && res.data) {
        setInvoices(res.data);

        // Calculate stats locally for now (or fetch from a stats endpoint if available)
        const total = res.data.length;
        const paid = res.data.filter((i: Invoice) => i.status === 'PAID').length;
        const pending = res.data.filter((i: Invoice) => i.status === 'PENDING').length;
        const revenue = res.data
          .filter((i: Invoice) => i.status === 'PAID')
          .reduce((sum: number, i: Invoice) => sum + i.amount, 0);

        setStats({
          totalCount: total,
          paidCount: paid,
          pendingCount: pending,
          totalRevenue: revenue
        });
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchInvoices();
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm, statusFilter, timeFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý hóa đơn</h1>
            <p className="mt-2 text-gray-600">Theo dõi và quản lý tất cả hóa đơn</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            title="Tổng hóa đơn"
            value={stats.totalCount.toString()}
            subtitle="Trong kỳ chọn"
            color="blue"
          />
          <StatCard
            title="Đã thanh toán"
            value={stats.paidCount.toString()}
            subtitle={`${stats.totalCount ? Math.round((stats.paidCount / stats.totalCount) * 100) : 0}%`}
            color="green"
          />
          <StatCard
            title="Chưa thanh toán"
            value={stats.pendingCount.toString()}
            subtitle={`${stats.totalCount ? Math.round((stats.pendingCount / stats.totalCount) * 100) : 0}%`}
            color="orange"
          />
          <StatCard
            title="Tổng doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            subtitle="Thực thu"
            color="purple"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã, tên bệnh nhân..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            className="rounded-lg border border-gray-300 px-4 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PENDING">Chưa thanh toán</option>
            <option value="OVERDUE">Quá hạn</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <select
            className="rounded-lg border border-gray-300 px-4 py-2"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="THIS_MONTH">Tháng này</option>
            <option value="LAST_MONTH">Tháng trước</option>
            <option value="LAST_3_MONTHS">3 tháng gần nhất</option>
          </select>
        </div>

        {/* Invoices Table */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mã hóa đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bệnh nhân
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500">Không tìm thấy hóa đơn nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    onView={() => router.push(`/admin/invoices/${invoice.id}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Simplified for now) */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">{invoices.length}</span> kết quả
          </p>
          {/* Add pagination controls if API supports it fully */}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`rounded-full p-3 ${colors[color]}`}>
          <DollarSign className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function InvoiceRow({
  invoice,
  onView
}: {
  invoice: Invoice;
  onView: () => void;
}) {
  const statusColors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    PAID: 'Đã thanh toán',
    PENDING: 'Chưa thanh toán',
    OVERDUE: 'Quá hạn',
    CANCELLED: 'Đã hủy',
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <FileText className="mr-2 h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {invoice.patientName || 'Khách vãng lai'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: vi })}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.amount)}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100'}`}>
          {statusLabels[invoice.status] || invoice.status}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <button
          onClick={onView}
          className="mr-3 text-primary hover:text-primary/80"
          title="Xem chi tiết"
        >
          <Eye className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
