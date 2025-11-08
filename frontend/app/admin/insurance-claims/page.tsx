'use client';

import { useState } from 'react';
import { Search, Shield, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function AdminInsuranceClaimsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý yêu cầu bảo hiểm</h1>
          <p className="mt-2 text-gray-600">Xử lý các yêu cầu thanh toán bảo hiểm</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <StatCard title="Tổng yêu cầu" value="234" color="blue" />
          <StatCard title="Đang xử lý" value="45" color="yellow" />
          <StatCard title="Đã duyệt" value="178" color="green" />
          <StatCard title="Từ chối" value="11" color="red" />
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm yêu cầu..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả trạng thái</option>
            <option>Đang xử lý</option>
            <option>Đã duyệt</option>
            <option>Từ chối</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mã yêu cầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bệnh nhân
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nhà bảo hiểm
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
              <ClaimRow
                claimId="CLM-2025-001"
                patient="Nguyễn Văn A"
                insurer="Bảo Việt"
                amount="5,000,000"
                status="pending"
              />
              <ClaimRow
                claimId="CLM-2025-002"
                patient="Trần Thị B"
                insurer="Prudential"
                amount="3,500,000"
                status="approved"
              />
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <Shield className={`h-8 w-8 ${colors[color]}`} />
      </div>
    </div>
  );
}

function ClaimRow({ claimId, patient, insurer, amount, status }: any) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{claimId}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{patient}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{insurer}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
        {amount} VNĐ
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
          {status === 'pending' && 'Đang xử lý'}
          {status === 'approved' && 'Đã duyệt'}
          {status === 'rejected' && 'Từ chối'}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right">
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Xem
        </Button>
      </td>
    </tr>
  );
}
