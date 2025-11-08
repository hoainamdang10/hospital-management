'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { patientService, type CommunicationPreferences } from '@/lib/api/patient.service';
import { toast } from 'sonner';

export default function PatientPreferencesPage() {
  const [preferences, setPreferences] = useState<CommunicationPreferences>({
    preferredMethod: 'EMAIL',
    allowEmail: true,
    allowSMS: true,
    allowPush: false,
    language: 'vi',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const patientId = 'PAT-202411-001';

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const result = await patientService.getCommunicationPreferences(patientId);
      setPreferences(result.preferences);
    } catch (err) {
      toast.error('Không thể tải tùy chọn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await patientService.updateCommunicationPreferences(patientId, preferences);
      toast.success('Lưu tùy chọn thành công');
    } catch (err) {
      toast.error('Không thể lưu tùy chọn');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof CommunicationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tùy chọn thông báo</h1>
            <p className="mt-2 text-gray-600">Quản lý cách bạn nhận thông báo</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Phương thức liên lạc ưa thích</h3>
            <div className="space-y-2">
              {(['EMAIL', 'SMS', 'PUSH', 'PHONE'] as const).map((method) => (
                <label key={method} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="preferredMethod"
                    checked={preferences.preferredMethod === method}
                    onChange={() => updatePreference('preferredMethod', method)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">{method}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center space-x-3">
              <div className="rounded-full bg-primary-100 p-3">
                <Mail className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email</h3>
                <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
              </div>
            </div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={preferences.allowEmail}
                onChange={(e) => updatePreference('allowEmail', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-gray-700">Cho phép nhận email</span>
            </label>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center space-x-3">
              <div className="rounded-full bg-primary-100 p-3">
                <MessageSquare className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">SMS</h3>
                <p className="text-sm text-gray-600">Nhận thông báo qua tin nhắn</p>
              </div>
            </div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={preferences.allowSMS}
                onChange={(e) => updatePreference('allowSMS', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-gray-700">Cho phép nhận SMS</span>
            </label>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center space-x-3">
              <div className="rounded-full bg-primary-100 p-3">
                <Bell className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Push Notification</h3>
                <p className="text-sm text-gray-600">Nhận thông báo trên ứng dụng</p>
              </div>
            </div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={preferences.allowPush}
                onChange={(e) => updatePreference('allowPush', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-gray-700">Cho phép push notification</span>
            </label>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

