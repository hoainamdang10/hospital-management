'use client';

import { TrendingUp, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Admin Reports Page
 * Route: /admin/reports
 */
export default function AdminReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
            <p className="mt-2 text-gray-600">Tổng hợp doanh thu và hoạt động</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-4 rounded-lg border bg-white p-4 shadow-sm">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select className="rounded-lg border border-gray-300 px-4 py-2">
            <option>Hôm nay</option>
            <option>Tuần này</option>
            <option>Tháng này</option>
            <option>Quý này</option>
            <option>Năm nay</option>
          </select>
          <span className="text-sm text-gray-600">15/01/2025 - 15/01/2025</span>
        </div>

        {/* Revenue Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <RevenueCard
            title="Tổng doanh thu"
            value="450,000,000 VNĐ"
            change="+12%"
            trend="up"
          />
          <RevenueCard
            title="Doanh thu khám bệnh"
            value="280,000,000 VNĐ"
            change="+8%"
            trend="up"
          />
          <RevenueCard
            title="Doanh thu xét nghiệm"
            value="120,000,000 VNĐ"
            change="+15%"
            trend="up"
          />
          <RevenueCard
            title="Doanh thu thuốc"
            value="50,000,000 VNĐ"
            change="+5%"
            trend="up"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Biểu đồ doanh thu
            </h3>
            <div className="flex h-64 items-end justify-around space-x-2">
              <Bar height="40%" label="T1" />
              <Bar height="55%" label="T2" />
              <Bar height="45%" label="T3" />
              <Bar height="70%" label="T4" />
              <Bar height="60%" label="T5" />
              <Bar height="80%" label="T6" />
              <Bar height="75%" label="T7" />
            </div>
          </div>

          {/* Patient Stats */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Thống kê bệnh nhân
            </h3>
            <div className="space-y-4">
              <StatRow label="Tổng bệnh nhân" value="1,234" />
              <StatRow label="Bệnh nhân mới" value="156" />
              <StatRow label="Tái khám" value="890" />
              <StatRow label="Đang điều trị" value="45" />
            </div>
          </div>
        </div>

        {/* Top Services */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Dịch vụ phổ biến
          </h3>
          <div className="space-y-3">
            <ServiceRow service="Khám nội khoa" count={450} revenue="90,000,000" />
            <ServiceRow service="Xét nghiệm máu" count={320} revenue="64,000,000" />
            <ServiceRow service="Chụp X-quang" count={180} revenue="36,000,000" />
            <ServiceRow service="Siêu âm" count={150} revenue="45,000,000" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function RevenueCard({
  title,
  value,
  change,
  trend,
}: {
  title: string;
  value: string;
  change: string;
  trend: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <div className="mt-2 flex items-center text-sm">
        <TrendingUp className={`mr-1 h-4 w-4 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
        <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>{change}</span>
        <span className="ml-1 text-gray-600">so với tháng trước</span>
      </div>
    </div>
  );
}

function Bar({ height, label }: { height: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div
        className="w-full rounded-t bg-primary"
        style={{ height }}
      ></div>
      <span className="mt-2 text-xs text-gray-600">{label}</span>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function ServiceRow({
  service,
  count,
  revenue,
}: {
  service: string;
  count: number;
  revenue: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="font-medium text-gray-900">{service}</p>
        <p className="text-sm text-gray-600">{count} lượt</p>
      </div>
      <p className="font-semibold text-primary">{revenue} VNĐ</p>
    </div>
  );
}
