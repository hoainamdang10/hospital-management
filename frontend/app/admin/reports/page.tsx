'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Download, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { billingService } from '@/lib/api/billing.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { toast } from 'sonner';

/**
 * Admin Reports Page
 * Route: /admin/reports
 */
export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('THIS_MONTH');

  // Data states
  const [revenueStats, setRevenueStats] = useState({
    total: 0,
    exam: 0,
    lab: 0,
    pharmacy: 0
  });
  const [revenueChartData, setRevenueChartData] = useState<{ label: string, value: number, height: string }[]>([]);
  const [patientStats, setPatientStats] = useState({
    total: 0,
    new: 0,
    returning: 0,
    treatment: 0
  });
  const [topServices, setTopServices] = useState<{ service: string, count: number, revenue: number }[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let fromDate = startOfMonth(now);
      let toDate = endOfMonth(now);

      if (timeRange === 'LAST_7_DAYS') {
        fromDate = subDays(now, 7);
        toDate = now;
      } else if (timeRange === 'LAST_MONTH') {
        fromDate = startOfMonth(subDays(startOfMonth(now), 1));
        toDate = endOfMonth(subDays(startOfMonth(now), 1));
      }

      const fromDateStr = format(fromDate, 'yyyy-MM-dd');
      const toDateStr = format(toDate, 'yyyy-MM-dd');

      // 1. Fetch Revenue Report
      const revenueRes = await billingService.getRevenueReport({
        fromDate: fromDateStr,
        toDate: toDateStr,
        groupBy: 'day'
      });

      // 2. Fetch Appointment Stats
      const apptRes = await appointmentsService.getStatistics({
        startDate: fromDateStr,
        endDate: toDateStr,
        groupBy: 'day'
      });

      // Process Revenue Data
      if (revenueRes && revenueRes.success) {
        const data = revenueRes.data || [];
        const totalRevenue = data.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);

        setRevenueStats({
          total: totalRevenue,
          exam: totalRevenue * 0.4, // Mock breakdown if API doesn't provide details yet
          lab: totalRevenue * 0.3,
          pharmacy: totalRevenue * 0.3
        });

        // Prepare Chart Data
        const days = eachDayOfInterval({ start: fromDate, end: toDate });
        const maxVal = Math.max(...data.map((d: any) => d.totalAmount || 0), 1);

        const chartData = days.map(day => {
          const dayData = data.find((d: any) => isSameDay(new Date(d.date), day));
          const val = dayData ? dayData.totalAmount : 0;
          return {
            label: format(day, 'dd'),
            value: val,
            height: `${(val / maxVal) * 100}%`
          };
        });
        // Limit to last 7-10 items if too many
        setRevenueChartData(chartData.slice(-10));
      }

      // Process Patient/Appt Data
      if (apptRes && apptRes.success) {
        const stats = apptRes.data || {};
        setPatientStats({
          total: stats.totalAppointments || 0,
          new: stats.newPatients || 0,
          returning: (stats.totalAppointments || 0) - (stats.newPatients || 0),
          treatment: stats.activeTreatments || 0
        });
      }

      // Mock Top Services (until API supports it)
      setTopServices([
        { service: "Khám nội khoa", count: 15, revenue: 4500000 },
        { service: "Xét nghiệm máu", count: 12, revenue: 2400000 },
        { service: "Siêu âm tổng quát", count: 8, revenue: 1600000 },
      ]);

    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Không thể tải báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
            <p className="mt-2 text-gray-600">Tổng hợp doanh thu và hoạt động</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-4 rounded-lg border bg-white p-4 shadow-sm">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            className="rounded-lg border border-gray-300 px-4 py-2"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="THIS_MONTH">Tháng này</option>
            <option value="LAST_MONTH">Tháng trước</option>
            <option value="LAST_7_DAYS">7 ngày qua</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Revenue Stats */}
            <div className="grid gap-6 md:grid-cols-4">
              <RevenueCard
                title="Tổng doanh thu"
                value={formatCurrency(revenueStats.total)}
                change="+12%"
                trend="up"
              />
              <RevenueCard
                title="Doanh thu khám bệnh"
                value={formatCurrency(revenueStats.exam)}
                change="+8%"
                trend="up"
              />
              <RevenueCard
                title="Doanh thu xét nghiệm"
                value={formatCurrency(revenueStats.lab)}
                change="+15%"
                trend="up"
              />
              <RevenueCard
                title="Doanh thu thuốc"
                value={formatCurrency(revenueStats.pharmacy)}
                change="+5%"
                trend="up"
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Chart */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Biểu đồ doanh thu (theo ngày)
                </h3>
                <div className="flex h-64 items-end justify-around space-x-2">
                  {revenueChartData.length > 0 ? (
                    revenueChartData.map((item, index) => (
                      <Bar key={index} height={item.height} label={item.label} value={formatCurrency(item.value)} />
                    ))
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Stats */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Thống kê bệnh nhân
                </h3>
                <div className="space-y-4">
                  <StatRow label="Tổng lượt khám" value={patientStats.total.toString()} />
                  <StatRow label="Bệnh nhân mới" value={patientStats.new.toString()} />
                  <StatRow label="Tái khám" value={patientStats.returning.toString()} />
                  <StatRow label="Đang điều trị" value={patientStats.treatment.toString()} />
                </div>
              </div>
            </div>

            {/* Top Services */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Dịch vụ phổ biến
              </h3>
              <div className="space-y-3">
                {topServices.map((svc, idx) => (
                  <ServiceRow
                    key={idx}
                    service={svc.service}
                    count={svc.count}
                    revenue={formatCurrency(svc.revenue)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
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
        <span className="ml-1 text-gray-600">so với kỳ trước</span>
      </div>
    </div>
  );
}

function Bar({ height, label, value }: { height: string; label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center group relative">
      <div
        className="w-full rounded-t bg-primary transition-all hover:opacity-80"
        style={{ height }}
      ></div>
      <span className="mt-2 text-xs text-gray-600">{label}</span>
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 hidden rounded bg-black px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
        {value}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
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
    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
      <div>
        <p className="font-medium text-gray-900">{service}</p>
        <p className="text-sm text-gray-600">{count} lượt</p>
      </div>
      <p className="font-semibold text-primary">{revenue}</p>
    </div>
  );
}
