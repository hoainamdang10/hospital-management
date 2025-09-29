import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Lock, 
  Eye, 
  Activity,
  Clock,
  UserX,
  Key,
  Settings,
  RefreshCw,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Zap,
  Globe,
  Smartphone
} from 'lucide-react';

interface SecurityMetrics {
  active_sessions: number;
  failed_login_attempts_today: number;
  locked_accounts: number;
  security_incidents_today: number;
  password_policy_violations: number;
  two_factor_enabled_users: number;
  total_users: number;
  suspicious_activities: number;
}

interface ActiveSession {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  location: string;
  login_time: string;
  last_activity: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  is_suspicious: boolean;
}

interface SecurityIncident {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'policy_violation' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  user_email?: string;
  ip_address: string;
  description: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assigned_to?: string;
}

interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  max_age_days: number;
  history_count: number;
  lockout_attempts: number;
  lockout_duration_minutes: number;
}

export default function SecurityManagementPage() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    fetchSecurityData();
    
    if (realTimeEnabled) {
      const interval = setInterval(fetchSecurityData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  // WebSocket for real-time security alerts
  useEffect(() => {
    if (!realTimeEnabled) return;

    const ws = new WebSocket('ws://localhost:3000/api/admin/security/ws');
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'security_incident':
          setSecurityIncidents(prev => [update.data, ...prev]);
          break;
        case 'session_update':
          setActiveSessions(prev => 
            prev.map(session => 
              session.id === update.data.id ? { ...session, ...update.data } : session
            )
          );
          break;
        case 'metrics_update':
          setMetrics(update.data);
          break;
      }
    };

    return () => ws.close();
  }, [realTimeEnabled]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [metricsRes, sessionsRes, incidentsRes, policyRes] = await Promise.all([
        fetch('/api/admin/security/metrics'),
        fetch('/api/admin/security/active-sessions'),
        fetch('/api/admin/security/incidents'),
        fetch('/api/admin/security/password-policy')
      ]);

      const [metricsData, sessionsData, incidentsData, policyData] = await Promise.all([
        metricsRes.json(),
        sessionsRes.json(),
        incidentsRes.json(),
        policyRes.json()
      ]);

      setMetrics(metricsData);
      setActiveSessions(sessionsData.sessions || []);
      setSecurityIncidents(incidentsData.incidents || []);
      setPasswordPolicy(policyData.policy);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceLogoutSession = async (sessionId: string, userName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn đăng xuất phiên của ${userName}?`)) return;

    try {
      const response = await fetch(`/api/admin/security/sessions/${sessionId}/logout`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchSecurityData();
        
        // Log audit event
        await fetch('/api/admin/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'force_logout',
            resource_type: 'user_session',
            details: { sessionId, userName },
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      console.error('Failed to force logout:', error);
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/security/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchSecurityData();
      }
    } catch (error) {
      console.error('Failed to update incident status:', error);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Smartphone className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return <Lock className="h-4 w-4" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      case 'policy_violation': return <Shield className="h-4 w-4" />;
      case 'unauthorized_access': return <UserX className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredIncidents = securityIncidents.filter(incident => {
    const matchesSearch = searchTerm === '' || 
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.ip_address.includes(searchTerm);
    
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  const twoFactorPercentage = metrics ? 
    Math.round((metrics.two_factor_enabled_users / metrics.total_users) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Quản lý Bảo mật
          </h1>
          <p className="text-gray-600">
            Giám sát và quản lý bảo mật hệ thống toàn diện
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={realTimeEnabled ? "default" : "outline"} 
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {realTimeEnabled ? 'Thời gian thực' : 'Thủ công'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phiên hoạt động</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Người dùng đang trực tuyến
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đăng nhập thất bại</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.failed_login_attempts_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Hôm nay
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tài khoản bị khóa</CardTitle>
            <Lock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.locked_accounts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Cần xem xét
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sự cố bảo mật</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.security_incidents_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Hôm nay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-Factor Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Trạng thái Xác thực Hai yếu tố (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Người dùng đã kích hoạt 2FA</span>
              <span className="font-bold">
                {metrics?.two_factor_enabled_users || 0} / {metrics?.total_users || 0}
              </span>
            </div>
            <Progress value={twoFactorPercentage} className="h-3" />
            <div className="text-sm text-gray-600">
              {twoFactorPercentage}% người dùng đã kích hoạt xác thực hai yếu tố
            </div>
            {twoFactorPercentage < 50 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Tỷ lệ kích hoạt 2FA thấp. Khuyến khích người dùng kích hoạt để tăng cường bảo mật.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Security Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="sessions">Phiên hoạt động</TabsTrigger>
          <TabsTrigger value="incidents">Sự cố bảo mật</TabsTrigger>
          <TabsTrigger value="policies">Chính sách</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phiên đăng nhập Hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className={`p-4 border rounded-lg ${
                    session.is_suspicious ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center space-x-2">
                          {getDeviceIcon(session.device_type)}
                          <div>
                            <div className="font-medium">{session.user_name}</div>
                            <div className="text-sm text-gray-600">{session.user_email}</div>
                            <Badge variant="outline" className="mt-1">
                              {session.user_role}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div><strong>IP:</strong> {session.ip_address}</div>
                          <div><strong>Vị trí:</strong> {session.location}</div>
                          <div><strong>Đăng nhập:</strong> {new Date(session.login_time).toLocaleString('vi-VN')}</div>
                          <div><strong>Hoạt động cuối:</strong> {new Date(session.last_activity).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.is_suspicious && (
                          <Badge className="bg-red-100 text-red-800">
                            Đáng nghi
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => forceLogoutSession(session.id, session.user_name)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Đăng xuất
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm sự cố bảo mật..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select 
                  value={severityFilter} 
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả mức độ</option>
                  <option value="critical">Nghiêm trọng</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Incidents List */}
          <Card>
            <CardHeader>
              <CardTitle>Sự cố Bảo mật ({filteredIncidents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredIncidents.map((incident) => (
                  <div key={incident.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        {getIncidentTypeIcon(incident.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(incident.severity)}>
                              {incident.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(incident.timestamp).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <div className="font-medium mb-1">{incident.description}</div>
                          <div className="text-sm text-gray-600">
                            <div><strong>IP:</strong> {incident.ip_address}</div>
                            {incident.user_email && (
                              <div><strong>Người dùng:</strong> {incident.user_email}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={incident.status}
                          onChange={(e) => updateIncidentStatus(incident.id, e.target.value)}
                          className="px-2 py-1 text-sm border rounded"
                        >
                          <option value="open">Mở</option>
                          <option value="investigating">Đang điều tra</option>
                          <option value="resolved">Đã giải quyết</option>
                          <option value="false_positive">Báo động giả</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chính sách Mật khẩu</CardTitle>
            </CardHeader>
            <CardContent>
              {passwordPolicy && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Độ dài tối thiểu</label>
                      <div className="text-lg font-semibold">{passwordPolicy.min_length} ký tự</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Thời gian hết hạn</label>
                      <div className="text-lg font-semibold">{passwordPolicy.max_age_days} ngày</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số lần thử sai tối đa</label>
                      <div className="text-lg font-semibold">{passwordPolicy.lockout_attempts} lần</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Yêu cầu ký tự</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {passwordPolicy.require_uppercase ? 
                            <CheckCircle className="h-4 w-4 text-green-600" /> : 
                            <XCircle className="h-4 w-4 text-gray-400" />
                          }
                          <span>Chữ hoa</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {passwordPolicy.require_lowercase ? 
                            <CheckCircle className="h-4 w-4 text-green-600" /> : 
                            <XCircle className="h-4 w-4 text-gray-400" />
                          }
                          <span>Chữ thường</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {passwordPolicy.require_numbers ? 
                            <CheckCircle className="h-4 w-4 text-green-600" /> : 
                            <XCircle className="h-4 w-4 text-gray-400" />
                          }
                          <span>Số</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {passwordPolicy.require_symbols ? 
                            <CheckCircle className="h-4 w-4 text-green-600" /> : 
                            <XCircle className="h-4 w-4 text-gray-400" />
                          }
                          <span>Ký tự đặc biệt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
