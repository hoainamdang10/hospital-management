'use client';

import { Shield, Plus, Edit, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function AdminRolesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vai trò & Quyền hạn</h1>
            <p className="mt-2 text-gray-600">Quản lý vai trò và phân quyền người dùng</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm vai trò
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RoleCard
            name="Super Admin"
            description="Toàn quyền quản trị hệ thống"
            userCount={2}
            permissions={['Tất cả quyền']}
          />
          <RoleCard
            name="Admin"
            description="Quản trị viên"
            userCount={5}
            permissions={['Quản lý người dùng', 'Xem báo cáo', 'Quản lý cấu hình']}
          />
          <RoleCard
            name="Doctor"
            description="Bác sĩ"
            userCount={45}
            permissions={['Khám bệnh', 'Kê đơn', 'Xem hồ sơ bệnh án']}
          />
          <RoleCard
            name="Nurse"
            description="Y tá"
            userCount={78}
            permissions={['Check-in bệnh nhân', 'Đo sinh hiệu', 'Xem lịch hẹn']}
          />
          <RoleCard
            name="Patient"
            description="Bệnh nhân"
            userCount={1234}
            permissions={['Đặt lịch khám', 'Xem hồ sơ cá nhân', 'Thanh toán']}
          />
          <RoleCard
            name="Receptionist"
            description="Lễ tân"
            userCount={12}
            permissions={['Đăng ký bệnh nhân', 'Quản lý lịch hẹn']}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function RoleCard({ name, description, userCount, permissions }: any) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
          <Shield className="h-6 w-6 text-primary-600" />
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <Edit className="h-5 w-5" />
        </button>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{name}</h3>
      <p className="mb-4 text-sm text-gray-600">{description}</p>
      <div className="mb-4 flex items-center text-sm text-gray-600">
        <Users className="mr-1 h-4 w-4" />
        {userCount} người dùng
      </div>
      <div className="border-t pt-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Quyền hạn:</p>
        <ul className="space-y-1">
          {permissions.slice(0, 3).map((perm: string, i: number) => (
            <li key={i} className="text-sm text-gray-600">• {perm}</li>
          ))}
          {permissions.length > 3 && (
            <li className="text-sm text-primary">+{permissions.length - 3} quyền khác</li>
          )}
        </ul>
      </div>
    </div>
  );
}
