'use client';

import { CreditCard, Download, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Patient Billing Page
 * Route: /patient/billing
 */
export default function PatientBillingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
          <p className="mt-2 text-gray-600">Quản lý hóa đơn và thanh toán</p>
        </div>

        {/* Summary */}
        <div className="grid gap-6 md:grid-cols-3">
          <SummaryCard
            title="Tổng chi phí"
            value="2,500,000 VNĐ"
            icon={CreditCard}
            color="blue"
          />
          <SummaryCard
            title="Chưa thanh toán"
            value="500,000 VNĐ"
            icon={Clock}
            color="orange"
          />
          <SummaryCard
            title="Đã thanh toán"
            value="2,000,000 VNĐ"
            icon={CheckCircle}
            color="green"
          />
        </div>

        {/* Pending Invoices */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Hóa đơn chưa thanh toán
          </h2>
          <div className="space-y-4">
            <InvoiceCard
              invoiceNumber="INV-2025-001"
              date="15/01/2025"
              description="Khám bệnh + Đơn thuốc"
              amount="500,000"
              status="pending"
            />
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Lịch sử thanh toán
          </h2>
          <div className="space-y-4">
            <InvoiceCard
              invoiceNumber="INV-2024-012"
              date="10/12/2024"
              description="Khám bệnh + Xét nghiệm"
              amount="800,000"
              status="paid"
            />
            <InvoiceCard
              invoiceNumber="INV-2024-011"
              date="05/11/2024"
              description="Khám bệnh"
              amount="200,000"
              status="paid"
            />
            <InvoiceCard
              invoiceNumber="INV-2024-010"
              date="20/10/2024"
              description="Khám bệnh + Chụp CT"
              amount="1,000,000"
              status="paid"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
  }[color];

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({
  invoiceNumber,
  date,
  description,
  amount,
  status,
}: {
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  status: string;
}) {
  const isPaid = status === 'paid';

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center space-x-4">
        <div className={`rounded-full p-3 ${isPaid ? 'bg-green-100' : 'bg-orange-100'}`}>
          {isPaid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Clock className="h-5 w-5 text-orange-600" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{invoiceNumber}</p>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{amount} VNĐ</p>
          <span
            className={`text-xs font-medium ${
              isPaid ? 'text-green-600' : 'text-orange-600'
            }`}
          >
            {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </span>
        </div>
        <div className="flex space-x-2">
          {!isPaid && (
            <Button size="sm">Thanh toán</Button>
          )}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
