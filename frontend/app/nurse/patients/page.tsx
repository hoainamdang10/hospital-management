'use client';

import { useState } from 'react';
import { Search, Eye, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Nurse Patient List Page
 * Route: /nurse/patients
 */
export default function NursePatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh sách bệnh nhân</h1>
          <p className="mt-2 text-gray-600">Quản lý bệnh nhân đang điều trị</p>
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
            <option>Đã check-in</option>
            <option>Đang khám</option>
            <option>Hoàn thành</option>
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
                  Bác sĩ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Giờ khám
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
                doctor="BS. Trần Thị B"
                time="09:00"
                status="checked-in"
              />
              <PatientRow
                name="Lê Thị C"
                code="BN-2025-002"
                doctor="BS. Trần Thị B"
                time="09:30"
                status="examining"
              />
              <PatientRow
                name="Phạm Văn D"
                code="BN-2025-003"
                doctor="BS. Nguyễn Văn E"
                time="10:00"
                status="waiting"
              />
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PatientRow({
  name,
  code,
  doctor,
  time,
  status,
}: {
  name: string;
  code: string;
  doctor: string;
  time: string;
  status: string;
}) {
  const statusColors: Record<string, string> = {
    'checked-in': 'bg-blue-100 text-blue-800',
    examining: 'bg-green-100 text-green-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    'checked-in': 'Đã check-in',
    examining: 'Đang khám',
    waiting: 'Chờ khám',
    completed: 'Hoàn thành',
  };

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
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{doctor}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{time}</td>
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
          <Activity className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
