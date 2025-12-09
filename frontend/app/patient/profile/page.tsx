'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Shield,
  Settings,
  LogOut,
  KeyRound,
  Camera,
  Mail,
  Heart,
  MapPin,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { showErrorToast } from '@/lib/utils/error-toast';

/**
 * Normalize address from various formats to a consistent object
 */
function normalizeAddress(addressSource: any): any {
  if (!addressSource) return {};
  if (typeof addressSource === 'string') {
    return { address: addressSource, street: addressSource };
  }
  if (typeof addressSource === 'object') {
    return {
      street: addressSource.street || addressSource.addressLine || addressSource.line1 || '',
      address: addressSource.address || addressSource.street || '',
      addressLine: addressSource.addressLine || addressSource.street || '',
      line1: addressSource.line1 || addressSource.street || '',
      city: addressSource.city || addressSource.province || '',
      province: addressSource.province || addressSource.city || '',
      district: addressSource.district || '',
      ward: addressSource.ward || '',
      postalCode: addressSource.postalCode || addressSource.zip || '',
      zip: addressSource.zip || addressSource.postalCode || '',
    };
  }
  return {};
}

/**
 * Patient Profile Page with Tabs
 * Route: /patient/profile
 */
export default function PatientProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
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
        .catch(() => ({ patientId: patientId!, contacts: [], totalCount: 0 }));
      const insurance = await patientService
        .getInsurance(patientId!)
        .catch(() => ({ patientId: patientId!, insuranceInfo: null, hasInsurance: false }));
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
      const addressSource =
        ci.address ||
        (p as any).address ||
        ci.addressLine ||
        pi.address ||
        (p as any).primaryAddress ||
        '';
      const parsedAddress = normalizeAddress(addressSource);
      const addressLine =
        parsedAddress.street ||
        parsedAddress.address ||
        parsedAddress.addressLine ||
        parsedAddress.line1 ||
        (typeof addressSource === 'string' ? addressSource : '');

      const resolvedCity =
        parsedAddress.city || parsedAddress.province || ci.city || (p as any).city || '';
      const resolvedDistrict = parsedAddress.district || ci.district || '';
      const resolvedWard = parsedAddress.ward || ci.ward || '';
      const resolvedPostal = parsedAddress.postalCode || parsedAddress.zip || ci.postalCode || '';

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
        address: addressLine,
        city: resolvedCity,
        district: resolvedDistrict,
        ward: resolvedWard,
        postalCode: resolvedPostal,
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

      // Update the user in AuthContext so header displays updated name
      if (user && payload.fullName) {
        updateUser({
          ...user,
          fullName: payload.fullName,
        });
      }

      toast.success('Cập nhật thông tin thành công');
    } catch (error) {
      showErrorToast(error, {
        title: 'Không thể cập nhật thông tin',
        fallbackMessage: 'Không thể cập nhật thông tin cá nhân. Vui lòng thử lại sau.',
        context: 'Patient/Profile:update-basic',
      });
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
      showErrorToast(error, {
        title: 'Không thể cập nhật liên hệ khẩn cấp',
        fallbackMessage: 'Không thể cập nhật liên hệ khẩn cấp. Vui lòng thử lại.',
        context: 'Patient/Profile:update-emergency',
      });
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
      showErrorToast(error, {
        title: 'Không thể lưu thông tin bảo hiểm',
        fallbackMessage: 'Không thể lưu thông tin bảo hiểm. Vui lòng thử lại.',
        context: 'Patient/Profile:update-insurance',
      });
      throw error;
    }
  }

  const tabs = [
    { id: 'basic' as const, label: 'Thông tin cơ bản', icon: User },
    { id: 'contact' as const, label: 'Thông tin liên hệ', icon: Phone },
    { id: 'emergency' as const, label: 'Liên hệ khẩn cấp', icon: AlertCircle },
    { id: 'insurance' as const, label: 'Bảo hiểm y tế', icon: Shield },
    { id: 'settings' as const, label: 'Cài đặt', icon: Settings },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen space-y-6 pb-10">
        {/* Premium Header with Healthcare Theme */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-xl"
        >
          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="absolute -inset-1 rounded-full bg-white/30 blur-sm" />
                <Avatar className="h-24 w-24 border-4 border-white/30 shadow-2xl lg:h-28 lg:w-28">
                  <AvatarImage src={(profile as any)?.avatar} alt={profile?.fullName} />
                  <AvatarFallback className="bg-white/20 text-2xl font-bold text-white backdrop-blur-md lg:text-3xl">
                    {profile?.fullName?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'BN'}
                  </AvatarFallback>
                </Avatar>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-1 bottom-1 rounded-full border-2 border-white bg-emerald-500 p-2 text-white shadow-lg transition-colors hover:bg-emerald-600"
                >
                  <Camera className="h-4 w-4" />
                </motion.button>
              </motion.div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
                  {profile?.fullName || user?.fullName || 'Bệnh nhân'}
                </h1>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-emerald-100">
                    <Mail className="h-4 w-4" />
                    {user?.email || profile?.email || '—'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-emerald-100/80">
                    <Heart className="h-4 w-4" />
                    <span>ID: </span>
                    <code className="rounded bg-white/20 px-2 py-0.5 font-mono text-xs">
                      {patientId || '—'}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <ChangePasswordDialog
                userId={user?.userId}
                trigger={
                  <Button
                    type="button"
                    disabled={!user?.userId}
                    className="rounded-xl border border-white/30 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Đổi mật khẩu
                  </Button>
                }
              />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={async () => {
                    await authService.logout();
                    router.push('/auth/login');
                  }}
                  className="rounded-xl border border-rose-200/30 bg-rose-500/90 px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:bg-rose-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
          <div className="scrollbar-hide flex gap-1 overflow-x-auto">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {authRequired || (!user && !loading) ? (
              <motion.div
                key="auth-required"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm"
              >
                <div className="mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 p-4">
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Yêu cầu đăng nhập</h3>
                <p className="mt-2 mb-6 max-w-sm text-slate-500">
                  Vui lòng đăng nhập để xem và quản lý thông tin hồ sơ cá nhân của bạn.
                </p>
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 font-semibold shadow-lg hover:from-emerald-700 hover:to-teal-700"
                >
                  Đăng nhập ngay
                </Button>
              </motion.div>
            ) : loading ? (
              <ProfileSkeleton />
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
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
                    insurance={profile?.insurance || undefined}
                    onUpdate={handleUpdateInsurance}
                  />
                )}
                {activeTab === 'settings' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 py-16 text-center"
                  >
                    <div className="mb-4 rounded-full bg-slate-100 p-4">
                      <Settings className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Tính năng đang phát triển
                    </h3>
                    <p className="mt-2 max-w-sm text-slate-500">
                      Chúng tôi đang cập nhật thêm các tùy chọn cài đặt cho tài khoản của bạn.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-50" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-slate-50" />
          </div>
        ))}
      </div>
      <div className="h-px bg-slate-100" />
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-slate-50" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
