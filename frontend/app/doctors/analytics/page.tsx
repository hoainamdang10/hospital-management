'use client';

import React, { useState } from 'react';
import { RoleBasedLayout } from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  Star,
  DollarSign,
  Activity,
  Heart,
  Stethoscope,
  FileText,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  total_patients: number;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  average_rating: number;
  total_revenue: number;
  average_consultation_time: number;
  patient_satisfaction: number;
}

interface MonthlyData {
  month: string;
  patients: number;
  appointments: number;
  revenue: number;
}

// Mock data
const mockAnalytics: AnalyticsData = {
  period: 'Tháng 1/2024',
  total_patients: 156,
  total_appointments: 234,
  completed_appointments: 198,
  cancelled_appointments: 12,
  average_rating: 4.8,
  total_revenue: 117000000,
  average_consultation_time: 25,
  patient_satisfaction: 94
};

const mockMonthlyData: MonthlyData[] = [
  { month: 'T7', patients: 120, appointments: 180, revenue: 90000000 },
  { month: 'T8', patients: 135, appointments: 205, revenue: 102500000 },
  { month: 'T9', patients: 142, appointments: 218, revenue: 109000000 },
  { month: 'T10', patients: 148, appointments: 225, revenue: 112500000 },
  { month: 'T11', patients: 152, appointments: 230, revenue: 115000000 },
  { month: 'T12', patients: 156, appointments: 234, revenue: 117000000 }
];

const mockTopDiagnoses = [
  { diagnosis: 'Cao huyết áp', count: 45, percentage: 28.8 },
  { diagnosis: 'Tiểu đường type 2', count: 38, percentage: 24.4 },
  { diagnosis: 'Bệnh tim mạch', count: 32, percentage: 20.5 },
  { diagnosis: 'Rối loạn lipid máu', count: 25, percentage: 16.0 },
  { diagnosis: 'Khác', count: 16, percentage: 10.3 }
];

const mockPatientAgeGroups = [
  { age_group: '18-30', count: 25, percentage: 16.0 },
  { age_group: '31-45', count: 48, percentage: 30.8 },
  { age_group: '46-60', count: 52, percentage: 33.3 },
  { age_group: '61+', count: 31, percentage: 19.9 }
];

export default function DoctorAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTab, setSelectedTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return {
      value: Math.abs(change).toFixed(1),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  return (
    <RoleBasedLayout title="Thống kê" activePage="analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Thống kê & Báo cáo</h2>
            <p className="text-gray-600">Phân tích hiệu suất làm việc và xu hướng bệnh nhân</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Tuần này</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="quarter">Quý này</SelectItem>
                <SelectItem value="year">Năm này</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng bệnh nhân</p>
                  <p className="text-3xl font-bold text-gray-900">{mockAnalytics.total_patients}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+12.5%</span>
                    <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cuộc hẹn hoàn thành</p>
                  <p className="text-3xl font-bold text-gray-900">{mockAnalytics.completed_appointments}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+8.2%</span>
                    <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đánh giá trung bình</p>
                  <p className="text-3xl font-bold text-gray-900">{mockAnalytics.average_rating}</p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" />
                    <span className="text-sm text-gray-600">{mockAnalytics.patient_satisfaction}% hài lòng</span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(mockAnalytics.total_revenue)}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+15.3%</span>
                    <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="patients">Bệnh nhân</TabsTrigger>
            <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
            <TabsTrigger value="trends">Xu hướng</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Xu hướng 6 tháng gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMonthlyData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600 w-8">{data.month}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-700">{data.patients} BN</span>
                              <span className="text-gray-700">{data.appointments} cuộc hẹn</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(data.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Diagnoses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Chẩn đoán phổ biến
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockTopDiagnoses.map((item, index) => (
                      <div key={item.diagnosis} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.diagnosis}</p>
                            <p className="text-xs text-gray-500">{item.count} ca</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {item.percentage}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Age Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Phân bố độ tuổi bệnh nhân
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPatientAgeGroups.map((group) => (
                      <div key={group.age_group} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-6 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">{group.age_group} tuổi</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{group.count} người</p>
                          <p className="text-xs text-gray-500">{group.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Patient Satisfaction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Mức độ hài lòng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {mockAnalytics.patient_satisfaction}%
                      </div>
                      <p className="text-sm text-gray-600">Bệnh nhân hài lòng với dịch vụ</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">5 sao</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '68%'}}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">68%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">4 sao</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: '26%'}}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">26%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">3 sao</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '4%'}}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">4%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">≤2 sao</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{width: '2%'}}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">2%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Thời gian khám trung bình
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {mockAnalytics.average_consultation_time} phút
                    </div>
                    <p className="text-sm text-gray-600">Thời gian khám mỗi bệnh nhân</p>
                    <div className="mt-4 flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">-2 phút so với tháng trước</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Tỷ lệ hoàn thành
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {((mockAnalytics.completed_appointments / mockAnalytics.total_appointments) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600">Cuộc hẹn hoàn thành</p>
                    <div className="mt-4 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">+3.2% so với tháng trước</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tỷ lệ hủy hẹn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {((mockAnalytics.cancelled_appointments / mockAnalytics.total_appointments) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600">Cuộc hẹn bị hủy</p>
                    <div className="mt-4 flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">-1.5% so với tháng trước</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng và dự báo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Biểu đồ xu hướng
                  </h3>
                  <p className="text-gray-500">
                    Tính năng này sẽ được phát triển trong phiên bản tiếp theo
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleBasedLayout>
  );
}
