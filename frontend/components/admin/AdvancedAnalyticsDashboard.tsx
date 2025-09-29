import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  Zap,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  operationMetrics: {
    totalOperations: number;
    successRate: number;
    avgExecutionTime: number;
    operationsByType: Array<{
      type: string;
      count: number;
      successRate: number;
      avgTime: number;
    }>;
  };
  performanceTrends: {
    hourly: Array<{
      hour: string;
      operations: number;
      successRate: number;
      avgTime: number;
    }>;
    daily: Array<{
      date: string;
      operations: number;
      successRate: number;
      avgTime: number;
    }>;
  };
  serviceMetrics: {
    [serviceName: string]: {
      health: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      errorRate: number;
      throughput: number;
    };
  };
  sagaAnalytics: {
    totalSagas: number;
    completedSagas: number;
    failedSagas: number;
    compensatedSagas: number;
    avgStepsPerSaga: number;
    mostFailedSteps: Array<{
      stepName: string;
      failureCount: number;
      service: string;
    }>;
  };
}

export default function AdvancedAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('operations');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orchestration/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/orchestration/analytics/export?timeRange=${timeRange}&format=csv`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
            Advanced Analytics Dashboard
          </h2>
          <p className="text-gray-600">
            Comprehensive system performance and workflow analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.operationMetrics.totalOperations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In selected time range
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.operationMetrics.successRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall success rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.operationMetrics.avgExecutionTime.toFixed(1) || 0}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average completion time
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sagas</CardTitle>
            <Database className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.sagaAnalytics.totalSagas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total saga transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operation Performance by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Operation Performance by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.operationMetrics.operationsByType.map((operation) => (
              <div key={operation.type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="font-medium capitalize">
                    {operation.type.replace('_', ' ')}
                  </div>
                  <Badge variant="outline">
                    {operation.count} operations
                  </Badge>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-green-600">
                      {operation.successRate.toFixed(1)}%
                    </div>
                    <div className="text-gray-500">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-600">
                      {operation.avgTime.toFixed(1)}s
                    </div>
                    <div className="text-gray-500">Avg Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Health Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData?.serviceMetrics && Object.entries(analyticsData.serviceMetrics).map(([serviceName, metrics]) => (
              <div key={serviceName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{serviceName}</h4>
                  <Badge className={getHealthColor(metrics.health)}>
                    {metrics.health}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span className="font-medium">{metrics.responseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span className="font-medium">{metrics.errorRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Throughput:</span>
                    <span className="font-medium">{metrics.throughput}/min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Saga Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saga Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Sagas</span>
                <span className="font-bold text-lg">
                  {analyticsData?.sagaAnalytics.totalSagas || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Completed</span>
                <span className="font-bold text-green-600">
                  {analyticsData?.sagaAnalytics.completedSagas || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Failed</span>
                <span className="font-bold text-red-600">
                  {analyticsData?.sagaAnalytics.failedSagas || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Compensated</span>
                <span className="font-bold text-yellow-600">
                  {analyticsData?.sagaAnalytics.compensatedSagas || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Avg Steps per Saga</span>
                <span className="font-bold text-blue-600">
                  {analyticsData?.sagaAnalytics.avgStepsPerSaga.toFixed(1) || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Failed Saga Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData?.sagaAnalytics.mostFailedSteps.map((step, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <div>
                    <div className="font-medium">{step.stepName}</div>
                    <div className="text-sm text-gray-600">{step.service}</div>
                  </div>
                  <Badge variant="destructive">
                    {step.failureCount} failures
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Interactive performance charts will be rendered here</p>
              <p className="text-sm">Using Chart.js or Recharts for real-time visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
