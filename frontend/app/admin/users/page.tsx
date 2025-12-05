'use client';

import { useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Admin Users Management Page
 * Route: /admin/users
 */
export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="mt-2 text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm người dùng..."
              className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-1 focus:outline-none"
            />
          </div>
          <select className="focus:border-primary focus:ring-primary rounded-lg border border-gray-300 px-4 py-2 focus:ring-1 focus:outline-none">
            <option value="">Tất cả vai trò</option>
            <option value="PATIENT">Bệnh nhân</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
          <select className="focus:border-primary focus:ring-primary rounded-lg border border-gray-300 px-4 py-2 focus:ring-1 focus:outline-none">
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <UserRow
                name="Nguyễn Văn A"
                email="nguyenvana@example.com"
                role="PATIENT"
                status="ACTIVE"
                createdAt="15/01/2025"
              />
              <UserRow
                name="Trần Thị B"
                email="tranthib@example.com"
                role="DOCTOR"
                status="ACTIVE"
                createdAt="14/01/2025"
              />
              <UserRow
                name="Lê Văn C"
                email="levanc@example.com"
                role="PATIENT"
                status="ACTIVE"
                createdAt="13/01/2025"
              />
              <UserRow
                name="Phạm Thị D"
                email="phamthid@example.com"
                role="ADMIN"
                status="ACTIVE"
                createdAt="12/01/2025"
              />
              <UserRow
                name="Hoàng Văn E"
                email="hoangvane@example.com"
                role="PATIENT"
                status="INACTIVE"
                createdAt="11/01/2025"
              />
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">1</span> đến{' '}
            <span className="font-medium">5</span> trong tổng số{' '}
            <span className="font-medium">50</span> kết quả
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

function UserRow({
  name,
  email,
  role,
  status,
  createdAt,
}: {
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}) {
  const roleLabels: Record<string, string> = {
    PATIENT: 'Bệnh nhân',
    DOCTOR: 'Bác sĩ',
    ADMIN: 'Quản trị viên',
  };

  const roleColors: Record<string, string> = {
    PATIENT: 'bg-blue-100 text-blue-800',
    DOCTOR: 'bg-green-100 text-green-800',
    ADMIN: 'bg-red-100 text-red-800',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="bg-primary-100 text-primary-700 flex h-10 w-10 items-center justify-center rounded-full">
            {name.charAt(0)}
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{email}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleColors[role]}`}>
          {roleLabels[role]}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
          {status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{createdAt}</td>
      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
        <button className="text-primary hover:text-primary/80 mr-3">
          <Edit className="h-4 w-4" />
        </button>
        <button className="text-red-600 hover:text-red-800">
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
