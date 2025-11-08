'use client';

import { useState } from 'react';
import { User, Phone, Shield, Settings } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { BasicInfoTab } from '@/components/profile/BasicInfoTab';
import { EmergencyContactTab } from '@/components/profile/EmergencyContactTab';
import { InsuranceTab } from '@/components/profile/InsuranceTab';
import { PatientProfile, EmergencyContact, InsuranceInfo } from '@/lib/types/profile';
import { toast } from 'sonner';

/**
 * Patient Profile Page with Tabs
 * Route: /patient/profile
 */
export default function PatientProfilePage() {
  const [activeTab, setActiveTab] = useState<'basic' | 'emergency' | 'insurance' | 'settings'>('basic');

  // Mock data - replace with real API call
  const [profile] = useState<PatientProfile>({
    id: '1',
    firstName: 'Văn C',
    lastName: 'Lê',
    fullName: 'Lê Văn C',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    bloodType: 'O+',
    email: 'levanc@example.com',
    phone: '0912345678',
    address: '123 Đường ABC',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    postalCode: '700000',
    emergencyContacts: [
      {
        id: '1',
        name: 'Lê Thị D',
        relationship: 'Vợ/Chồng',
        phone: '0987654321',
        email: 'lethid@example.com',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        isPrimary: true,
      },
    ],
    insurance: {
      provider: 'Bảo hiểm xã hội Việt Nam',
      policyNumber: 'DN1234567890123',
      groupNumber: 'GRP001',
      validFrom: '2024-01-01',
      validTo: '2025-12-31',
      status: 'active',
      coverageType: 'Bảo hiểm y tế bắt buộc',
      notes: 'Bảo hiểm đầy đủ',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  });

  async function handleUpdateProfile(data: Partial<PatientProfile>) {
    try {
      // TODO: Call API to update profile
      console.log('Updating profile:', data);
      toast.success('Cập nhật thông tin thành công');
    } catch (error) {
      toast.error('Không thể cập nhật thông tin');
      throw error;
    }
  }

  async function handleUpdateEmergencyContacts(contacts: EmergencyContact[]) {
    try {
      // TODO: Call API to update emergency contacts
      console.log('Updating emergency contacts:', contacts);
      toast.success('Cập nhật liên hệ khẩn cấp thành công');
    } catch (error) {
      toast.error('Không thể cập nhật liên hệ khẩn cấp');
      throw error;
    }
  }

  async function handleUpdateInsurance(insurance: InsuranceInfo) {
    try {
      // TODO: Call API to update insurance
      console.log('Updating insurance:', insurance);
      toast.success('Cập nhật bảo hiểm thành công');
    } catch (error) {
      toast.error('Không thể cập nhật bảo hiểm');
      throw error;
    }
  }

  const tabs = [
    {
      id: 'basic' as const,
      label: 'Thông tin cơ bản',
      icon: User,
    },
    {
      id: 'emergency' as const,
      label: 'Liên hệ khẩn cấp',
      icon: Phone,
    },
    {
      id: 'insurance' as const,
      label: 'Bảo hiểm y tế',
      icon: Shield,
    },
    {
      id: 'settings' as const,
      label: 'Cài đặt',
      icon: Settings,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-gray-600">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white">
              {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
              <p className="text-gray-600 mt-1">{profile.email}</p>
              <p className="text-sm text-gray-500 mt-1">{profile.phone}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border">
          {/* Tab Navigation */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'basic' && (
              <BasicInfoTab profile={profile} onUpdate={handleUpdateProfile} />
            )}
            {activeTab === 'emergency' && (
              <EmergencyContactTab
                contacts={profile.emergencyContacts}
                onUpdate={handleUpdateEmergencyContacts}
              />
            )}
            {activeTab === 'insurance' && (
              <InsuranceTab insurance={profile.insurance} onUpdate={handleUpdateInsurance} />
            )}
            {activeTab === 'settings' && (
              <div className="text-center py-12 text-gray-500">
                <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Tính năng cài đặt đang được phát triển</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
