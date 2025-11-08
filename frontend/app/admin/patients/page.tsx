'use client';

import { useState } from 'react';
import { Search, Plus, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Admin Patients Management Page
 * Route: /admin/patients
 */
export default function AdminPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý bệnh nhân</h1>
            <p className="mt-2 text-gray-600">Danh sách tất cả bệnh nhân</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm bệnh nhân
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard title="Tổng bệnh nhân" value="1,234" />
          <StatCard title="Mới hôm nay" value="12" />
          <StatCard title="Đang điều trị" value="45" />
          <StatCard title="Tái khám" value="23" />
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bệnh nhân..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả trạng thái</option>
            <option>Đang điều trị</option>
            <option>Đã xuất viện</option>
          </select>
        </div>

        {/* Patients Table */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bệnh nhân
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mã BN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ngày đăng ký
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
              <PatientRow
                name="Nguyễn Văn A"
                code="BN-2025-001"
                phone="0912345678"
                registeredDate="15/01/2025"
                status="active"
              />
              <PatientRow
                name="Trần Thị B"
                code="BN-2025-002"
                phone="0912345679"
                registeredDate="14/01/2025"
                status="active"
              />
              <PatientRow
                name="Lê Văn C"
                code="BN-2025-003"
                phone="0912345680"
                registeredDate="13/01/2025"
                status="discharged"
              />
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function PatientRow({
  name,
  code,
  phone,
  registeredDate,
  status,
}: {
  name: string;
  code: string;
  phone: string;
  registeredDate: string;
  status: string;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            {name.charAt(0)}
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{name}</div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{code}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{phone}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{registeredDate}</td>
      <td className="whitespace-nowrap px-6 py-4">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status === 'active' ? 'Đang điều trị' : 'Đã xuất viện'}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <button className="mr-3 text-primary hover:text-primary/80">
          <Eye className="h-4 w-4" />
        </button>
        <button className="text-primary hover:text-primary/80">
          <FileText className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
