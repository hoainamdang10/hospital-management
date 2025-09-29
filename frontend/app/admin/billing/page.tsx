'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingTable } from '@/components/features/billing/BillingTable';
import { billingApi, Bill, PaymentSummary } from '@/lib/api/billing';
import {
  Receipt,
  Plus,
  TrendingUp,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown,
  PieChart
} from 'lucide-react';

interface BillingStats {
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  overdueBills: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  billsByMonth: { month: string; count: number; revenue: number }[];
  paymentMethods: { method: string; amount: number; count: number }[];
  recentPayments: { date: string; amount: number; method: string }[];
}

function BillingPageContent() {
  const [stats, setStats] = useState<BillingStats>({
    totalBills: 0,
    paidBills: 0,
    pendingBills: 0,
    overdueBills: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    billsByMonth: [],
    paymentMethods: [],
    recentPayments: []
  });
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Fetch statistics and data
  const fetchData = async () => {
    try {
      const [billsResponse, summaryResponse] = await Promise.all([
        billingApi.getAllBills(),
        billingApi.getPaymentSummary()
      ]);

      if (billsResponse.success && billsResponse.data) {
        const bills = billsResponse.data;

        // Calculate statistics
        const totalBills = bills.length;
        const paidBills = bills.filter(b => b.status === 'paid').length;
        const pendingBills = bills.filter(b => b.status === 'pending').length;
        const overdueBills = bills.filter(b => b.status === 'overdue').length;

        const totalRevenue = bills.reduce((sum, b) => sum + b.amount_paid, 0);
        const pendingAmount = bills
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + b.balance_due, 0);
        const overdueAmount = bills
          .filter(b => b.status === 'overdue')
          .reduce((sum, b) => sum + b.balance_due, 0);

        // Bills by month (last 6 months)
        const billsByMonth = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

          const monthBills = bills.filter(b => {
            const billDate = new Date(b.bill_date);
            return billDate.getMonth() === date.getMonth() &&
                   billDate.getFullYear() === date.getFullYear();
          });

          const count = monthBills.length;
          const revenue = monthBills.reduce((sum, b) => sum + b.amount_paid, 0);

          billsByMonth.push({ month: monthName, count, revenue });
        }

        // Mock payment methods data (would come from actual payment records)
        const paymentMethods = [
          { method: 'Credit Card', amount: totalRevenue * 0.45, count: Math.floor(paidBills * 0.45) },
          { method: 'Cash', amount: totalRevenue * 0.25, count: Math.floor(paidBills * 0.25) },
          { method: 'Insurance', amount: totalRevenue * 0.20, count: Math.floor(paidBills * 0.20) },
          { method: 'Bank Transfer', amount: totalRevenue * 0.10, count: Math.floor(paidBills * 0.10) }
        ];

        // Get recent payments from bills data
        const recentPayments = bills
          .filter(bill => bill.status === 'paid')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(bill => ({
            date: new Date(bill.created_at).toLocaleDateString('vi-VN'),
            amount: bill.total_amount,
            method: bill.payment_method || 'Unknown',
          }));

        setStats({
          totalBills,
          paidBills,
          pendingBills,
          overdueBills,
          totalRevenue,
          pendingAmount,
          overdueAmount,
          billsByMonth,
          paymentMethods,
          recentPayments
        });
      }

      if (summaryResponse.success && summaryResponse.data) {
        setPaymentSummary(summaryResponse.data);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
  };

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    // TODO: Open edit modal
  };

  const handleDeleteBill = async (billId: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      try {
        const response = await billingApi.deleteBill(billId);
        if (response.success) {
          fetchData(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    }
  };

  const handleCreateBill = () => {
    // TODO: Open create modal
  };

  const handlePayBill = (bill: Bill) => {
    // TODO: Open payment modal
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-2">
            Manage bills, payments, and financial analytics
          </p>
        </div>
        <Button onClick={handleCreateBill} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Bill
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">${stats.pendingAmount.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-bold text-red-600">${stats.overdueAmount.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold">{stats.totalBills}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Bills</p>
                <p className="text-xl font-bold text-green-600">{stats.paidBills}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pendingBills}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Bills</p>
                <p className="text-xl font-bold text-red-600">{stats.overdueBills}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.billsByMonth.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{item.count} bills</span>
                      <span className="text-sm font-medium text-green-600">${item.revenue.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max((item.revenue / Math.max(...stats.billsByMonth.map(r => r.revenue))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="text-sm font-medium">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${method.amount.toFixed(0)}</p>
                    <p className="text-xs text-gray-600">{method.count} payments</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="bills" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="bills">
          <BillingTable
            onViewBill={handleViewBill}
            onEditBill={handleEditBill}
            onDeleteBill={handleDeleteBill}
            onCreateBill={handleCreateBill}
            onPayBill={handlePayBill}
          />
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">${payment.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{payment.date}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{payment.method}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Bill Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('paid')}>Paid</Badge>
                    </div>
                    <span className="text-sm font-medium">{stats.paidBills} ({((stats.paidBills / stats.totalBills) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('pending')}>Pending</Badge>
                    </div>
                    <span className="text-sm font-medium">{stats.pendingBills} ({((stats.pendingBills / stats.totalBills) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('overdue')}>Overdue</Badge>
                    </div>
                    <span className="text-sm font-medium">{stats.overdueBills} ({((stats.overdueBills / stats.totalBills) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Collection Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Collection Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {((stats.paidBills / stats.totalBills) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Bill Amount</span>
                    <span className="text-lg font-bold">
                      ${stats.totalBills > 0 ? (stats.totalRevenue / stats.totalBills).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Outstanding Balance</span>
                    <span className="text-lg font-bold text-red-600">
                      ${(stats.pendingAmount + stats.overdueAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function BillingPage() {
  return (
    <AdminPageWrapper title="Billing & Payments" activePage="billing">
      <BillingPageContent />
    </AdminPageWrapper>
  );
}
