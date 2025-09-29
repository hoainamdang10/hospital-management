import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar as CalendarIcon,
  Users, 
  Activity, 
  Shield, 
  Database,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Globe,
  Smartphone,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  location: string;
  timestamp: string;
  details: Record<string, any>;
  status: 'success' | 'failed' | 'warning';
  session_id: string;
  saga_id?: string;
  operation_id?: string;
}

interface AuditStats {
  total_logs_today: number;
  unique_users_today: number;
  failed_operations_today: number;
  most_active_user: {
    name: string;
    count: number;
  };
  top_actions: Array<{
    action: string;
    count: number;
  }>;
  hourly_activity: Array<{
    hour: number;
    count: number;
  }>;
}

const ACTION_CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: Activity },
  { id: 'user_management', name: 'Quản lý Người dùng', icon: Users },
  { id: 'security', name: 'Bảo mật', icon: Shield },
  { id: 'system_config', name: 'Cấu hình Hệ thống', icon: Settings },
  { id: 'data_access', name: 'Truy cập Dữ liệu', icon: Database },
  { id: 'authentication', name: 'Xác thực', icon: CheckCircle }
];

const STATUS_COLORS = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800'
};

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date()
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchAuditLogs();
    fetchAuditStats();
  }, [currentPage, searchTerm, actionFilter, statusFilter, userFilter, dateRange]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        action_category: actionFilter,
        status: statusFilter,
        user: userFilter,
        from: dateRange.from?.toISOString() || '',
        to: dateRange.to?.toISOString() || ''
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();
      
      setAuditLogs(data.logs || []);
      setTotalLogs(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from?.toISOString() || '',
        to: dateRange.to?.toISOString() || ''
      });

      const response = await fetch(`/api/admin/audit-logs/stats?${params}`);
      const data = await response.json();
      setAuditStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        action_category: actionFilter,
        status: statusFilter,
        user: userFilter,
        from: dateRange.from?.toISOString() || '',
        to: dateRange.to?.toISOString() || '',
        format: 'csv'
      });

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const openDetailModal = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('logout')) return <CheckCircle className="h-4 w-4" />;
    if (action.includes('create') || action.includes('add')) return <Users className="h-4 w-4" />;
    if (action.includes('update') || action.includes('edit')) return <Settings className="h-4 w-4" />;
    if (action.includes('delete') || action.includes('remove')) return <AlertTriangle className="h-4 w-4" />;
    if (action.includes('security') || action.includes('permission')) return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.toLowerCase().includes('mobile')) return <Smartphone className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-blue-600" />
            Nhật ký Kiểm toán
          </h1>
          <p className="text-gray-600">
            Theo dõi và kiểm toán tất cả hoạt động trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAuditLogs}>
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng hoạt động hôm nay</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStats?.total_logs_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả hoạt động được ghi lại
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStats?.unique_users_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Người dùng duy nhất hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thao tác thất bại</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStats?.failed_operations_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Cần xem xét
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng tích cực nhất</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{auditStats?.most_active_user?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {auditStats?.most_active_user?.count || 0} hoạt động
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm hoạt động, người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại hoạt động" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="warning">Cảnh báo</SelectItem>
              </SelectContent>
            </Select>

            {/* User Filter */}
            <Input
              placeholder="Lọc theo người dùng"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: vi })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: vi })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: vi })
                    )
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Nhật ký Hoạt động ({totalLogs.toLocaleString('vi-VN')} bản ghi)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      {getActionIcon(log.action)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{formatAction(log.action)}</span>
                          <Badge className={STATUS_COLORS[log.status]}>
                            {log.status === 'success' ? 'Thành công' : 
                             log.status === 'failed' ? 'Thất bại' : 'Cảnh báo'}
                          </Badge>
                          {log.saga_id && (
                            <Badge variant="outline" className="text-xs">
                              Saga: {log.saga_id.slice(-8)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span><strong>Người dùng:</strong> {log.user_name} ({log.user_email})</span>
                            <Badge variant="outline">{log.user_role}</Badge>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span><strong>IP:</strong> {log.ip_address}</span>
                            <span><strong>Vị trí:</strong> {log.location}</span>
                            <div className="flex items-center space-x-1">
                              {getDeviceIcon(log.user_agent)}
                              <span>Thiết bị</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                          </div>
                        </div>

                        {log.resource_type && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {log.resource_type}
                              {log.resource_id && `: ${log.resource_id}`}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetailModal(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-600">
                  Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalLogs)} 
                  trong tổng số {totalLogs.toLocaleString('vi-VN')} bản ghi
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Nhật ký Kiểm toán</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hoạt động</label>
                  <div className="text-lg font-semibold">{formatAction(selectedLog.action)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <Badge className={STATUS_COLORS[selectedLog.status]}>
                    {selectedLog.status === 'success' ? 'Thành công' : 
                     selectedLog.status === 'failed' ? 'Thất bại' : 'Cảnh báo'}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thời gian</label>
                  <div>{new Date(selectedLog.timestamp).toLocaleString('vi-VN')}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ID Phiên</label>
                  <div className="font-mono text-sm">{selectedLog.session_id}</div>
                </div>
              </div>

              {/* User Info */}
              <div>
                <h3 className="text-lg font-medium mb-3">Thông tin Người dùng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tên</label>
                    <div>{selectedLog.user_name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <div>{selectedLog.user_email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vai trò</label>
                    <Badge variant="outline">{selectedLog.user_role}</Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ID Người dùng</label>
                    <div className="font-mono text-sm">{selectedLog.user_id}</div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div>
                <h3 className="text-lg font-medium mb-3">Chi tiết Kỹ thuật</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Địa chỉ IP</label>
                    <div className="font-mono">{selectedLog.ip_address}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vị trí</label>
                    <div>{selectedLog.location}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">User Agent</label>
                    <div className="text-sm bg-gray-100 p-2 rounded font-mono">
                      {selectedLog.user_agent}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Info */}
              {selectedLog.resource_type && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Tài nguyên</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Loại tài nguyên</label>
                      <div>{selectedLog.resource_type}</div>
                    </div>
                    {selectedLog.resource_id && (
                      <div>
                        <label className="block text-sm font-medium mb-1">ID Tài nguyên</label>
                        <div className="font-mono text-sm">{selectedLog.resource_id}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Saga/Operation Info */}
              {(selectedLog.saga_id || selectedLog.operation_id) && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Thông tin Workflow</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.saga_id && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Saga ID</label>
                        <div className="font-mono text-sm">{selectedLog.saga_id}</div>
                      </div>
                    )}
                    {selectedLog.operation_id && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Operation ID</label>
                        <div className="font-mono text-sm">{selectedLog.operation_id}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Details */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Chi tiết bổ sung</h3>
                  <div className="bg-gray-100 p-4 rounded">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
