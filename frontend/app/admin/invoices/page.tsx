'use client';

import { useState } from 'react';
import { Search, FileText, Download, Eye, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Admin Invoices Management Page
 * Route: /admin/invoices
 */
export default function AdminInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý hóa đơn</h1>
            <p className="mt-2 text-gray-600">Theo dõi và quản lý tất cả hóa đơn</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            title="Tổng hóa đơn"
            value="1,234"
            subtitle="Tháng này"
            color="blue"
          />
          <StatCard
            title="Đã thanh toán"
            value="980"
            subtitle="79%"
            color="green"
          />
          <StatCard
            title="Chưa thanh toán"
            value="254"
            subtitle="21%"
            color="orange"
          />
          <StatCard
            title="Tổng doanh thu"
            value="450M VNĐ"
            subtitle="Tháng này"
            color="purple"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm hóa đơn..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả trạng thái</option>
            <option>Đã thanh toán</option>
            <option>Chưa thanh toán</option>
            <option>Quá hạn</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tháng này</option>
            <option>Tháng trước</option>
            <option>3 tháng</option>
            <option>6 tháng</option>
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
              <InvoiceRow
                invoiceNumber="INV-2025-001"
                patientName="Nguyễn Văn A"
                date="15/01/2025"
                amount="2,500,000"
                status="paid"
              />
              <InvoiceRow
                invoiceNumber="INV-2025-002"
                patientName="Trần Thị B"
                date="14/01/2025"
                amount="1,800,000"
                status="pending"
              />
              <InvoiceRow
                invoiceNumber="INV-2025-003"
                patientName="Lê Văn C"
                date="13/01/2025"
                amount="3,200,000"
                status="overdue"
              />
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">10</span> trong tổng số{' '}
            <span className="font-medium">1,234</span> kết quả
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Trước</Button>
            <Button variant="outline" size="sm">1</Button>
            <Button size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Sau</Button>
          </div>
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
  invoiceNumber,
  patientName,
  date,
  amount,
  status,
}: {
  invoiceNumber: string;
  patientName: string;
  date: string;
  amount: string;
  status: string;
}) {
  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    paid: 'Đã thanh toán',
    pending: 'Chưa thanh toán',
    overdue: 'Quá hạn',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <FileText className="mr-2 h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">{invoiceNumber}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{patientName}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{date}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
        {amount} VNĐ
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <button className="mr-3 text-primary hover:text-primary/80">
          <Eye className="h-4 w-4" />
        </button>
        <button className="text-primary hover:text-primary/80">
          <Download className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
