'use client';

import { useState } from 'react';
import { Search, Plus, Edit, Trash2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import Link from 'next/link';

/**
 * Admin Staff Management Page
 * Route: /admin/staff
 */
export default function AdminStaffPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
            <p className="mt-2 text-gray-600">Quản lý bác sĩ, quản trị viên và lễ tân</p>
          </div>
          <Link href="/admin/staff/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm nhân viên
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard title="Tổng nhân viên" value="45" color="blue" icon="👥" />
          <StatCard title="Bác sĩ" value="15" color="green" icon="👨‍⚕️" />
          <StatCard title="Quản trị viên" value="5" color="purple" icon="👔" />
          <StatCard title="Lễ tân" value="25" color="orange" icon="📋" />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhân viên..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Tất cả chuyên khoa</option>
            <option value="CARDIOLOGY">Tim mạch</option>
            <option value="NEUROLOGY">Thần kinh</option>
            <option value="PEDIATRICS">Nhi khoa</option>
            <option value="ORTHOPEDICS">Chỉnh hình</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang làm việc</option>
            <option value="ON_LEAVE">Nghỉ phép</option>
            <option value="INACTIVE">Nghỉ việc</option>
          </select>
        </div>

        {/* Staff Table */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nhân viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Chức vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Chuyên khoa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Số điện thoại
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
              <StaffRow
                name="BS. Nguyễn Văn A"
                role="Bác sĩ"
                specialty="Tim mạch"
                phone="0912345678"
                status="ACTIVE"
              />
              <StaffRow
                name="BS. Trần Thị B"
                role="Bác sĩ"
                specialty="Nội khoa"
                phone="0912345679"
                status="ACTIVE"
              />
              <StaffRow
                name="Y tá Lê Văn C"
                role="Y tá"
                specialty="Ngoại khoa"
                phone="0912345680"
                status="ACTIVE"
              />
              <StaffRow
                name="Y tá Phạm Thị D"
                role="Y tá"
                specialty="Nhi khoa"
                phone="0912345681"
                status="ON_LEAVE"
              />
              <StaffRow
                name="BS. Hoàng Văn E"
                role="Bác sĩ"
                specialty="Chỉnh hình"
                phone="0912345682"
                status="ACTIVE"
              />
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">5</span> trong tổng số{' '}
            <span className="font-medium">45</span> kết quả
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Trước
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button size="sm">2</Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Sau
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, color, icon }: { title: string; value: string; color: string; icon?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colors[color]}`}>
          {icon ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            <UserCog className="h-6 w-6" />
          )}
        </div>
      </div>
    </div>
  );
}

function StaffRow({
  name,
  role,
  specialty,
  phone,
  status,
}: {
  name: string;
  role: string;
  specialty: string;
  phone: string;
  status: string;
}) {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    ON_LEAVE: 'bg-yellow-100 text-yellow-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Đang làm việc',
    ON_LEAVE: 'Nghỉ phép',
    INACTIVE: 'Nghỉ việc',
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
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{role}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{specialty}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{phone}</td>
      <td className="whitespace-nowrap px-6 py-4">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <button className="mr-3 text-primary hover:text-primary/80">
          <Edit className="h-4 w-4" />
        </button>
        <button className="text-red-600 hover:text-red-800">
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
