import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Mail, 
  Database, 
  Clock,
  Globe,
  Bell,
  Lock,
  Server,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface SystemConfig {
  general: {
    hospital_name: string;
    hospital_address: string;
    hospital_phone: string;
    hospital_email: string;
    timezone: string;
    language: string;
    currency: string;
  };
  security: {
    password_min_length: number;
    password_require_uppercase: boolean;
    password_require_lowercase: boolean;
    password_require_numbers: boolean;
    password_require_symbols: boolean;
    session_timeout_minutes: number;
    max_login_attempts: number;
    lockout_duration_minutes: number;
    two_factor_auth_required: boolean;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    smtp_encryption: string;
    from_email: string;
    from_name: string;
    email_notifications_enabled: boolean;
  };
  notifications: {
    appointment_reminders: boolean;
    appointment_confirmations: boolean;
    system_alerts: boolean;
    maintenance_notifications: boolean;
    security_alerts: boolean;
    reminder_hours_before: number;
  };
  system: {
    maintenance_mode: boolean;
    maintenance_message: string;
    backup_enabled: boolean;
    backup_frequency: string;
    backup_retention_days: number;
    log_level: string;
    max_file_upload_size_mb: number;
    api_rate_limit_per_minute: number;
  };
}

export default function SystemConfigurationPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-configuration');
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/system-configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setHasChanges(false);
        // Show success message
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
    setHasChanges(true);
  };

  const testEmailConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/system-configuration/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config?.email)
      });

      if (response.ok) {
        alert('Test email sent successfully!');
      } else {
        alert('Failed to send test email. Please check your configuration.');
      }
    } catch (error) {
      console.error('Failed to test email:', error);
      alert('Failed to test email configuration.');
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="h-8 w-8 mr-3 text-blue-600" />
            System Configuration
          </h1>
          <p className="text-gray-600">
            Configure global system settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchConfiguration}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={saveConfiguration} 
            disabled={!hasChanges || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Hospital Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hospital Name</label>
                  <Input
                    value={config.general.hospital_name}
                    onChange={(e) => updateConfig('general', 'hospital_name', e.target.value)}
                    placeholder="Enter hospital name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    value={config.general.hospital_phone}
                    onChange={(e) => updateConfig('general', 'hospital_phone', e.target.value)}
                    placeholder="Hospital phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Textarea
                  value={config.general.hospital_address}
                  onChange={(e) => updateConfig('general', 'hospital_address', e.target.value)}
                  placeholder="Hospital address"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={config.general.hospital_email}
                    onChange={(e) => updateConfig('general', 'hospital_email', e.target.value)}
                    placeholder="Hospital email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <Select 
                    value={config.general.timezone} 
                    onValueChange={(value) => updateConfig('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <Select 
                    value={config.general.language} 
                    onValueChange={(value) => updateConfig('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Password Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Length</label>
                  <Input
                    type="number"
                    value={config.security.password_min_length}
                    onChange={(e) => updateConfig('security', 'password_min_length', parseInt(e.target.value))}
                    min="6"
                    max="32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Session Timeout (minutes)</label>
                  <Input
                    type="number"
                    value={config.security.session_timeout_minutes}
                    onChange={(e) => updateConfig('security', 'session_timeout_minutes', parseInt(e.target.value))}
                    min="15"
                    max="480"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Require Uppercase Letters</label>
                  <Switch
                    checked={config.security.password_require_uppercase}
                    onCheckedChange={(checked) => updateConfig('security', 'password_require_uppercase', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Require Lowercase Letters</label>
                  <Switch
                    checked={config.security.password_require_lowercase}
                    onCheckedChange={(checked) => updateConfig('security', 'password_require_lowercase', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Require Numbers</label>
                  <Switch
                    checked={config.security.password_require_numbers}
                    onCheckedChange={(checked) => updateConfig('security', 'password_require_numbers', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Require Special Characters</label>
                  <Switch
                    checked={config.security.password_require_symbols}
                    onCheckedChange={(checked) => updateConfig('security', 'password_require_symbols', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Two-Factor Authentication Required</label>
                  <Switch
                    checked={config.security.two_factor_auth_required}
                    onCheckedChange={(checked) => updateConfig('security', 'two_factor_auth_required', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Login Attempts</label>
                  <Input
                    type="number"
                    value={config.security.max_login_attempts}
                    onChange={(e) => updateConfig('security', 'max_login_attempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lockout Duration (minutes)</label>
                  <Input
                    type="number"
                    value={config.security.lockout_duration_minutes}
                    onChange={(e) => updateConfig('security', 'lockout_duration_minutes', parseInt(e.target.value))}
                    min="5"
                    max="60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                SMTP Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Host</label>
                  <Input
                    value={config.email.smtp_host}
                    onChange={(e) => updateConfig('email', 'smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Port</label>
                  <Input
                    type="number"
                    value={config.email.smtp_port}
                    onChange={(e) => updateConfig('email', 'smtp_port', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input
                    value={config.email.smtp_username}
                    onChange={(e) => updateConfig('email', 'smtp_username', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    value={config.email.smtp_password}
                    onChange={(e) => updateConfig('email', 'smtp_password', e.target.value)}
                    placeholder="Your app password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Encryption</label>
                  <Select 
                    value={config.email.smtp_encryption} 
                    onValueChange={(value) => updateConfig('email', 'smtp_encryption', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">From Email</label>
                  <Input
                    type="email"
                    value={config.email.from_email}
                    onChange={(e) => updateConfig('email', 'from_email', e.target.value)}
                    placeholder="noreply@hospital.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">From Name</label>
                  <Input
                    value={config.email.from_name}
                    onChange={(e) => updateConfig('email', 'from_name', e.target.value)}
                    placeholder="Hospital Management System"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Email Notifications</label>
                <Switch
                  checked={config.email.email_notifications_enabled}
                  onCheckedChange={(checked) => updateConfig('email', 'email_notifications_enabled', checked)}
                />
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={testEmailConfiguration}>
                  <Mail className="h-4 w-4 mr-2" />
                  Test Email Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Maintenance Mode</div>
                  <div className="text-sm text-gray-600">
                    Enable to prevent user access during maintenance
                  </div>
                </div>
                <Switch
                  checked={config.system.maintenance_mode}
                  onCheckedChange={(checked) => updateConfig('system', 'maintenance_mode', checked)}
                />
              </div>

              {config.system.maintenance_mode && (
                <div>
                  <label className="block text-sm font-medium mb-1">Maintenance Message</label>
                  <Textarea
                    value={config.system.maintenance_message}
                    onChange={(e) => updateConfig('system', 'maintenance_message', e.target.value)}
                    placeholder="System is under maintenance. Please try again later."
                    rows={3}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Log Level</label>
                  <Select 
                    value={config.system.log_level} 
                    onValueChange={(value) => updateConfig('system', 'log_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max File Upload Size (MB)</label>
                  <Input
                    type="number"
                    value={config.system.max_file_upload_size_mb}
                    onChange={(e) => updateConfig('system', 'max_file_upload_size_mb', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Automatic Backups</label>
                <Switch
                  checked={config.system.backup_enabled}
                  onCheckedChange={(checked) => updateConfig('system', 'backup_enabled', checked)}
                />
              </div>

              {config.system.backup_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Backup Frequency</label>
                    <Select 
                      value={config.system.backup_frequency} 
                      onValueChange={(value) => updateConfig('system', 'backup_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Retention Period (days)</label>
                    <Input
                      type="number"
                      value={config.system.backup_retention_days}
                      onChange={(e) => updateConfig('system', 'backup_retention_days', parseInt(e.target.value))}
                      min="7"
                      max="365"
                    />
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
