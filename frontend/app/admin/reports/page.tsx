'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon, 
  Users, 
  Activity, 
  Shield, 
  Database,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Filter,
  Search,
  PieChart,
  LineChart
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReportData {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'users' | 'security' | 'departments' | 'audit';
  type: 'chart' | 'table' | 'summary';
  data: any[];
  generated_at: string;
  parameters: Record<string, any>;
}

interface SystemMetrics {
  total_users: number;
  active_users_today: number;
  total_departments: number;
  total_sessions: number;
  system_uptime: number;
  database_size: string;
  storage_used: number;
  api_requests_today: number;
}

const REPORT_CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: BarChart3 },
  { id: 'system', name: 'Hệ thống', icon: Database },
  { id: 'users', name: 'Người dùng', icon: Users },
  { id: 'security', name: 'Bảo mật', icon: Shield },
  { id: 'departments', name: 'Khoa/Phòng', icon: Activity },
  { id: 'audit', name: 'Kiểm toán', icon: FileText }
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });

  useEffect(() => {
    fetchReports();
    fetchSystemMetrics();
  }, [selectedCategory, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory,
        from: dateRange.from?.toISOString() || '',
        to: dateRange.to?.toISOString() || ''
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/admin/reports/system-metrics');
      const data = await response.json();
      setSystemMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  const generateReport = async (reportType: string, parameters: any = {}) => {
    try {
      setGenerating(true);
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          parameters: {
            ...parameters,
            dateRange
          }
        })
      });

      if (response.ok) {
        await fetchReports();
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (reportId: string, format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/export?format=${format}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}-${format}.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const renderChart = (report: ReportData) => {
    return (
      <div className="space-y-2">
        {report.data.slice(0, 10).map((item, index) => (
          <div key={index} className="flex justify-between items-center p-2 border rounded">
            <span>{item.name || item.label}</span>
            <Badge variant="outline">{item.value || item.count}</Badge>
          </div>
        ))}
      </div>
    );
  };

  const filteredReports = reports.filter(report => 
    selectedCategory === 'all' || report.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
            Báo cáo Hệ thống
          </h1>
          <p className="text-gray-600">
            Tạo và quản lý báo cáo tổng hợp về hoạt động hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button 
            onClick={() => generateReport('comprehensive_system_report')}
            disabled={generating}
          >
            <FileText className="h-4 w-4 mr-2" />
            {generating ? 'Đang tạo...' : 'Tạo báo cáo'}
          </Button>
        </div>
      </div>

      {/* System Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics?.active_users_today || 0} hoạt động hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khoa/Phòng</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.total_departments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phiên hoạt động</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.total_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Đang trực tuyến
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Database className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.api_requests_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Hôm nay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Tạo báo cáo nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col"
              onClick={() => generateReport('user_activity_report')}
              disabled={generating}
            >
              <Users className="h-6 w-6 mb-2" />
              <span>Hoạt động Người dùng</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col"
              onClick={() => generateReport('security_summary_report')}
              disabled={generating}
            >
              <Shield className="h-6 w-6 mb-2" />
              <span>Tổng hợp Bảo mật</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col"
              onClick={() => generateReport('department_utilization_report')}
              disabled={generating}
            >
              <Activity className="h-6 w-6 mb-2" />
              <span>Sử dụng Khoa/Phòng</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col"
              onClick={() => generateReport('system_performance_report')}
              disabled={generating}
            >
              <Database className="h-6 w-6 mb-2" />
              <span>Hiệu suất Hệ thống</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
