'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Wallet, PieChart as PieChartIcon, TrendingUp, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { billingService } from '@/modules/billing/services/billing.service';
import { subMonths, startOfMonth, format as formatDate } from 'date-fns';

// Mock data for Monthly Spending (Last 6 months)
const SPENDING_DATA = [
  { month: 'T7', amount: 1500000, topup: 2000000 },
  { month: 'T8', amount: 800000, topup: 0 },
  { month: 'T9', amount: 2200000, topup: 3000000 },
  { month: 'T10', amount: 500000, topup: 0 },
  { month: 'T11', amount: 1200000, topup: 1000000 },
  { month: 'T12', amount: 3500000, topup: 5000000 },
];

// Mock data for Service Distribution
const SERVICE_DATA = [
  { name: 'Khám bệnh', value: 4500000, color: '#3b82f6' }, // blue-500
  { name: 'Xét nghiệm', value: 2500000, color: '#8b5cf6' }, // violet-500
  { name: 'Thuốc', value: 1800000, color: '#10b981' }, // emerald-500
  { name: 'Tiểu phẫu', value: 900000, color: '#f59e0b' }, // amber-500
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
        <p className="mb-1 text-xs font-semibold text-gray-500">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}:{' '}
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              entry.value
            )}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface SpendingPoint {
  month: string;
  amount: number;
  topup: number;
}

interface ServicePoint {
  name: string;
  value: number;
  color: string;
}

export function SpendingAnalysisChart({
  variant = 'default',
  patientId,
}: {
  variant?: 'default' | 'minimal';
  patientId?: string;
}) {
  const [activeTab, setActiveTab] = useState<'spending' | 'services'>('spending');
  const [spendingData, setSpendingData] = useState<SpendingPoint[]>(SPENDING_DATA);
  const [serviceData, setServiceData] = useState<ServicePoint[]>(SERVICE_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!patientId) {
        setSpendingData(SPENDING_DATA);
        setServiceData(SERVICE_DATA);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const invoices = await billingService.getPatientInvoices(patientId);
        const { monthly, services } = buildAnalyticsData(invoices);
        setSpendingData(monthly);
        setServiceData(services);
      } catch (error) {
        console.error('[SpendingAnalysisChart] Failed to load invoices:', error);
        setSpendingData(SPENDING_DATA);
        setServiceData(SERVICE_DATA);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [patientId]);

  const ChartContent = () => (
    <>
      {/* Chart Area */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'spending' ? (
            <BarChart
              data={spendingData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={32}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar
                dataKey="amount"
                name="Đã chi tiêu"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="topup"
                name="Nạp vào ví"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                stackId="b"
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ paddingLeft: '20px' }}
                formatter={(value, entry: any) => (
                  <span className="ml-2 text-sm font-medium text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer / Insights */}
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-gray-50 p-3">
        <div className="mt-0.5">
          <CreditCard className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Tổng quan tài chính</p>
          <p className="text-xs text-gray-500">
            {activeTab === 'spending'
              ? 'Tháng 12 bạn đã chi tiêu nhiều hơn trung bình 3 tháng trước do có đợt khám tổng quát.'
              : 'Chi phí khám bệnh chiếm 46% tổng chi tiêu của bạn trong năm nay.'}
          </p>
        </div>
      </div>
    </>
  );

  const ToggleButtons = () => (
    <div className="flex rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => setActiveTab('spending')}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          activeTab === 'spending'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <TrendingUp className="h-4 w-4" />
        Chi tiêu
      </button>
      <button
        onClick={() => setActiveTab('services')}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          activeTab === 'services'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <PieChartIcon className="h-4 w-4" />
        Dịch vụ
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <div className="h-10 w-40 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="h-[280px] animate-pulse rounded-2xl bg-gray-50" />
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="p-6 pt-2">
        {/* Minimal Header with just Tabs */}
        <div className="mb-4 flex justify-end">
          <ToggleButtons />
        </div>
        <ChartContent />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2">
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Phân tích chi tiêu</h2>
            <p className="text-sm text-gray-500">Quản lý ví & dịch vụ</p>
          </div>
        </div>
        <ToggleButtons />
      </div>
      <ChartContent />
    </div>
  );
}

const COLOR_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

function buildAnalyticsData(invoices: any[]): {
  monthly: SpendingPoint[];
  services: ServicePoint[];
} {
  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = subMonths(startOfMonth(new Date()), 5 - index);
    const key = formatDate(date, 'yyyy-MM');
    return { key, label: `T${formatDate(date, 'M')}` };
  });

  const monthlyMap: Record<string, SpendingPoint> = {};
  months.forEach((month) => {
    monthlyMap[month.key] = { month: month.label, amount: 0, topup: 0 };
  });

  const serviceMap = new Map<string, number>();

  invoices.forEach((invoice) => {
    const createdAt =
      invoice.createdAt ||
      invoice.created_at ||
      invoice.issueDate ||
      invoice.issue_date ||
      invoice.issuedAt;
    const createdDate = createdAt ? new Date(createdAt) : null;
    if (createdDate) {
      const monthKey = formatDate(createdDate, 'yyyy-MM');
      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].amount += Number(invoice.totalAmount ?? 0);

        (invoice.payments || []).forEach((payment: any) => {
          if ((payment.method || '').toLowerCase() === 'wallet') {
            monthlyMap[monthKey].topup += Number(payment.amount ?? 0);
          }
        });
      }
    }

    (invoice.items || []).forEach((item: any) => {
      const label = mapServiceLabel(item);
      const value = Number(item.totalPrice ?? item.total_price ?? item.unitPrice ?? 0);
      serviceMap.set(label, (serviceMap.get(label) || 0) + value);
    });
  });

  const monthly = months.map((month) => monthlyMap[month.key]);

  if (serviceMap.size === 0) {
    return {
      monthly,
      services: SERVICE_DATA,
    };
  }

  const serviceEntries = Array.from(serviceMap.entries()).sort((a, b) => b[1] - a[1]);
  const topServices = serviceEntries.slice(0, 4).map(([name, value], index) => ({
    name,
    value,
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  }));

  if (serviceEntries.length > 4) {
    const others = serviceEntries.slice(4).reduce((sum, [, value]) => sum + value, 0);
    topServices.push({
      name: 'Dịch vụ khác',
      value: others,
      color: COLOR_PALETTE[topServices.length % COLOR_PALETTE.length],
    });
  }

  return { monthly, services: topServices };
}

function mapServiceLabel(item: any): string {
  const category =
    item?.category ||
    item?.serviceCode ||
    item?.description ||
    item?.vietnamese_description ||
    'Khác';

  const normalized = category.toString().toUpperCase();
  if (normalized.includes('EXAM') || normalized.includes('CONSULT')) {
    return 'Khám bệnh';
  }
  if (normalized.includes('TEST') || normalized.includes('LAB')) {
    return 'Xét nghiệm';
  }
  if (normalized.includes('MED') || normalized.includes('DRUG')) {
    return 'Thuốc';
  }
  if (normalized.includes('SURGERY') || normalized.includes('PROCEDURE')) {
    return 'Tiểu phẫu';
  }
  return item?.description || 'Dịch vụ khác';
}
