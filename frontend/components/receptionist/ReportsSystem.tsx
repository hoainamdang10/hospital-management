'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface DailyStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalCheckIns: number;
  averageWaitTime: number;
  busyHours: { hour: string; count: number }[];
  departmentStats: { specialty: string; count: number }[];
}

interface WeeklyStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalCheckIns: number;
  dailyBreakdown: { date: string; total: number; completed: number; cancelled: number }[];
  specialtyStats: { specialty: string; count: number }[];
}

interface PatientFlowData {
  hourlyFlow: { hour: string; count: number }[];
  peakHours: string[];
  totalPatients: number;
}

export function ReportsSystem() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'patient-flow'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [patientFlow, setPatientFlow] = useState<PatientFlowData | null>(null);

  // Mock data
  const mockDailyStats: DailyStats = {
    totalAppointments: 45,
    completedAppointments: 38,
    cancelledAppointments: 5,
    noShowAppointments: 2,
    totalCheckIns: 43,
    averageWaitTime: 18,
    busyHours: [
      { hour: '09:00', count: 12 },
      { hour: '10:00', count: 15 },
      { hour: '14:00', count: 10 },
      { hour: '15:00', count: 8 }
    ],
    departmentStats: [
      { specialty: 'Nội khoa', count: 15 },
      { specialty: 'Ngoại khoa', count: 12 },
      { specialty: 'Sản phụ khoa', count: 8 },
      { specialty: 'Nhi khoa', count: 10 }
    ]
  };

  const mockWeeklyStats: WeeklyStats = {
    totalAppointments: 315,
    completedAppointments: 280,
    cancelledAppointments: 25,
    totalCheckIns: 290,
    dailyBreakdown: [
      { date: '2025-01-06', total: 45, completed: 40, cancelled: 3 },
      { date: '2025-01-07', total: 48, completed: 42, cancelled: 4 },
      { date: '2025-01-08', total: 52, completed: 48, cancelled: 2 },
      { date: '2025-01-09', total: 45, completed: 38, cancelled: 5 },
      { date: '2025-01-10', total: 50, completed: 45, cancelled: 3 }
    ],
    specialtyStats: [
      { specialty: 'Nội khoa', count: 85 },
      { specialty: 'Ngoại khoa', count: 72 },
      { specialty: 'Sản phụ khoa', count: 58 },
      { specialty: 'Nhi khoa', count: 65 }
    ]
  };

  const mockPatientFlow: PatientFlowData = {
    hourlyFlow: [
      { hour: '08:00', count: 5 },
      { hour: '09:00', count: 12 },
      { hour: '10:00', count: 15 },
      { hour: '11:00', count: 8 },
      { hour: '14:00', count: 10 },
      { hour: '15:00', count: 8 },
      { hour: '16:00', count: 6 }
    ],
    peakHours: ['09:00', '10:00', '14:00'],
    totalPatients: 64
  };

  useEffect(() => {
    loadReport();
  }, [reportType, selectedDate, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (reportType) {
        case 'daily':
          setDailyStats(mockDailyStats);
          break;
        case 'weekly':
          setWeeklyStats(mockWeeklyStats);
          break;
        case 'patient-flow':
          setPatientFlow(mockPatientFlow);
          break;
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      if (!reportData) {
        toast.error('Không có dữ liệu báo cáo để xuất');
        return;
      }

      const reportContent = generateReportHTML(reportData, reportType);
      const blob = new Blob([reportContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName = `bao-cao-${reportType}-${selectedDate || startDate}-${new Date().toISOString().split('T')[0]}.html`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Báo cáo đã được xuất thành công!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Lỗi khi xuất báo cáo');
    }
  };

  const generateReportHTML = (data: any, type: string): string => {
    const reportTitle = getReportTitle(type);
    const currentDate = new Date().toLocaleDateString('vi-VN');
    const currentTime = new Date().toLocaleTimeString('vi-VN');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${reportTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #0066cc; }
        .stat-label { font-size: 14px; color: #666; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${reportTitle}</h1>
        <p><strong>Ngày báo cáo:</strong> ${selectedDate || `${startDate} - ${endDate}`}</p>
        <p><strong>Ngày xuất:</strong> ${currentDate} ${currentTime}</p>
    </div>

    <div class="section">
        <h2>Thống kê tổng quan</h2>
        <div class="stats">
            ${generateStatsHTML(data)}
        </div>
    </div>

    <div class="section">
        <h2>Chi tiết dữ liệu</h2>
        ${generateDataTableHTML(data, type)}
    </div>

    <div class="footer">
        <p>Báo cáo được tạo tự động từ Hệ thống Quản lý Bệnh viện</p>
        <p>Người tạo: Lễ tân | Thời gian: ${currentDate} ${currentTime}</p>
    </div>
</body>
</html>
    `;
  };

  const getReportTitle = (type: string): string => {
    const titles: { [key: string]: string } = {
      'daily': 'Báo cáo Hoạt động Hàng ngày',
      'weekly': 'Báo cáo Hoạt động Hàng tuần',
      'monthly': 'Báo cáo Hoạt động Hàng tháng',
      'patient-flow': 'Báo cáo Luồng Bệnh nhân',
      'appointment-summary': 'Báo cáo Tổng hợp Lịch hẹn'
    };
    return titles[type] || 'Báo cáo Hệ thống';
  };

  const generateStatsHTML = (data: any): string => {
    if (!data) return '<p>Không có dữ liệu thống kê</p>';

    return `
      <div class="stat-card">
        <div class="stat-number">${data.totalAppointments || 0}</div>
        <div class="stat-label">Tổng lịch hẹn</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.completedAppointments || 0}</div>
        <div class="stat-label">Đã hoàn thành</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.cancelledAppointments || 0}</div>
        <div class="stat-label">Đã hủy</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.newPatients || 0}</div>
        <div class="stat-label">Bệnh nhân mới</div>
      </div>
    `;
  };

  const generateDataTableHTML = (data: any, type: string): string => {
    if (!data || !data.appointments) return '<p>Không có dữ liệu chi tiết</p>';

    const appointments = data.appointments || [];
    const rows = appointments.map((apt: any) => `
      <tr>
        <td>${apt.appointment_id || 'N/A'}</td>
        <td>${apt.patient_name || 'N/A'}</td>
        <td>${apt.doctor_name || 'N/A'}</td>
        <td>${apt.appointment_time || 'N/A'}</td>
        <td>${apt.status || 'N/A'}</td>
      </tr>
    `).join('');

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Mã lịch hẹn</th>
            <th>Bệnh nhân</th>
            <th>Bác sĩ</th>
            <th>Thời gian</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  };

  const renderDailyReport = () => {
    if (!dailyStats) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Tổng lịch hẹn</p>
                  <p className="text-2xl font-bold">{dailyStats.totalAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Đã check-in</p>
                  <p className="text-2xl font-bold">{dailyStats.totalCheckIns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                  <p className="text-2xl font-bold">{dailyStats.completedAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Thời gian chờ TB</p>
                  <p className="text-2xl font-bold">{dailyStats.averageWaitTime}p</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busy Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Giờ cao điểm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyStats.busyHours.map((hour, index) => (
                <div key={hour.hour} className="flex justify-between items-center">
                  <span>{hour.hour}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(hour.count / 15) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{hour.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo khoa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyStats.departmentStats.map((dept) => (
                <div key={dept.specialty} className="flex justify-between items-center">
                  <span>{dept.specialty}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(dept.count / 15) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWeeklyReport = () => {
    if (!weeklyStats) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Tổng lịch hẹn</p>
                  <p className="text-2xl font-bold">{weeklyStats.totalAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                  <p className="text-2xl font-bold">{weeklyStats.completedAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="text-2xl font-bold">{weeklyStats.totalCheckIns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Hủy</p>
                  <p className="text-2xl font-bold">{weeklyStats.cancelledAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weeklyStats.dailyBreakdown.map((day) => (
                <div key={day.date} className="grid grid-cols-4 gap-4 p-2 border rounded">
                  <span className="font-medium">{day.date}</span>
                  <span>Tổng: {day.total}</span>
                  <span className="text-green-600">Hoàn thành: {day.completed}</span>
                  <span className="text-red-600">Hủy: {day.cancelled}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPatientFlowReport = () => {
    if (!patientFlow) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Tổng số bệnh nhân</p>
              <p className="text-3xl font-bold">{patientFlow.totalPatients}</p>
              <p className="text-sm text-gray-600 mt-2">
                Giờ cao điểm: {patientFlow.peakHours.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Luồng bệnh nhân theo giờ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patientFlow.hourlyFlow.map((hour) => (
                <div key={hour.hour} className="flex justify-between items-center">
                  <span>{hour.hour}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-40 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          patientFlow.peakHours.includes(hour.hour) 
                            ? 'bg-red-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${(hour.count / 15) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{hour.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Báo cáo hoạt động
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Loại báo cáo</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Báo cáo ngày</SelectItem>
                  <SelectItem value="weekly">Báo cáo tuần</SelectItem>
                  <SelectItem value="patient-flow">Luồng bệnh nhân</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'daily' || reportType === 'patient-flow' ? (
              <div>
                <Label>Ngày</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div>
                  <Label>Từ ngày</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Đến ngày</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={handleExportReport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Đang tải báo cáo...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {reportType === 'daily' && renderDailyReport()}
          {reportType === 'weekly' && renderWeeklyReport()}
          {reportType === 'patient-flow' && renderPatientFlowReport()}
        </>
      )}
    </div>
  );
}
