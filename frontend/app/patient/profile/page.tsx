'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Shield, Settings, LogOut, KeyRound } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { BasicInfoTab } from '@/components/profile/BasicInfoTab';
import { EmergencyContactTab } from '@/components/profile/EmergencyContactTab';
import { InsuranceTab } from '@/components/profile/InsuranceTab';
import { ContactInfoTab } from '@/components/profile/ContactInfoTab';
import { PatientProfile, EmergencyContact, InsuranceInfo } from '@/lib/types/profile';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePatient } from '@/hooks/usePatient';
import { patientService } from '@/lib/api/patient.service';
import { authService } from '@/lib/api/auth.service';
import { useRouter } from 'next/navigation';

/**
 * Patient Profile Page with Tabs
 * Route: /patient/profile
 */
export default function PatientProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { patientId } = usePatient();
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'emergency' | 'insurance' | 'settings'>('basic');
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    if (patientId) loadProfile();
  }, [patientId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const p = await patientService.getPatientProfile(patientId!);
      const contacts = await patientService.getEmergencyContacts(patientId!).catch(() => ({ contacts: [] }));
      const insurance = await patientService.getInsurance(patientId!).catch(() => ({ insuranceInfo: null }));
      const pi = (p as any).personalInfo || (p as any).personInfo || {};
      const ci = (p as any).contactInfo || (p as any).contact || {};
      const bmi = (p as any).basicMedicalInfo || {};
      const fullName = (p as any).fullName || pi.fullName || user?.fullName || '';
      const derivedFirst = fullName ? fullName.trim().split(' ').slice(-1).join(' ') : ((p as any).firstName || pi.firstName || '');
      const derivedLast = fullName ? fullName.trim().split(' ').slice(0, -1).join(' ') : ((p as any).lastName || pi.lastName || '');
      setProfile({
        id: (p as any).patientId || (p as any).id,
        firstName: (p as any).firstName || pi.firstName || derivedFirst || '',
        lastName: (p as any).lastName || pi.lastName || derivedLast || '',
        fullName: fullName,
        dateOfBirth: (p as any).dateOfBirth || pi.dateOfBirth || '',
        gender: (((p as any).gender || pi.gender || 'other') as any),
        bloodType: (p as any).bloodType || bmi.bloodType || pi.bloodType || '',
        email: (p as any).email || ci.email || user?.email || '',
        phone: (p as any).phoneNumber || ci.primaryPhone || '',
        address: ((ci.address && ci.address.street) || (p as any).address || ci.addressLine || ''),
        city: ((ci.address && ci.address.city) || (p as any).city || ''),
        district: (ci.address && ci.address.district) || '',
        ward: (ci.address && ci.address.ward) || '',
        postalCode: (ci.address && (ci.address as any).postalCode) || '',
        emergencyContacts: (contacts.contacts || []).map((c: any) => ({
          id: c.contactId,
          name: c.name,
          relationship: c.relationship,
          phone: c.phoneNumber,
          email: c.email,
          address: c.address,
          isPrimary: !!c.isPrimary,
        })),
        insurance: insurance.insuranceInfo || null,
        createdAt: p.createdAt || '',
        updatedAt: p.updatedAt || '',
      });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setAuthRequired(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(data: Partial<PatientProfile>) {
    try {
      if (!patientId) return;
      const payload: any = {};
      if (data.lastName || data.firstName) {
        const fn = (data.lastName || '') + ' ' + (data.firstName || '');
        payload.fullName = (data.fullName ?? fn).trim();
      }
      if (data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth;
      if (data.gender) payload.gender = data.gender as any;
      if (data.bloodType) payload.bloodType = data.bloodType as any;
      if (data.phone) payload.primaryPhone = data.phone;
      if (data.email) payload.email = data.email;
      const address: any = {};
      if (data.address) address.street = data.address;
      if (data.ward) address.ward = data.ward;
      if (data.district) address.district = data.district;
      if (data.city) address.city = data.city;
      if (data.city && !address.province) address.province = data.city;
      if (data.postalCode) address.postalCode = data.postalCode;
      address.country = 'Việt Nam';
      if (Object.keys(address).length) payload.address = address;
      if ((data as any).preferredContactMethod) {
        const m = String((data as any).preferredContactMethod).toLowerCase();
        payload.preferredContactMethod = m as any;
      }
      await patientService.updatePatientProfile(patientId, payload);
      await loadProfile();
      toast.success('Cập nhật thông tin thành công');
    } catch (error) {
      toast.error('Không thể cập nhật thông tin');
      throw error;
    }
  }

  async function handleUpdateEmergencyContacts(contacts: EmergencyContact[]) {
    try {
      if (!patientId) return;
      const current = await patientService.getEmergencyContacts(patientId).catch(() => ({ contacts: [] }));
      const newById = new Map((contacts || []).map(c => [c.id, c]));
      for (const existing of current.contacts || []) {
        if (!newById.has(existing.contactId)) {
          if (existing.contactId) {
            try {
              await patientService.deleteEmergencyContact(patientId, existing.contactId);
            } catch {}
          }
        }
      }
      for (const c of contacts || []) {
        if (c.id) {
          await patientService.updateEmergencyContact(patientId, c.id, {
            name: c.name,
            relationship: c.relationship,
            phoneNumber: c.phone,
            email: c.email,
            address: c.address,
          } as any);
        } else {
          await patientService.addEmergencyContact(patientId, {
            name: c.name,
            relationship: c.relationship,
            phoneNumber: c.phone,
            email: c.email,
            address: c.address,
            isPrimary: !!c.isPrimary,
          } as any);
        }
      }
      await loadProfile();
      toast.success('Cập nhật liên hệ khẩn cấp thành công');
    } catch (error) {
      toast.error('Không thể cập nhật liên hệ khẩn cấp');
      throw error;
    }
  }

  async function handleUpdateInsurance(insurance: InsuranceInfo) {
    try {
      if (!patientId) return;
      await patientService.updateInsurance(patientId, {
        insuranceId: insurance.insuranceId,
        provider: insurance.provider,
        policyNumber: insurance.policyNumber,
        groupNumber: insurance.groupNumber,
        coverageType: insurance.coverageType as any,
        validFrom: insurance.validFrom,
        validTo: insurance.validTo,
        isActive: insurance.status === 'active',
      } as any);
      await loadProfile();
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
      id: 'contact' as const,
      label: 'Thông tin liên hệ',
      icon: Phone,
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

        <div className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-blue-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-600 text-3xl font-bold text-white">
                {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile?.fullName || user?.fullName || '—'}</h2>
                <p className="text-gray-600 mt-1">{user?.email || profile?.email || '—'}</p>
                <p className="text-sm text-gray-500 mt-1">Mã bệnh nhân: {patientId || '—'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push('/auth/change-password')} className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><KeyRound className="h-4 w-4" />Đổi mật khẩu</button>
              <button onClick={async () => { await authService.logout(); router.push('/auth/login'); }} className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><LogOut className="h-4 w-4" />Đăng xuất</button>
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

          <div className="p-6">
            {authRequired || (!user && !loading) ? (
              <div className="text-center py-16">
                <p className="text-gray-600 mb-4">Bạn cần đăng nhập để xem hồ sơ cá nhân.</p>
                <button onClick={() => router.push('/auth/login')} className="rounded-full bg-blue-600 px-6 py-3 text-white text-sm hover:bg-blue-700">Đăng nhập</button>
              </div>
            ) : loading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Đang tải...</div>
            ) : (
              <>
                {activeTab === 'basic' && profile && (
                  <BasicInfoTab profile={profile} onUpdate={handleUpdateProfile} />
                )}
                {activeTab === 'contact' && profile && (
                  <ContactInfoTab profile={profile} onUpdate={handleUpdateProfile} />
                )}
                {activeTab === 'emergency' && profile && (
                  <EmergencyContactTab
                    contacts={profile.emergencyContacts}
                    onUpdate={handleUpdateEmergencyContacts}
                  />
                )}
                {activeTab === 'insurance' && (
                  <InsuranceTab insurance={profile?.insurance || null} onUpdate={handleUpdateInsurance} />
                )}
                {activeTab === 'settings' && (
                  <div className="text-center py-12 text-gray-500">Đang phát triển</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
