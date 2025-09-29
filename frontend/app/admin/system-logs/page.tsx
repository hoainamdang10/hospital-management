'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Eye,
  User,
  Server,
  Database,
  Shield,
  Activity,
  Zap,
  Bug,
  Settings,
  Trash2
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug' | 'critical';
  service: string;
  category: 'auth' | 'api' | 'database' | 'system' | 'security' | 'user_action';
  message: string;
  details?: string;
  user_id?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  duration?: number;
  status_code?: number;
  endpoint?: string;
  method?: string;
}

interface LogStats {
  total: number;
  today: number;
  errors: number;
  warnings: number;
  byLevel: {
    info: number;
    warning: number;
    error: number;
    debug: number;
    critical: number;
  };
  byService: {
    [key: string]: number;
  };
  byCategory: {
    auth: number;
    api: number;
    database: number;
    system: number;
    security: number;
    user_action: number;
  };
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Mock data
  const mockLogs: LogEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      level: 'info',
      service: 'auth-service',
      category: 'auth',
      message: 'User login successful',
      details: 'User admin@hospital.com logged in successfully',
      user_id: 'user-123',
      user_name: 'admin@hospital.com',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      request_id: 'req-001',
      duration: 245,
      status_code: 200,
      endpoint: '/api/auth/login',
      method: 'POST'
    },
    {
      id: '2',
      timestamp: '2024-01-15T10:25:00Z',
      level: 'error',
      service: 'patient-service',
      category: 'api',
      message: 'Failed to create patient record',
      details: 'Database connection timeout while creating patient PAT-202401-001',
      request_id: 'req-002',
      duration: 5000,
      status_code: 500,
      endpoint: '/api/patients',
      method: 'POST'
    },
    {
      id: '3',
      timestamp: '2024-01-15T10:20:00Z',
      level: 'warning',
      service: 'api-gateway',
      category: 'security',
      message: 'Rate limit exceeded',
      details: 'IP 192.168.1.200 exceeded rate limit for /api/doctors endpoint',
      ip_address: '192.168.1.200',
      request_id: 'req-003',
      status_code: 429,
      endpoint: '/api/doctors',
      method: 'GET'
    },
    {
      id: '4',
      timestamp: '2024-01-15T10:15:00Z',
      level: 'info',
      service: 'doctor-service',
      category: 'user_action',
      message: 'Doctor profile updated',
      details: 'Doctor CARD-DOC-202401-001 updated their profile information',
      user_id: 'doctor-456',
      user_name: 'doctor@hospital.com',
      request_id: 'req-004',
      duration: 156,
      status_code: 200,
      endpoint: '/api/doctors/profile',
      method: 'PUT'
    },
    {
      id: '5',
      timestamp: '2024-01-15T10:10:00Z',
      level: 'critical',
      service: 'database',
      category: 'database',
      message: 'Database connection pool exhausted',
      details: 'All database connections in use, new requests are being queued',
      request_id: 'req-005'
    },
    {
      id: '6',
      timestamp: '2024-01-15T10:05:00Z',
      level: 'debug',
      service: 'appointment-service',
      category: 'system',
      message: 'Appointment reminder sent',
      details: 'Email reminder sent for appointment APT-202401-001',
      request_id: 'req-006',
      duration: 89,
      status_code: 200
    }
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, levelFilter, serviceFilter, categoryFilter, dateFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLogs(mockLogs);
      calculateStats(mockLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (logList: LogEntry[]) => {
    const today = new Date().toDateString();
    const stats: LogStats = {
      total: logList.length,
      today: logList.filter(log => new Date(log.timestamp).toDateString() === today).length,
      errors: logList.filter(log => log.level === 'error' || log.level === 'critical').length,
      warnings: logList.filter(log => log.level === 'warning').length,
      byLevel: {
        info: logList.filter(log => log.level === 'info').length,
        warning: logList.filter(log => log.level === 'warning').length,
        error: logList.filter(log => log.level === 'error').length,
        debug: logList.filter(log => log.level === 'debug').length,
        critical: logList.filter(log => log.level === 'critical').length,
      },
      byService: logList.reduce((acc, log) => {
        acc[log.service] = (acc[log.service] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      byCategory: {
        auth: logList.filter(log => log.category === 'auth').length,
        api: logList.filter(log => log.category === 'api').length,
        database: logList.filter(log => log.category === 'database').length,
        system: logList.filter(log => log.category === 'system').length,
        security: logList.filter(log => log.category === 'security').length,
        user_action: logList.filter(log => log.category === 'user_action').length,
      }
    };
    setStats(stats);
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(log => log.service === serviceFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') {
        filtered = filtered.filter(log => 
          new Date(log.timestamp).toDateString() === now.toDateString()
        );
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(log => new Date(log.timestamp) >= weekAgo);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(log => new Date(log.timestamp) >= monthAgo);
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredLogs(filtered);
  };

  const getLevelBadge = (level: LogEntry['level']) => {
    const variants = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800',
      critical: 'bg-red-200 text-red-900'
    };

    const labels = {
      info: 'Info',
      warning: 'Warning',
      error: 'Error',
      debug: 'Debug',
      critical: 'Critical'
    };

    return (
      <Badge className={variants[level]}>
        {labels[level]}
      </Badge>
    );
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: LogEntry['category']) => {
    switch (category) {
      case 'auth':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'api':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'database':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Server className="h-4 w-4 text-orange-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'user_action':
        return <User className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AdminPageWrapper
      title="System Logs"
      activePage="system-logs"
      subtitle="Monitor system logs, audit trail, and activity"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Old Logs
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Log Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Logs</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Logs</p>
                    <p className="text-2xl font-bold text-green-600">{stats.today}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm logs theo message, service, user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Log Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>

              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="auth-service">Auth Service</SelectItem>
                  <SelectItem value="api-gateway">API Gateway</SelectItem>
                  <SelectItem value="doctor-service">Doctor Service</SelectItem>
                  <SelectItem value="patient-service">Patient Service</SelectItem>
                  <SelectItem value="appointment-service">Appointment Service</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="user_action">User Action</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Log Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Log Levels Distribution */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Log Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>Critical</span>
                    </div>
                    <span className="font-medium text-red-600">{stats.byLevel.critical}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Error</span>
                    </div>
                    <span className="font-medium text-red-500">{stats.byLevel.error}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>Warning</span>
                    </div>
                    <span className="font-medium text-yellow-500">{stats.byLevel.warning}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span>Info</span>
                    </div>
                    <span className="font-medium text-blue-500">{stats.byLevel.info}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4 text-gray-500" />
                      <span>Debug</span>
                    </div>
                    <span className="font-medium text-gray-500">{stats.byLevel.debug}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories Distribution */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Auth</span>
                    </div>
                    <span className="font-medium">{stats.byCategory.auth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>API</span>
                    </div>
                    <span className="font-medium">{stats.byCategory.api}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-500" />
                      <span>Database</span>
                    </div>
                    <span className="font-medium">{stats.byCategory.database}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-orange-500" />
                      <span>System</span>
                    </div>
                    <span className="font-medium">{stats.byCategory.system}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span>Security</span>
                    </div>
                    <span className="font-medium">{stats.byCategory.security}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      <span>User Action</span>
                    </div>
                    <span className="font-medium">{stats.byCategory.user_action}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              System Logs ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                       onClick={() => setSelectedLog(log)}>
                    <div className="flex items-center gap-2 mt-1">
                      {getLevelIcon(log.level)}
                      {getCategoryIcon(log.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.service}</span>
                        {getLevelBadge(log.level)}
                        <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                      </div>

                      <p className="text-sm text-gray-900 mb-1">{log.message}</p>

                      {log.details && (
                        <p className="text-xs text-gray-600 mb-2">{log.details}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {log.user_name && (
                          <span>User: {log.user_name}</span>
                        )}
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                        {log.endpoint && (
                          <span>{log.method} {log.endpoint}</span>
                        )}
                        {log.status_code && (
                          <span className={log.status_code >= 400 ? 'text-red-600' : 'text-green-600'}>
                            {log.status_code}
                          </span>
                        )}
                        {log.duration && (
                          <span>{log.duration}ms</span>
                        )}
                        {log.request_id && (
                          <span>ID: {log.request_id}</span>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {filteredLogs.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No logs found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  );
}
