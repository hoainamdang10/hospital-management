'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Shield, Settings, LogOut, KeyRound, Camera } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { BasicInfoTab } from '@/components/profile/BasicInfoTab';
import { EmergencyContactTab } from '@/components/profile/EmergencyContactTab';
import { InsuranceTab } from '@/components/profile/InsuranceTab';
import { ContactInfoTab } from '@/components/profile/ContactInfoTab';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';
import { PatientProfile, EmergencyContact, InsuranceInfo } from '@/lib/types/profile';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePatient } from '@/hooks/usePatient';
import { patientService } from '@/lib/api/patient.service';
import { authService } from '@/lib/api/auth.service';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Patient Profile Page with Tabs
 * Route: /patient/profile
 */
export default function PatientProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { patientId } = usePatient();
  const [activeTab, setActiveTab] = useState<
    'basic' | 'contact' | 'emergency' | 'insurance' | 'settings'
  >('basic');
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
      const contacts = await patientService
        .getEmergencyContacts(patientId!)
        .catch(() => ({ contacts: [] }));
      const insurance = await patientService
        .getInsurance(patientId!)
        .catch(() => ({ insuranceInfo: null }));
      const pi = (p as any).personalInfo || (p as any).personInfo || {};
      const ci = (p as any).contactInfo || (p as any).contact || {};
      const bmi = (p as any).basicMedicalInfo || {};
      const fullName = (p as any).fullName || pi.fullName || user?.fullName || '';
      const derivedFirst = fullName
        ? fullName.trim().split(' ').slice(-1).join(' ')
        : (p as any).firstName || pi.firstName || '';
      const derivedLast = fullName
        ? fullName.trim().split(' ').slice(0, -1).join(' ')
        : (p as any).lastName || pi.lastName || '';
      setProfile({
        id: (p as any).patientId || (p as any).id,
        firstName: (p as any).firstName || pi.firstName || derivedFirst || '',
        lastName: (p as any).lastName || pi.lastName || derivedLast || '',
        fullName: fullName,
        dateOfBirth: (p as any).dateOfBirth || pi.dateOfBirth || '',
        gender: ((p as any).gender || pi.gender || 'other') as any,
        bloodType: (p as any).bloodType || bmi.bloodType || pi.bloodType || '',
        email: (p as any).email || ci.email || user?.email || '',
        phone: (p as any).phoneNumber || ci.primaryPhone || '',
        address: (ci.address && ci.address.street) || (p as any).address || ci.addressLine || '',
        city: (ci.address && ci.address.city) || (p as any).city || '',
        district: (ci.address && ci.address.district) || '',
        ward: (ci.address && ci.address.ward) || '',
        postalCode: (ci.address && (ci.address as any).postalCode) || '',
        preferredContactMethod: ((p as any).preferredContactMethod ||
          ci.preferredContactMethod ||
          (ci.contactPreferences && ci.contactPreferences.preferredMethod) ||
          undefined) as PatientProfile['preferredContactMethod'],
        emergencyContacts: (contacts.contacts || []).map((c: any) => ({
          id: c.id || c.contactId,
          name: c.name,
          relationship: c.relationship,
          phone: c.phoneNumber || c.primaryPhone || '',
          email: c.email,
          address: c.address,
          isPrimary: !!c.isPrimary,
        })),
        insurance: insurance.insuranceInfo || (p as any).insuranceInfo || null,
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
      const current = await patientService
        .getEmergencyContacts(patientId)
        .catch(() => ({ contacts: [] }));
      const newById = new Map((contacts || []).map((c) => [c.id, c]));
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
      const payload = {
        insuranceId: insurance.insuranceId,
        provider: insurance.provider,
        policyNumber: insurance.policyNumber,
        groupNumber: insurance.groupNumber,
        coverageType: insurance.coverageType as any,
        validFrom: insurance.validFrom,
        validTo: insurance.validTo,
        bhytNumber: insurance.bhytNumber,
        isPrimary: insurance.isPrimary ?? true,
        isActive: insurance.isActive ?? true,
      } as any;

      if (profile?.insurance) {
        await patientService.updateInsurance(patientId, payload);
        toast.success('Cập nhật bảo hiểm thành công');
      } else {
        await patientService.addInsurance(patientId, payload);
        toast.success('Đã thêm thông tin bảo hiểm');
      }
      await loadProfile();
    } catch (error) {
      toast.error('Không thể lưu thông tin bảo hiểm');
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
      <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-gray-600">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10" />
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />

          <div className="relative p-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-6">
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-4xl font-bold text-white shadow-lg">
                    {profile?.firstName?.charAt(0)}
                    {profile?.lastName?.charAt(0)}
                  </div>
                  <button className="absolute right-0 bottom-0 rounded-full bg-white p-2 shadow-md transition-transform hover:scale-110">
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                </motion.div>

                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {profile?.fullName || user?.fullName || '—'}
                  </h2>
                  <div className="mt-2 flex flex-col gap-1 text-gray-600">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Email:</span>
                      {user?.email || profile?.email || '—'}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Mã bệnh nhân:</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700">
                        {patientId || '—'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <ChangePasswordDialog
                  userId={user?.userId}
                  trigger={
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!user?.userId}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <KeyRound className="h-4 w-4" />
                      Đổi mật khẩu
                    </motion.button>
                  }
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await authService.logout();
                    router.push('/auth/login');
                  }}
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-100 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <div className="space-y-6">
          <div className="scrollbar-hide overflow-x-auto pb-2">
            <div className="inline-flex items-center rounded-2xl border border-white/20 bg-white/80 p-1.5 shadow-sm ring-1 ring-black/5 backdrop-blur-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:bg-gray-50/50 hover:text-gray-900'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl bg-blue-50/80 shadow-sm ring-1 ring-blue-100"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon
                        className={`h-4 w-4 transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                      />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-[400px] rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl ring-1 shadow-blue-900/5 ring-white/60 backdrop-blur-xl md:p-8">
            <AnimatePresence mode="wait">
              {authRequired || (!user && !loading) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="mb-4 rounded-full bg-blue-50 p-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Yêu cầu đăng nhập</h3>
                  <p className="mt-2 mb-6 max-w-sm text-gray-500">
                    Vui lòng đăng nhập để xem và quản lý thông tin hồ sơ cá nhân của bạn.
                  </p>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="rounded-full bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-transform hover:scale-105 hover:bg-blue-700"
                  >
                    Đăng nhập ngay
                  </button>
                </motion.div>
              ) : loading ? (
                <ProfileSkeleton />
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
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
                    <InsuranceTab
                      insurance={profile?.insurance || null}
                      onUpdate={handleUpdateInsurance}
                    />
                  )}
                  {activeTab === 'settings' && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 rounded-full bg-gray-50 p-4">
                        <Settings className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Tính năng đang phát triển
                      </h3>
                      <p className="mt-2 text-gray-500">
                        Chúng tôi đang cập nhật thêm các tùy chọn cài đặt cho tài khoản của bạn.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-10 w-full rounded-xl bg-gray-50" />
          </div>
        ))}
      </div>
      <div className="h-px bg-gray-100" />
      <div className="grid gap-8 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-10 w-full rounded-xl bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
