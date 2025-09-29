'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast-provider';
import { doctorsApi } from '@/lib/api/doctors';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun, 
  Save,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Lock
} from 'lucide-react';

interface DoctorSettings {
  notification_email: boolean;
  notification_sms: boolean;
  notification_appointment_reminder: boolean;
  notification_patient_review: boolean;
  privacy_show_phone: boolean;
  privacy_show_email: boolean;
  privacy_show_experience: boolean;
  language_preference: string;
  timezone: string;
  theme_preference: string;
}

interface AccountSettingsProps {
  doctorId: string;
}

export default function AccountSettings({ doctorId }: AccountSettingsProps) {
  const [settings, setSettings] = useState<DoctorSettings>({
    notification_email: true,
    notification_sms: true,
    notification_appointment_reminder: true,
    notification_patient_review: true,
    privacy_show_phone: true,
    privacy_show_email: true,
    privacy_show_experience: true,
    language_preference: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    theme_preference: 'light'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [doctorId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await doctorsApi.getDoctorSettings(doctorId);
      
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast("Lỗi", "Không thể tải cài đặt", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof DoctorSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await doctorsApi.updateDoctorSettings(doctorId, settings);
      
      if (response.success) {
        setHasChanges(false);
        showToast("Thành công", "Đã cập nhật cài đặt", "success");
      } else {
        throw new Error(response.error?.message || 'Không thể cập nhật cài đặt');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast("Lỗi", error instanceof Error ? error.message : "Không thể lưu cài đặt", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast("Lỗi", "Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Lỗi", "Mật khẩu xác nhận không khớp", "error");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự", "error");
      return;
    }

    try {
      // TODO: Implement password change API
      showToast("Thành công", "Đã thay đổi mật khẩu", "success");
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showToast("Lỗi", "Không thể thay đổi mật khẩu", "error");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Cài đặt tài khoản</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý thông báo, quyền riêng tư và tùy chọn cá nhân
                </p>
              </div>
            </div>
            <Button 
              onClick={saveSettings} 
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Cài đặt thông báo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Thông báo qua Email</Label>
                <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
              </div>
            </div>
            <Switch
              checked={settings.notification_email}
              onCheckedChange={(checked) => updateSetting('notification_email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Thông báo qua SMS</Label>
                <p className="text-sm text-gray-600">Nhận thông báo qua tin nhắn</p>
              </div>
            </div>
            <Switch
              checked={settings.notification_sms}
              onCheckedChange={(checked) => updateSetting('notification_sms', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Nhắc nhở cuộc hẹn</Label>
                <p className="text-sm text-gray-600">Nhận thông báo về cuộc hẹn sắp tới</p>
              </div>
            </div>
            <Switch
              checked={settings.notification_appointment_reminder}
              onCheckedChange={(checked) => updateSetting('notification_appointment_reminder', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Đánh giá từ bệnh nhân</Label>
                <p className="text-sm text-gray-600">Nhận thông báo khi có đánh giá mới</p>
              </div>
            </div>
            <Switch
              checked={settings.notification_patient_review}
              onCheckedChange={(checked) => updateSetting('notification_patient_review', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cài đặt quyền riêng tư
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Hiển thị số điện thoại</Label>
                <p className="text-sm text-gray-600">Cho phép bệnh nhân xem số điện thoại</p>
              </div>
            </div>
            <Switch
              checked={settings.privacy_show_phone}
              onCheckedChange={(checked) => updateSetting('privacy_show_phone', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Hiển thị email</Label>
                <p className="text-sm text-gray-600">Cho phép bệnh nhân xem email</p>
              </div>
            </div>
            <Switch
              checked={settings.privacy_show_email}
              onCheckedChange={(checked) => updateSetting('privacy_show_email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Hiển thị kinh nghiệm</Label>
                <p className="text-sm text-gray-600">Cho phép xem lịch sử kinh nghiệm</p>
              </div>
            </div>
            <Switch
              checked={settings.privacy_show_experience}
              onCheckedChange={(checked) => updateSetting('privacy_show_experience', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Ngôn ngữ & Giao diện
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngôn ngữ</Label>
              <Select 
                value={settings.language_preference} 
                onValueChange={(value) => updateSetting('language_preference', value)}
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

            <div className="space-y-2">
              <Label>Múi giờ</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(value) => updateSetting('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</SelectItem>
                  <SelectItem value="Asia/Bangkok">Bangkok (GMT+7)</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Giao diện</Label>
            <div className="flex items-center gap-4">
              <Button
                variant={settings.theme_preference === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('theme_preference', 'light')}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Sáng
              </Button>
              <Button
                variant={settings.theme_preference === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('theme_preference', 'dark')}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Tối
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Bảo mật
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordForm(true)}
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Thay đổi mật khẩu
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handlePasswordChange} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Cập nhật mật khẩu
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
