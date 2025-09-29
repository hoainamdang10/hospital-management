'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Database, 
  Download, 
  Upload, 
  Archive, 
  Trash2, 
  RefreshCw,
  HardDrive,
  FileText,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Copy,
  RotateCcw,
  Calendar,
  Users,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BackupData {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: string;
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  created_at: string;
  tables_included: string[];
  retention_days: number;
  compressed: boolean;
}

interface DataExportJob {
  id: string;
  name: string;
  format: 'csv' | 'excel' | 'json' | 'pdf';
  tables: string[];
  filters: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  file_size?: string;
  download_url?: string;
  created_at: string;
  expires_at: string;
}

interface StorageMetrics {
  total_size: string;
  used_size: string;
  available_size: string;
  usage_percentage: number;
  table_sizes: Array<{
    table_name: string;
    size: string;
    row_count: number;
  }>;
  backup_size: string;
  archive_size: string;
}

export default function DataManagementPage() {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [exportJobs, setExportJobs] = useState<DataExportJob[]>([]);
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'differential'>('full');
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json' | 'pdf'>('csv');

  const availableTables = [
    'profiles', 'doctors', 'patients', 'appointments', 'medical_records',
    'departments', 'roles', 'permissions', 'audit_logs', 'security_incidents'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [backupsRes, exportsRes, metricsRes] = await Promise.all([
        fetch('/api/admin/data-management/backups'),
        fetch('/api/admin/data-management/exports'),
        fetch('/api/admin/data-management/storage-metrics')
      ]);

      const [backupsData, exportsData, metricsData] = await Promise.all([
        backupsRes.json(),
        exportsRes.json(),
        metricsRes.json()
      ]);

      setBackups(backupsData.backups || []);
      setExportJobs(exportsData.exports || []);
      setStorageMetrics(metricsData.metrics);
    } catch (error) {
      console.error('Failed to fetch data management info:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/admin/data-management/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: backupType,
          tables: selectedTables.length > 0 ? selectedTables : availableTables,
          compressed: true,
          retention_days: 30
        })
      });

      if (response.ok) {
        await fetchData();
        setIsBackupModalOpen(false);
        setSelectedTables([]);
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  const createExport = async () => {
    try {
      const response = await fetch('/api/admin/data-management/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: exportFormat,
          tables: selectedTables.length > 0 ? selectedTables : availableTables,
          filters: {},
          expires_in_hours: 24
        })
      });

      if (response.ok) {
        await fetchData();
        setIsExportModalOpen(false);
        setSelectedTables([]);
      }
    } catch (error) {
      console.error('Failed to create export:', error);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục backup này? Dữ liệu hiện tại sẽ bị ghi đè.')) return;

    try {
      const response = await fetch(`/api/admin/data-management/backups/${backupId}/restore`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Backup đang được khôi phục. Quá trình này có thể mất vài phút.');
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa backup này?')) return;

    try {
      const response = await fetch(`/api/admin/data-management/backups/${backupId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  };

  const downloadExport = async (exportId: string) => {
    try {
      const response = await fetch(`/api/admin/data-management/exports/${exportId}/download`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${exportId}.zip`;
      a.click();
    } catch (error) {
      console.error('Failed to download export:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'scheduled': case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return <Database className="h-4 w-4" />;
      case 'incremental': return <Activity className="h-4 w-4" />;
      case 'differential': return <Copy className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="h-8 w-8 mr-3 text-blue-600" />
            Quản lý Dữ liệu
          </h1>
          <p className="text-gray-600">
            Sao lưu, xuất dữ liệu và quản lý lưu trữ hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => setIsExportModalOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Xuất dữ liệu
          </Button>
          <Button onClick={() => setIsBackupModalOpen(true)}>
            <Archive className="h-4 w-4 mr-2" />
            Tạo Backup
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng dung lượng</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageMetrics?.total_size || '0 GB'}</div>
            <p className="text-xs text-muted-foreground">
              Dung lượng tổng cộng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã sử dụng</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageMetrics?.used_size || '0 GB'}</div>
            <p className="text-xs text-muted-foreground">
              {storageMetrics?.usage_percentage || 0}% đã sử dụng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup</CardTitle>
            <Archive className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageMetrics?.backup_size || '0 GB'}</div>
            <p className="text-xs text-muted-foreground">
              {backups.length} backup files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archive</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageMetrics?.archive_size || '0 GB'}</div>
            <p className="text-xs text-muted-foreground">
              Dữ liệu lưu trữ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Sử dụng Lưu trữ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Tổng sử dụng</span>
                <span className="text-sm text-gray-600">
                  {storageMetrics?.used_size} / {storageMetrics?.total_size}
                </span>
              </div>
              <Progress value={storageMetrics?.usage_percentage || 0} className="h-3" />
            </div>
            
            {storageMetrics?.usage_percentage && storageMetrics.usage_percentage > 80 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Dung lượng lưu trữ sắp đầy. Hãy xem xét dọn dẹp hoặc mở rộng dung lượng.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="backups">Backup</TabsTrigger>
          <TabsTrigger value="exports">Xuất dữ liệu</TabsTrigger>
          <TabsTrigger value="tables">Bảng dữ liệu</TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Backup ({backups.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div key={backup.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(backup.type)}
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>Loại: {backup.type.toUpperCase()}</div>
                            <div>Kích thước: {backup.size}</div>
                            <div>Bảng: {backup.tables_included.length} bảng</div>
                            <div>Tạo: {new Date(backup.created_at).toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(backup.status)}>
                          {backup.status === 'completed' ? 'Hoàn thành' :
                           backup.status === 'in_progress' ? 'Đang xử lý' :
                           backup.status === 'failed' ? 'Thất bại' : 'Đã lên lịch'}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreBackup(backup.id)}
                            disabled={backup.status !== 'completed'}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBackup(backup.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Công việc Xuất dữ liệu ({exportJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportJobs.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Định dạng: {job.format.toUpperCase()}</div>
                          <div>Bảng: {job.tables.join(', ')}</div>
                          <div>Tạo: {new Date(job.created_at).toLocaleString('vi-VN')}</div>
                          {job.file_size && <div>Kích thước: {job.file_size}</div>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status === 'completed' ? 'Hoàn thành' :
                           job.status === 'processing' ? 'Đang xử lý' :
                           job.status === 'failed' ? 'Thất bại' : 'Chờ xử lý'}
                        </Badge>
                        {job.status === 'processing' && (
                          <div className="w-20">
                            <Progress value={job.progress} className="h-2" />
                          </div>
                        )}
                        {job.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => downloadExport(job.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kích thước Bảng dữ liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {storageMetrics?.table_sizes?.map((table, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{table.table_name}</div>
                      <div className="text-sm text-gray-600">
                        {table.row_count.toLocaleString('vi-VN')} bản ghi
                      </div>
                    </div>
                    <Badge variant="outline">{table.size}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Backup Modal */}
      <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo Backup mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Loại Backup</label>
              <Select value={backupType} onValueChange={(value: any) => setBackupType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup - Toàn bộ dữ liệu</SelectItem>
                  <SelectItem value="incremental">Incremental - Chỉ thay đổi mới</SelectItem>
                  <SelectItem value="differential">Differential - Thay đổi từ backup cuối</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Chọn bảng dữ liệu</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {availableTables.map((table) => (
                  <label key={table} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTables([...selectedTables, table]);
                        } else {
                          setSelectedTables(selectedTables.filter(t => t !== table));
                        }
                      }}
                    />
                    <span className="text-sm">{table}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsBackupModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={createBackup}>
                <Archive className="h-4 w-4 mr-2" />
                Tạo Backup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xuất dữ liệu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Định dạng xuất</label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV - Comma Separated Values</SelectItem>
                  <SelectItem value="excel">Excel - Microsoft Excel</SelectItem>
                  <SelectItem value="json">JSON - JavaScript Object Notation</SelectItem>
                  <SelectItem value="pdf">PDF - Portable Document Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Chọn bảng dữ liệu</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {availableTables.map((table) => (
                  <label key={table} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTables([...selectedTables, table]);
                        } else {
                          setSelectedTables(selectedTables.filter(t => t !== table));
                        }
                      }}
                    />
                    <span className="text-sm">{table}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={createExport}>
                <Download className="h-4 w-4 mr-2" />
                Xuất dữ liệu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
