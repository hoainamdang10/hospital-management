'use client';

import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Admin Audit Logs Page
 * Route: /admin/audit-logs
 */
export default function AdminAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nhật ký hệ thống</h1>
            <p className="mt-2 text-gray-600">Theo dõi tất cả hoạt động trong hệ thống</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Xuất nhật ký
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhật ký..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả hành động</option>
            <option>Đăng nhập</option>
            <option>Tạo</option>
            <option>Cập nhật</option>
            <option>Xóa</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Tất cả người dùng</option>
            <option>Admin</option>
            <option>Doctor</option>
            <option>Nurse</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Hôm nay</option>
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
          </select>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Hành động
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <LogRow
                time="15/01/2025 09:30:45"
                user="admin@hospital.com"
                action="LOGIN"
                description="Đăng nhập thành công"
                ip="192.168.1.100"
                actionType="success"
              />
              <LogRow
                time="15/01/2025 09:25:12"
                user="doctor@hospital.com"
                action="UPDATE"
                description="Cập nhật hồ sơ bệnh nhân BN-2025-001"
                ip="192.168.1.101"
                actionType="info"
              />
              <LogRow
                time="15/01/2025 09:20:33"
                user="nurse@hospital.com"
                action="CREATE"
                description="Tạo lịch hẹn mới cho bệnh nhân"
                ip="192.168.1.102"
                actionType="info"
              />
              <LogRow
                time="15/01/2025 09:15:21"
                user="admin@hospital.com"
                action="DELETE"
                description="Xóa người dùng user@example.com"
                ip="192.168.1.100"
                actionType="warning"
              />
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">20</span> trong tổng số{' '}
            <span className="font-medium">5,432</span> kết quả
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

function LogRow({
  time,
  user,
  action,
  description,
  ip,
  actionType,
}: {
  time: string;
  user: string;
  action: string;
  description: string;
  ip: string;
  actionType: string;
}) {
  const actionColors: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-orange-100 text-orange-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{time}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{user}</td>
      <td className="whitespace-nowrap px-6 py-4">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${actionColors[actionType]}`}>
          {action}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{description}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{ip}</td>
    </tr>
  );
}
