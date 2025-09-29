'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Send, 
  Edit, 
  Trash2, 
  Plus,
  Eye,
  Copy,
  Settings,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  category: 'appointment' | 'security' | 'system' | 'medical' | 'billing';
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

interface NotificationHistory {
  id: string;
  template_id: string;
  template_name: string;
  recipient_type: 'user' | 'role' | 'department' | 'all';
  recipients: string[];
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  status: 'sent' | 'pending' | 'failed' | 'scheduled';
  sent_at: string;
  delivery_rate: number;
  open_rate?: number;
  click_rate?: number;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  default_sender_email: string;
  default_sender_name: string;
  smtp_settings: {
    host: string;
    port: number;
    username: string;
    encryption: string;
  };
  sms_provider: string;
  push_service: string;
  rate_limits: {
    email_per_hour: number;
    sms_per_hour: number;
    push_per_hour: number;
  };
}

const NOTIFICATION_CATEGORIES = [
  { id: 'appointment', name: 'Lịch hẹn', icon: Calendar },
  { id: 'security', name: 'Bảo mật', icon: AlertTriangle },
  { id: 'system', name: 'Hệ thống', icon: Settings },
  { id: 'medical', name: 'Y tế', icon: CheckCircle },
  { id: 'billing', name: 'Thanh toán', icon: Users }
];

const NOTIFICATION_TYPES = [
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'sms', name: 'SMS', icon: MessageSquare },
  { id: 'push', name: 'Push', icon: Smartphone },
  { id: 'in_app', name: 'In-App', icon: Bell }
];

export default function NotificationManagementPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'email' as 'email' | 'sms' | 'push' | 'in_app',
    category: 'system' as 'appointment' | 'security' | 'system' | 'medical' | 'billing',
    variables: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, historyRes, settingsRes] = await Promise.all([
        fetch('/api/admin/notifications/templates'),
        fetch('/api/admin/notifications/history'),
        fetch('/api/admin/notifications/settings')
      ]);

      const [templatesData, historyData, settingsData] = await Promise.all([
        templatesRes.json(),
        historyRes.json(),
        settingsRes.json()
      ]);

      setTemplates(templatesData.templates || []);
      setHistory(historyData.history || []);
      setSettings(settingsData.settings);
    } catch (error) {
      console.error('Failed to fetch notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      const response = await fetch('/api/admin/notifications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      if (response.ok) {
        await fetchData();
        setIsTemplateModalOpen(false);
        resetTemplateForm();
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const updateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`/api/admin/notifications/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      if (response.ok) {
        await fetchData();
        setIsTemplateModalOpen(false);
        resetTemplateForm();
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa template này?')) return;

    try {
      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const sendNotification = async (templateId: string, recipients: string[]) => {
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          recipients,
          variables: {}
        })
      });

      if (response.ok) {
        await fetchData();
        setIsSendModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/notifications/templates/${templateId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle template status:', error);
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      content: '',
      type: 'email',
      category: 'system',
      variables: []
    });
    setSelectedTemplate(null);
  };

  const openEditModal = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
      category: template.category,
      variables: template.variables
    });
    setIsTemplateModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = NOTIFICATION_TYPES.find(t => t.id === type);
    const Icon = typeConfig?.icon || Bell;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = NOTIFICATION_CATEGORIES.find(c => c.id === category);
    const Icon = categoryConfig?.icon || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="h-8 w-8 mr-3 text-blue-600" />
            Quản lý Thông báo
          </h1>
          <p className="text-gray-600">
            Quản lý templates, gửi thông báo và cấu hình hệ thống thông báo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSettingsModalOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => setIsTemplateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Template
          </Button>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              {templates.filter(t => t.is_active).length} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã gửi hôm nay</CardTitle>
            <Send className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {history.filter(h => 
                new Date(h.sent_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Thông báo đã gửi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ gửi thành công</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {history.length > 0 
                ? Math.round((history.filter(h => h.status === 'sent').length / history.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {history.filter(h => h.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Cần xem xét
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
          <TabsTrigger value="analytics">Thống kê</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {NOTIFICATION_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {NOTIFICATION_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          {getTypeIcon(template.type)}
                          <span className="ml-2">{template.name}</span>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.subject}
                        </p>
                      </div>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => toggleTemplateStatus(template.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Template Info */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          {getCategoryIcon(template.category)}
                          <span className="ml-1 text-sm">
                            {NOTIFICATION_CATEGORIES.find(c => c.id === template.category)?.name}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {NOTIFICATION_TYPES.find(t => t.id === template.type)?.name}
                        </Badge>
                      </div>

                      {/* Content Preview */}
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {template.content}
                      </div>

                      {/* Variables */}
                      {template.variables.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-1">Biến:</div>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.variables.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Đã dùng: {template.usage_count} lần</span>
                        <span>
                          {new Date(template.updated_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsSendModalOpen(true)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Gửi
                        </Button>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử Gửi thông báo ({history.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <div className="font-medium">{item.template_name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>Chủ đề: {item.subject}</div>
                            <div>Người nhận: {item.recipients.length} người</div>
                            <div>Gửi: {new Date(item.sent_at).toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status === 'sent' ? 'Đã gửi' :
                           item.status === 'pending' ? 'Chờ gửi' :
                           item.status === 'failed' ? 'Thất bại' : 'Đã lên lịch'}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {Math.round(item.delivery_rate)}% delivered
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Template Modal */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Chỉnh sửa Template' : 'Tạo Template mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên template</label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="Nhập tên template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại thông báo</label>
                <Select 
                  value={templateForm.type} 
                  onValueChange={(value: any) => setTemplateForm({...templateForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Danh mục</label>
                <Select 
                  value={templateForm.category} 
                  onValueChange={(value: any) => setTemplateForm({...templateForm, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Chủ đề</label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                placeholder="Nhập chủ đề thông báo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nội dung</label>
              <Textarea
                value={templateForm.content}
                onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                placeholder="Nhập nội dung thông báo"
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={selectedTemplate ? updateTemplate : createTemplate}>
                {selectedTemplate ? 'Cập nhật' : 'Tạo Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
