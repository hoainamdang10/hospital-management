'use client';

import { Save, Globe, Bell, Lock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function AdminSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
            <p className="mt-2 text-gray-600">Cấu hình các tham số hệ thống</p>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Lưu thay đổi
          </Button>
        </div>

        <div className="space-y-6">
          <SettingSection
            icon={Globe}
            title="Cài đặt chung"
            description="Cấu hình thông tin cơ bản"
          >
            <SettingField label="Tên bệnh viện" value="Bệnh viện Đa khoa ABC" />
            <SettingField label="Địa chỉ" value="123 Đường ABC, Quận 1, TP.HCM" />
            <SettingField label="Số điện thoại" value="(028) 1234 5678" />
            <SettingField label="Email" value="info@hospital.com" />
          </SettingSection>

          <SettingSection
            icon={Bell}
            title="Thông báo"
            description="Cấu hình thông báo hệ thống"
          >
            <ToggleField label="Email thông báo" checked={true} />
            <ToggleField label="SMS thông báo" checked={true} />
            <ToggleField label="Push notification" checked={false} />
          </SettingSection>

          <SettingSection
            icon={Lock}
            title="Bảo mật"
            description="Cấu hình chính sách bảo mật"
          >
            <SettingField label="Thời gian session (phút)" value="30" type="number" />
            <SettingField label="Độ dài mật khẩu tối thiểu" value="8" type="number" />
            <ToggleField label="Yêu cầu xác thực 2 bước" checked={false} />
            <ToggleField label="Tự động đăng xuất khi không hoạt động" checked={true} />
          </SettingSection>

          <SettingSection
            icon={Database}
            title="Sao lưu dữ liệu"
            description="Cấu hình sao lưu tự động"
          >
            <ToggleField label="Sao lưu tự động" checked={true} />
            <SettingField label="Tần suất sao lưu" value="Hàng ngày" />
            <SettingField label="Thời gian sao lưu" value="02:00 AM" />
          </SettingSection>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SettingSection({ icon: Icon, title, description, children }: any) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center space-x-3">
        <div className="rounded-full bg-primary-100 p-3">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingField({ label, value, type = 'text' }: any) {
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        defaultValue={value}
        className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function ToggleField({ label, checked }: any) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="checkbox"
        defaultChecked={checked}
        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
      />
    </div>
  );
}
