'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { medicalRecordsApi } from '@/lib/api/medical-records';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import { billingApi } from '@/lib/api/billing';
import {
  FileText,
  Pill,
  Receipt,
  Server,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  Clock,
  Users,
  Calendar
} from 'lucide-react';

interface MicroservicesDashboardStats {
  totalMedicalRecords: number;
  activePrescriptions: number;
  totalRevenue: number;
  pendingBills: number;
  recentRecords: number;
  recentPrescriptions: number;
  recentPayments: number;
  serviceHealth: {
    medicalRecords: 'healthy' | 'unhealthy' | 'unknown';
    prescriptions: 'healthy' | 'unhealthy' | 'unknown';
    billing: 'healthy' | 'unhealthy' | 'unknown';
  };
  monthlyTrends: {
    month: string;
    records: number;
    prescriptions: number;
    revenue: number;
  }[];
}

function MicroservicesDashboardContent() {
  const [stats, setStats] = useState<MicroservicesDashboardStats>({
    totalMedicalRecords: 0,
    activePrescriptions: 0,
    totalRevenue: 0,
    pendingBills: 0,
    recentRecords: 0,
    recentPrescriptions: 0,
    recentPayments: 0,
    serviceHealth: {
      medicalRecords: 'unknown',
      prescriptions: 'unknown',
      billing: 'unknown'
    },
    monthlyTrends: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch dashboard data from microservices
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [medicalRecordsResponse, prescriptionsResponse, billingResponse] = await Promise.all([
        medicalRecordsApi.getAllMedicalRecords().catch(() => ({ success: false, data: null })),
        prescriptionsApi.getAllPrescriptions().catch(() => ({ success: false, data: null })),
        billingApi.getAllBills().catch(() => ({ success: false, data: null }))
      ]);

      // Calculate statistics
      let totalMedicalRecords = 0;
      let recentRecords = 0;
      let medicalRecordsHealth: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';

      if (medicalRecordsResponse.success && medicalRecordsResponse.data) {
        const records = medicalRecordsResponse.data;
        totalMedicalRecords = records.length;

        // Recent records (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        recentRecords = records.filter(r => new Date(r.created_at) >= sevenDaysAgo).length;
        medicalRecordsHealth = 'healthy';
      } else {
        medicalRecordsHealth = 'unhealthy';
      }

      let activePrescriptions = 0;
      let recentPrescriptions = 0;
      let prescriptionsHealth: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';

      if (prescriptionsResponse.success && prescriptionsResponse.data) {
        const prescriptions = prescriptionsResponse.data;
        activePrescriptions = prescriptions.filter(p => p.status === 'pending' || p.status === 'dispensed').length;

        // Recent prescriptions (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        recentPrescriptions = prescriptions.filter(p => new Date(p.created_at) >= sevenDaysAgo).length;
        prescriptionsHealth = 'healthy';
      } else {
        prescriptionsHealth = 'unhealthy';
      }

      let totalRevenue = 0;
      let pendingBills = 0;
      let recentPayments = 0;
      let billingHealth: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';

      if (billingResponse.success && billingResponse.data) {
        const bills = billingResponse.data;
        totalRevenue = bills.reduce((sum, b) => sum + b.amount_paid, 0);
        pendingBills = bills.filter(b => b.status === 'pending').length;

        // Recent payments (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        recentPayments = bills.filter(b =>
          b.amount_paid > 0 && new Date(b.updated_at) >= sevenDaysAgo
        ).length;
        billingHealth = 'healthy';
      } else {
        billingHealth = 'unhealthy';
      }

      // Generate monthly trends from real data (last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Calculate real trends from actual data
        const monthRecords = medicalRecordsResponse.success && medicalRecordsResponse.data
          ? medicalRecordsResponse.data.filter((record: any) => {
              const recordDate = new Date(record.created_at);
              return recordDate >= monthStart && recordDate <= monthEnd;
            }).length
          : 0;

        const monthPrescriptions = prescriptionsResponse.success && prescriptionsResponse.data
          ? prescriptionsResponse.data.filter((prescription: any) => {
              const prescriptionDate = new Date(prescription.created_at);
              return prescriptionDate >= monthStart && prescriptionDate <= monthEnd;
            }).length
          : 0;

        const monthRevenue = billingResponse.success && billingResponse.data
          ? billingResponse.data
              .filter((bill: any) => {
                const billDate = new Date(bill.created_at);
                return billDate >= monthStart && billDate <= monthEnd && bill.status === 'paid';
              })
              .reduce((sum: number, bill: any) => sum + (bill.total_amount || 0), 0)
          : 0;

        monthlyTrends.push({
          month: monthName,
          records: monthRecords,
          prescriptions: monthPrescriptions,
          revenue: monthRevenue
        });
      }

      setStats({
        totalMedicalRecords,
        activePrescriptions,
        totalRevenue,
        pendingBills,
        recentRecords,
        recentPrescriptions,
        recentPayments,
        serviceHealth: {
          medicalRecords: medicalRecordsHealth,
          prescriptions: prescriptionsHealth,
          billing: billingHealth
        },
        monthlyTrends
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'default';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Microservices Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time analytics from hospital management microservices
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Microservices Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Microservices Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Medical Records Service</h3>
                  <p className="text-sm text-gray-600">Port 3006</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getHealthIcon(stats.serviceHealth.medicalRecords)}
                <Badge variant={getHealthBadgeVariant(stats.serviceHealth.medicalRecords)}>
                  {stats.serviceHealth.medicalRecords}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Pill className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Prescription Service</h3>
                  <p className="text-sm text-gray-600">Port 3007</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getHealthIcon(stats.serviceHealth.prescriptions)}
                <Badge variant={getHealthBadgeVariant(stats.serviceHealth.prescriptions)}>
                  {stats.serviceHealth.prescriptions}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Billing Service</h3>
                  <p className="text-sm text-gray-600">Port 3008</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getHealthIcon(stats.serviceHealth.billing)}
                <Badge variant={getHealthBadgeVariant(stats.serviceHealth.billing)}>
                  {stats.serviceHealth.billing}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medical Records</p>
                <p className="text-2xl font-bold">{stats.totalMedicalRecords}</p>
                <p className="text-xs text-green-600">+{stats.recentRecords} this week</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Prescriptions</p>
                <p className="text-2xl font-bold">{stats.activePrescriptions}</p>
                <p className="text-xs text-green-600">+{stats.recentPrescriptions} this week</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Pill className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-green-600">{stats.recentPayments} payments this week</p>
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
                <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                <p className="text-2xl font-bold">{stats.pendingBills}</p>
                <p className="text-xs text-yellow-600">Awaiting payment</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Receipt className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Trends (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stats.monthlyTrends.map((trend, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{trend.month}</span>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-blue-600">{trend.records} records</span>
                    <span className="text-green-600">{trend.prescriptions} prescriptions</span>
                    <span className="text-purple-600">${trend.revenue} revenue</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max((trend.records / Math.max(...stats.monthlyTrends.map(t => t.records))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max((trend.prescriptions / Math.max(...stats.monthlyTrends.map(t => t.prescriptions))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max((trend.revenue / Math.max(...stats.monthlyTrends.map(t => t.revenue))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View All Records
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Patient Records
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Lab Results
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prescriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Pill className="h-4 w-4 mr-2" />
              View Prescriptions
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Pending Orders
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Dispensed Today
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Receipt className="h-4 w-4 mr-2" />
              View All Bills
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Pending Payments
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Revenue Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MicroservicesDashboardPage() {
  return (
    <AdminPageWrapper
      title="Microservices Dashboard"
      activePage="microservices-dashboard"
      subtitle="Monitor and manage hospital microservices"
    >
      <MicroservicesDashboardContent />
    </AdminPageWrapper>
  );
}
