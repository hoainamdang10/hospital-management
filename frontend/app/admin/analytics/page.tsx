'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  Target,
  Award,
  Zap,
  Heart,
  Shield,
  Download,
  RefreshCw,
  Filter,
  Eye,
  PieChart,
  LineChart,
  BarChart,
  FileText,
  Star,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    totalRevenue: number;
    patientGrowth: number;
    doctorGrowth: number;
    appointmentGrowth: number;
    revenueGrowth: number;
  };
  appointments: {
    completed: number;
    cancelled: number;
    pending: number;
    noShow: number;
    completionRate: number;
    averageDuration: number;
    peakHours: { hour: number; count: number }[];
    byDepartment: { department: string; count: number }[];
  };
  patients: {
    newPatients: number;
    returningPatients: number;
    ageGroups: { group: string; count: number }[];
    genderDistribution: { male: number; female: number; other: number };
    satisfactionScore: number;
    averageWaitTime: number;
  };
  doctors: {
    totalDoctors: number;
    averageRating: number;
    averageExperience: number;
    specialtyDistribution: { specialty: string; count: number }[];
    performanceMetrics: { doctorId: string; name: string; rating: number; appointments: number }[];
  };
  financial: {
    totalRevenue: number;
    monthlyRevenue: { month: string; revenue: number }[];
    revenueByService: { service: string; revenue: number }[];
    paymentMethods: { method: string; percentage: number }[];
    outstandingPayments: number;
  };
  system: {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
    systemLoad: number;
    databasePerformance: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Mock data
  const mockData: AnalyticsData = {
    overview: {
      totalPatients: 2847,
      totalDoctors: 156,
      totalAppointments: 8934,
      totalRevenue: 2450000000,
      patientGrowth: 12.5,
      doctorGrowth: 8.3,
      appointmentGrowth: 15.7,
      revenueGrowth: 18.2
    },
    appointments: {
      completed: 7234,
      cancelled: 892,
      pending: 456,
      noShow: 352,
      completionRate: 81.0,
      averageDuration: 45,
      peakHours: [
        { hour: 9, count: 234 },
        { hour: 10, count: 312 },
        { hour: 11, count: 289 },
        { hour: 14, count: 267 },
        { hour: 15, count: 298 }
      ],
      byDepartment: [
        { department: 'Nội khoa', count: 1234 },
        { department: 'Ngoại khoa', count: 987 },
        { department: 'Tim mạch', count: 756 },
        { department: 'Nhi khoa', count: 654 },
        { department: 'Da liễu', count: 432 }
      ]
    },
    patients: {
      newPatients: 1247,
      returningPatients: 1600,
      ageGroups: [
        { group: '0-18', count: 456 },
        { group: '19-35', count: 789 },
        { group: '36-50', count: 892 },
        { group: '51-65', count: 567 },
        { group: '65+', count: 143 }
      ],
      genderDistribution: { male: 1389, female: 1458, other: 0 },
      satisfactionScore: 4.6,
      averageWaitTime: 23
    },
    doctors: {
      totalDoctors: 156,
      averageRating: 4.7,
      averageExperience: 12.3,
      specialtyDistribution: [
        { specialty: 'Nội khoa', count: 34 },
        { specialty: 'Ngoại khoa', count: 28 },
        { specialty: 'Tim mạch', count: 22 },
        { specialty: 'Nhi khoa', count: 18 },
        { specialty: 'Da liễu', count: 15 }
      ],
      performanceMetrics: [
        { doctorId: 'DOC-001', name: 'BS. Nguyễn Văn A', rating: 4.9, appointments: 234 },
        { doctorId: 'DOC-002', name: 'BS. Trần Thị B', rating: 4.8, appointments: 198 },
        { doctorId: 'DOC-003', name: 'BS. Lê Văn C', rating: 4.7, appointments: 176 }
      ]
    },
    financial: {
      totalRevenue: 2450000000,
      monthlyRevenue: [
        { month: 'Jan', revenue: 180000000 },
        { month: 'Feb', revenue: 195000000 },
        { month: 'Mar', revenue: 210000000 },
        { month: 'Apr', revenue: 225000000 },
        { month: 'May', revenue: 240000000 }
      ],
      revenueByService: [
        { service: 'Khám tổng quát', revenue: 890000000 },
        { service: 'Xét nghiệm', revenue: 456000000 },
        { service: 'Phẫu thuật', revenue: 678000000 },
        { service: 'Điều trị', revenue: 426000000 }
      ],
      paymentMethods: [
        { method: 'Tiền mặt', percentage: 35 },
        { method: 'Thẻ', percentage: 40 },
        { method: 'Chuyển khoản', percentage: 15 },
        { method: 'Bảo hiểm', percentage: 10 }
      ],
      outstandingPayments: 45000000
    },
    system: {
      uptime: 99.8,
      averageResponseTime: 145,
      errorRate: 0.2,
      activeUsers: 234,
      systemLoad: 67,
      databasePerformance: 92
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <AdminPageWrapper
        title="Advanced Analytics"
        activePage="analytics"
        subtitle="Comprehensive insights and data analysis"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading analytics data...</p>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="Advanced Analytics"
      activePage="analytics"
      subtitle="Comprehensive insights and data analysis"
      headerActions={
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Overview Metrics */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-blue-600">{data.overview.totalPatients.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(data.overview.patientGrowth)}
                      <span className={`text-xs ${getGrowthColor(data.overview.patientGrowth)}`}>
                        {data.overview.patientGrowth > 0 ? '+' : ''}{data.overview.patientGrowth}%
                      </span>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Doctors</p>
                    <p className="text-2xl font-bold text-green-600">{data.overview.totalDoctors}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(data.overview.doctorGrowth)}
                      <span className={`text-xs ${getGrowthColor(data.overview.doctorGrowth)}`}>
                        {data.overview.doctorGrowth > 0 ? '+' : ''}{data.overview.doctorGrowth}%
                      </span>
                    </div>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-bold text-purple-600">{data.overview.totalAppointments.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(data.overview.appointmentGrowth)}
                      <span className={`text-xs ${getGrowthColor(data.overview.appointmentGrowth)}`}>
                        {data.overview.appointmentGrowth > 0 ? '+' : ''}{data.overview.appointmentGrowth}%
                      </span>
                    </div>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.overview.totalRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(data.overview.revenueGrowth)}
                      <span className={`text-xs ${getGrowthColor(data.overview.revenueGrowth)}`}>
                        {data.overview.revenueGrowth > 0 ? '+' : ''}{data.overview.revenueGrowth}%
                      </span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Appointments Analytics */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-xl font-bold text-green-600">{data?.appointments.completed.toLocaleString()}</p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cancelled</p>
                      <p className="text-xl font-bold text-red-600">{data?.appointments.cancelled.toLocaleString()}</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-xl font-bold text-blue-600">{data?.appointments.completionRate}%</p>
                    </div>
                    <Target className="h-6 w-6 text-blue-500" />
                  </div>
                  <Progress value={data?.appointments.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Duration</p>
                      <p className="text-xl font-bold text-purple-600">{data?.appointments.averageDuration}min</p>
                    </div>
                    <Clock className="h-6 w-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appointments by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.appointments.byDepartment.map((dept, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{dept.department}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(dept.count / Math.max(...data.appointments.byDepartment.map(d => d.count))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{dept.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.appointments.peakHours.map((hour, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{hour.hour}:00</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${(hour.count / Math.max(...data.appointments.peakHours.map(h => h.count))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{hour.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patients Analytics */}
          <TabsContent value="patients" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">New Patients</p>
                      <p className="text-xl font-bold text-blue-600">{data?.patients.newPatients.toLocaleString()}</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Returning</p>
                      <p className="text-xl font-bold text-green-600">{data?.patients.returningPatients.toLocaleString()}</p>
                    </div>
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Satisfaction</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xl font-bold text-yellow-600">{data?.patients.satisfactionScore}</p>
                        {data && renderStars(data.patients.satisfactionScore)}
                      </div>
                    </div>
                    <Heart className="h-6 w-6 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Wait Time</p>
                      <p className="text-xl font-bold text-orange-600">{data?.patients.averageWaitTime}min</p>
                    </div>
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.patients.ageGroups.map((group, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{group.group} years</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${(group.count / Math.max(...data.patients.ageGroups.map(g => g.count))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{group.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Male</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${data ? (data.patients.genderDistribution.male / (data.patients.genderDistribution.male + data.patients.genderDistribution.female)) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{data?.patients.genderDistribution.male}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Female</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-pink-600 h-2 rounded-full"
                            style={{ width: `${data ? (data.patients.genderDistribution.female / (data.patients.genderDistribution.male + data.patients.genderDistribution.female)) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{data?.patients.genderDistribution.female}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Performance */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">System Uptime</p>
                      <p className="text-xl font-bold text-green-600">{data?.system.uptime}%</p>
                    </div>
                    <Shield className="h-6 w-6 text-green-500" />
                  </div>
                  <Progress value={data?.system.uptime} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Response Time</p>
                      <p className="text-xl font-bold text-blue-600">{data?.system.averageResponseTime}ms</p>
                    </div>
                    <Zap className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className="text-xl font-bold text-red-600">{data?.system.errorRate}%</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageWrapper>
  );
}
