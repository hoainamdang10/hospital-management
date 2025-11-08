'use client';

import { Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function AdminPasswordPolicyPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chính sách mật khẩu</h1>
            <p className="mt-2 text-gray-600">Cấu hình yêu cầu bảo mật mật khẩu</p>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Lưu thay đổi
          </Button>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center space-x-3">
            <div className="rounded-full bg-primary-100 p-3">
              <Lock className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cấu hình mật khẩu</h3>
              <p className="text-sm text-gray-600">Thiết lập các yêu cầu cho mật khẩu người dùng</p>
            </div>
          </div>

          <div className="space-y-6">
            <PolicyField
              label="Độ dài tối thiểu"
              value="8"
              unit="ký tự"
            />
            <PolicyField
              label="Số ký tự chữ hoa tối thiểu"
              value="1"
              unit="ký tự"
            />
            <PolicyField
              label="Số ký tự số tối thiểu"
              value="1"
              unit="ký tự"
            />
            <PolicyField
              label="Số ký tự đặc biệt tối thiểu"
              value="1"
              unit="ký tự"
            />
            <PolicyField
              label="Thời gian hết hạn mật khẩu"
              value="90"
              unit="ngày"
            />
            <PolicyField
              label="Số lần đăng nhập sai tối đa"
              value="5"
              unit="lần"
            />

            <div className="border-t pt-6">
              <h4 className="mb-4 font-medium text-gray-900">Tùy chọn bổ sung</h4>
              <div className="space-y-3">
                <ToggleOption label="Yêu cầu ký tự đặc biệt" checked={true} />
                <ToggleOption label="Không cho phép mật khẩu phổ biến" checked={true} />
                <ToggleOption label="Không cho phép tái sử dụng 5 mật khẩu gần nhất" checked={true} />
                <ToggleOption label="Yêu cầu đổi mật khẩu lần đầu đăng nhập" checked={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PolicyField({ label, value, unit }: any) {
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="col-span-2 flex items-center space-x-2">
        <input
          type="number"
          defaultValue={value}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-sm text-gray-600">{unit}</span>
      </div>
    </div>
  );
}

function ToggleOption({ label, checked }: any) {
  return (
    <label className="flex items-center space-x-3">
      <input
        type="checkbox"
        defaultChecked={checked}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
