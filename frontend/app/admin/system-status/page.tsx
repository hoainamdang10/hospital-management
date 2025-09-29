'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Server,
  Database,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Shield,
  Globe,
  Heart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  Pill
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  uptime: string;
  responseTime: number;
  lastCheck: string;
  version?: string;
  port?: number;
  url?: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
  uptime: string;
}

export default function SystemStatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data - trong thực tế sẽ fetch từ API
  const mockServices: ServiceStatus[] = [
    {
      name: 'API Gateway',
      status: 'healthy',
      uptime: '15d 4h 23m',
      responseTime: 45,
      lastCheck: new Date().toISOString(),
      version: '1.0.0',
      port: 3100,
      url: 'http://localhost:3100'
    },
    {
      name: 'Auth Service',
      status: 'healthy',
      uptime: '15d 4h 20m',
      responseTime: 32,
      lastCheck: new Date().toISOString(),
      version: '2.1.0',
      port: 3001
    },
    {
      name: 'Doctor Service',
      status: 'healthy',
      uptime: '15d 4h 18m',
      responseTime: 28,
      lastCheck: new Date().toISOString(),
      version: '1.5.2',
      port: 3002
    },
    {
      name: 'Patient Service',
      status: 'warning',
      uptime: '2d 8h 15m',
      responseTime: 156,
      lastCheck: new Date().toISOString(),
      version: '1.3.1',
      port: 3003
    },
    {
      name: 'Appointment Service',
      status: 'healthy',
      uptime: '15d 4h 12m',
      responseTime: 67,
      lastCheck: new Date().toISOString(),
      version: '1.2.0',
      port: 3004
    },
    {
      name: 'Medical Records Service',
      status: 'healthy',
      uptime: '10d 2h 45m',
      responseTime: 89,
      lastCheck: new Date().toISOString(),
      version: '1.1.0',
      port: 3005
    },
    {
      name: 'Prescription Service',
      status: 'healthy',
      uptime: '8d 16h 30m',
      responseTime: 43,
      lastCheck: new Date().toISOString(),
      version: '1.0.5',
      port: 3006
    },
    {
      name: 'Billing Service',
      status: 'error',
      uptime: '0d 0h 0m',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      version: '1.0.0',
      port: 3007
    },
    {
      name: 'Supabase Database',
      status: 'healthy',
      uptime: '30d 12h 45m',
      responseTime: 23,
      lastCheck: new Date().toISOString(),
      version: 'Cloud'
    },
    {
      name: 'Redis Cache',
      status: 'healthy',
      uptime: '15d 4h 23m',
      responseTime: 12,
      lastCheck: new Date().toISOString(),
      version: '7.0'
    }
  ];

  const mockMetrics: SystemMetrics = {
    cpu: 45,
    memory: 68,
    disk: 42,
    network: 23,
    activeConnections: 156,
    requestsPerMinute: 2340,
    errorRate: 0.8,
    uptime: '15d 4h 23m'
  };

  useEffect(() => {
    fetchSystemStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSystemStatus = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setServices(mockServices);
      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      offline: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      healthy: 'Healthy',
      warning: 'Warning',
      error: 'Error',
      offline: 'Offline'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 50) return 'text-green-600';
    if (responseTime < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value < thresholds.warning) return 'text-green-600';
    if (value < thresholds.critical) return 'text-yellow-600';
    return 'text-red-600';
  };

  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const totalServices = services.length;
  const systemHealth = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;

  return (
    <AdminPageWrapper
      title="System Status"
      activePage="system-status"
      subtitle="Monitor system health and microservices status"
      headerActions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSystemStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Health</p>
                  <p className={`text-2xl font-bold ${getMetricColor(systemHealth, { warning: 80, critical: 60 })}`}>
                    {systemHealth.toFixed(1)}%
                  </p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
              <Progress value={systemHealth} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Services</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {healthyServices}/{totalServices}
                  </p>
                </div>
                <Server className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(services.reduce((acc, s) => acc + s.responseTime, 0) / services.length || 0)}ms
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Uptime</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics?.uptime || '0d 0h 0m'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Update Info */}
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Last updated: {lastUpdate.toLocaleString('vi-VN')} •
            Next refresh: {autoRefresh ? 'in 30 seconds' : 'manual'}
          </AlertDescription>
        </Alert>

        {/* System Metrics */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                System Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className={`text-sm font-medium ${getMetricColor(metrics.cpu, { warning: 70, critical: 90 })}`}>
                      {metrics.cpu}%
                    </span>
                  </div>
                  <Progress value={metrics.cpu} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className={`text-sm font-medium ${getMetricColor(metrics.memory, { warning: 80, critical: 95 })}`}>
                      {metrics.memory}%
                    </span>
                  </div>
                  <Progress value={metrics.memory} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Disk Usage</span>
                    <span className={`text-sm font-medium ${getMetricColor(metrics.disk, { warning: 80, critical: 95 })}`}>
                      {metrics.disk}%
                    </span>
                  </div>
                  <Progress value={metrics.disk} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Network I/O</span>
                    <span className={`text-sm font-medium ${getMetricColor(metrics.network, { warning: 70, critical: 90 })}`}>
                      {metrics.network}%
                    </span>
                  </div>
                  <Progress value={metrics.network} className="h-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{metrics.activeConnections}</p>
                  <p className="text-sm text-gray-600">Active Connections</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{metrics.requestsPerMinute.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Requests/Min</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getMetricColor(metrics.errorRate, { warning: 1, critical: 5 })}`}>
                    {metrics.errorRate}%
                  </p>
                  <p className="text-sm text-gray-600">Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Microservices Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Microservices Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {service.version && <span>v{service.version}</span>}
                        {service.port && <span>Port: {service.port}</span>}
                        <span>Uptime: {service.uptime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getResponseTimeColor(service.responseTime)}`}>
                        {service.responseTime}ms
                      </p>
                      <p className="text-xs text-gray-500">Response Time</p>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <RefreshCw className="h-6 w-6" />
                <span className="text-xs">Restart Services</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Database className="h-6 w-6" />
                <span className="text-xs">Database Health</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <HardDrive className="h-6 w-6" />
                <span className="text-xs">Clear Cache</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span className="text-xs">View Logs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  );
}
