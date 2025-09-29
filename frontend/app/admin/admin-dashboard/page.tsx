'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Shield, 
  Database, 
  BarChart3, 
  Bell, 
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Lock,
  FileText,
  Building2,
  Stethoscope,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminPermissions {
  user_management: boolean;
  security_management: boolean;
  reports_access: boolean;
  data_management: boolean;
  notification_management: boolean;
  system_configuration: boolean;
  audit_logs: boolean;
  department_management: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  permission: keyof AdminPermissions;
  color: string;
  urgent?: boolean;
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !['admin', 'superadmin'].includes(user.role))) {
      router.push('/admin/login');
      return;
    }

    if (user) {
      fetchUserPermissions();
      fetchSystemAlerts();
    }
  }, [user, loading]);

  const fetchUserPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions/check');
      const data = await response.json();
      setPermissions(data.permissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      const response = await fetch('/api/admin/system/alerts');
      const data = await response.json();
      setSystemAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch system alerts:', error);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'user_management',
      title: 'Quản lý Người dùng',
      description: 'Thêm, sửa, xóa tài khoản người dùng',
      icon: Users,
      href: '/admin/user-management',
      permission: 'user_management',
      color: 'bg-blue-500'
    },
    {
      id: 'security_console',
      title: 'Bảo mật Hệ thống',
      description: 'Giám sát và quản lý bảo mật',
      icon: Shield,
      href: '/admin/security-management',
      permission: 'security_management',
      color: 'bg-red-500'
    },
    {
      id: 'reports',
      title: 'Báo cáo Hệ thống',
      description: 'Tạo và xem báo cáo tổng hợp',
      icon: BarChart3,
      href: '/admin/reports',
      permission: 'reports_access',
      color: 'bg-green-500'
    },
    {
      id: 'data_management',
      title: 'Quản lý Dữ liệu',
      description: 'Backup, export, import dữ liệu',
      icon: Database,
      href: '/admin/data-management',
      permission: 'data_management',
      color: 'bg-purple-500'
    },
    {
      id: 'notifications',
      title: 'Quản lý Thông báo',
      description: 'Templates và gửi thông báo',
      icon: Bell,
      href: '/admin/notification-management',
      permission: 'notification_management',
      color: 'bg-yellow-500'
    },
    {
      id: 'audit_logs',
      title: 'Nhật ký Kiểm toán',
      description: 'Xem lịch sử hoạt động hệ thống',
      icon: FileText,
      href: '/admin/audit-logs',
      permission: 'audit_logs',
      color: 'bg-indigo-500'
    },
    {
      id: 'departments',
      title: 'Quản lý Khoa/Phòng',
      description: 'Cấu hình khoa phòng bệnh viện',
      icon: Building2,
      href: '/admin/department-management',
      permission: 'department_management',
      color: 'bg-teal-500'
    },
    {
      id: 'system_config',
      title: 'Cấu hình Hệ thống',
      description: 'Thiết lập và cấu hình hệ thống',
      icon: Settings,
      href: '/admin/system-configuration',
      permission: 'system_configuration',
      color: 'bg-gray-500'
    }
  ];

  const filteredQuickActions = quickActions.filter(action => 
    permissions?.[action.permission] !== false
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bảng điều khiển Quản trị
          </h1>
          <p className="text-gray-600">
            Chào mừng trở lại, {user?.full_name}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {user?.role === 'superadmin' ? 'Quản trị viên cấp cao' : 'Quản trị viên'}
          </Badge>
          <div className="text-sm text-gray-500">
            Đăng nhập lần cuối: {user?.last_login ? new Date(user.last_login).toLocaleString('vi-VN') : 'Chưa có'}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-2">
          {systemAlerts.map((alert, index) => (
            <Alert key={index} className={`border-l-4 ${
              alert.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
              alert.severity === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
              'border-l-blue-500 bg-blue-50'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.title}</strong>: {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Role-based Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác Nhanh - Quyền {user?.role}</CardTitle>
          <p className="text-sm text-gray-600">
            Các chức năng bạn có quyền truy cập dựa trên vai trò và phân quyền
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredQuickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.id} href={action.href}>
                  <div className={`p-4 rounded-lg border-2 border-transparent hover:border-gray-200 transition-all cursor-pointer group ${
                    action.urgent ? 'ring-2 ring-red-200 bg-red-50' : 'hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                          {action.title}
                          {action.urgent && (
                            <Badge className="ml-2 bg-red-500 text-white text-xs">
                              Urgent
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {filteredQuickActions.length === 0 && (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không có quyền truy cập
              </h3>
              <p className="text-gray-600">
                Bạn chưa được cấp quyền truy cập vào các chức năng quản trị.
                Vui lòng liên hệ quản trị viên cấp cao để được hỗ trợ.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Tóm tắt Phân quyền
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(permissions || {}).map(([permission, hasAccess]) => (
              <div key={permission} className="flex items-center space-x-2">
                {hasAccess ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${hasAccess ? 'text-green-700' : 'text-red-700'}`}>
                  {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Lưu ý Bảo mật:</strong> Tất cả hoạt động quản trị đều được ghi lại và giám sát. 
          Vui lòng chỉ thực hiện các thao tác cần thiết và tuân thủ chính sách bảo mật của bệnh viện.
        </AlertDescription>
      </Alert>
    </div>
  );
}
