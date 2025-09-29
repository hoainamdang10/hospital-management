'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast-provider';
import { doctorsApi } from '@/lib/api/doctors';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  Clock,
  DollarSign,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface DoctorStats {
  total_patients: number;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  success_rate: number;
  average_consultation_time: number;
  total_revenue: number;
  monthly_revenue: number;
  patient_satisfaction: number;
  weekly_data: number[];
  monthly_data: number[];
  recent_trends: {
    appointments_trend: number;
    revenue_trend: number;
    satisfaction_trend: number;
  };
}

interface EnhancedStatisticsProps {
  doctorId: string;
}

export default function EnhancedStatistics({ doctorId }: EnhancedStatisticsProps) {
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [doctorId, period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await doctorsApi.getStats(doctorId);
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thống kê",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không có dữ liệu thống kê</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Thống kê nâng cao</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Phân tích hiệu suất và xu hướng hoạt động
                </p>
              </div>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Tuần</SelectItem>
                <SelectItem value="month">Tháng</SelectItem>
                <SelectItem value="quarter">Quý</SelectItem>
                <SelectItem value="year">Năm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Tổng bệnh nhân</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total_patients}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(stats.recent_trends?.appointments_trend || 0)}
                  <span className={`text-xs ${getTrendColor(stats.recent_trends?.appointments_trend || 0)}`}>
                    {Math.abs(stats.recent_trends?.appointments_trend || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Tỷ lệ thành công</p>
                <p className="text-2xl font-bold text-green-900">{formatPercentage(stats.success_rate)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Xuất sắc</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Doanh thu tháng</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(stats.monthly_revenue || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(stats.recent_trends?.revenue_trend || 0)}
                  <span className={`text-xs ${getTrendColor(stats.recent_trends?.revenue_trend || 0)}`}>
                    {Math.abs(stats.recent_trends?.revenue_trend || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Thời gian khám TB</p>
                <p className="text-2xl font-bold text-orange-900">{stats.average_consultation_time}p</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-orange-600" />
                  <span className="text-xs text-orange-600">Hiệu quả</span>
                </div>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Thống kê cuộc hẹn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{stats.total_appointments}</div>
              <div className="text-sm text-blue-700">Tổng cuộc hẹn</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{stats.completed_appointments}</div>
              <div className="text-sm text-green-700">Hoàn thành</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-900">{stats.cancelled_appointments}</div>
              <div className="text-sm text-red-700">Đã hủy</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">{stats.no_show_appointments}</div>
              <div className="text-sm text-yellow-700">Không đến</div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tỷ lệ hoàn thành</span>
              <span className="text-sm text-gray-600">
                {((stats.completed_appointments / stats.total_appointments) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${(stats.completed_appointments / stats.total_appointments) * 100}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Hoạt động trong tuần
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => {
              const value = stats.weekly_data?.[index] || 0;
              const maxValue = Math.max(...(stats.weekly_data || [1]));
              const height = (value / maxValue) * 100;
              
              return (
                <div key={day} className="text-center">
                  <div className="text-xs text-gray-500 mb-2">{day}</div>
                  <div className="relative h-20 bg-gray-100 rounded">
                    <div 
                      className="absolute bottom-0 w-full bg-blue-500 rounded transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium mt-1">{value}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Chỉ số hiệu suất
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Độ hài lòng bệnh nhân</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${stats.patient_satisfaction || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{formatPercentage(stats.patient_satisfaction || 0)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hiệu quả thời gian</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((30 / stats.average_consultation_time) * 100, 100)}%` }}
                  />
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats.average_consultation_time < 30 ? 'Tốt' : 'Bình thường'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tỷ lệ thành công</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${stats.success_rate}%` }}
                  />
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats.success_rate > 90 ? 'Xuất sắc' : stats.success_rate > 80 ? 'Tốt' : 'Cần cải thiện'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tóm tắt doanh thu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(stats.total_revenue)}
              </div>
              <div className="text-sm text-gray-600">Tổng doanh thu</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(stats.monthly_revenue || 0)}
              </div>
              <div className="text-sm text-gray-600">Doanh thu tháng</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency((stats.monthly_revenue || 0) / (stats.completed_appointments || 1))}
              </div>
              <div className="text-sm text-gray-600">TB/cuộc hẹn</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
