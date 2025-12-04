'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Save,
  User,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Award,
  Edit,
  CheckCircle2,
  Stethoscope,
  MapPin,
  GraduationCap,
  Languages,
  FileText,
  Lock,
  KeyRound,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Staff, getStaffByUserId, updateMyStaffProfile } from '@/lib/api/staff.service';
import { getDepartmentByCode } from '@/lib/api/departments.service';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';

type FormState = {
  fullName: string;
  specialization: string;
  email: string;
  phone: string;
  address: string;
  education: string;
  title: string;
  experience: string;
  languages: string;
  license: string;
  bio: string;
};

export default function DoctorProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: '',
    specialization: '',
    email: '',
    phone: '',
    address: '',
    education: '',
    title: '',
    experience: '',
    languages: '',
    license: '',
    bio: '',
  });
  const [departmentName, setDepartmentName] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const data = await getStaffByUserId(user.userId);
        if (data) {
          setStaff(data);
          const addr = data.personalInfo?.address;
          const education = data.professionalInfo?.education || [];
          const languageList = data.professionalInfo?.languages || [];
          const specialization =
            data.specializations?.[0]?.name || data.professionalInfo?.department || 'Chưa cập nhật';
          const years =
            (data as any).yearsOfExperience ?? (data as any).employmentInfo?.yearsOfExperience ?? 0;
          const licenseOrCert =
            (data as any).licenseNumber ||
            (data.credentials && data.credentials.length > 0
              ? `${data.credentials.length} chứng chỉ`
              : null) ||
            'Chưa cập nhật';
          setForm({
            fullName: data.personalInfo?.fullName || '',
            specialization,
            email: data.personalInfo?.email || '',
            phone: data.personalInfo?.phoneNumber || '',
            address: addr
              ? (() => {
                const combined = [addr.street, addr.ward, addr.district, addr.city, addr.province, addr.country]
                  .map((part) => {
                    if (!part) return '';
                    return String(part)
                      .split(',')
                      .map((s) => s.trim())
                      .filter((s) => s && !s.toLowerCase().includes('chưa cập nhật'))
                      .join(', ');
                  })
                  .filter((part) => part && part.trim() !== '')
                  .join(', ');

                // Split by comma and deduplicate
                const allParts = combined.split(',').map((s) => s.trim()).filter(Boolean);
                const seen = new Set<string>();
                const unique = allParts.filter((part) => {
                  const normalized = part.toLowerCase();
                  if (seen.has(normalized)) return false;
                  seen.add(normalized);
                  return true;
                });

                return unique.join(', ') || 'Chưa cập nhật';
              })()
              : 'Chưa cập nhật',
            education: education.join(', '),
            title: data.professionalInfo?.title || '',
            experience: `${years} năm`,
            languages: languageList.join(', ') || 'Tiếng Việt',
            license: licenseOrCert,
            bio:
              data.professionalInfo?.bio ||
              `${data.personalInfo?.fullName || 'Bác sĩ'} với ${years || 0
              } năm kinh nghiệm tại khoa ${data.professionalInfo?.department || 'Chưa cập nhật'}.`,
          });

          // Fetch department name if department code exists
          if (data.professionalInfo?.department) {
            const deptCode = data.professionalInfo.department;
            console.log('🏥 Fetching department for code:', deptCode);

            // Fallback mapping for common departments
            const departmentMapping: { [key: string]: string } = {
              'CARD': 'Tim mạch',
              'ORTH': 'Chỉnh hình',
              'PEDI': 'Nhi khoa',
              'INTE': 'Nội tổng hợp',
              'EMER': 'Cấp cứu',
              'RADI': 'X-quang',
              'LABO': 'Xét nghiệm',
            };

            try {
              const deptResponse = await getDepartmentByCode(deptCode);
              console.log('📋 Department Response:', deptResponse);
              if (deptResponse.success && deptResponse.data.nameVi) {
                console.log('✅ Setting department name from API:', deptResponse.data.nameVi);
                setDepartmentName(deptResponse.data.nameVi);
              } else {
                // Use mapping as fallback
                setDepartmentName(departmentMapping[deptCode] || deptCode);
              }
            } catch (err) {
              console.error('❌ Failed to fetch department name, using mapping:', err);
              // Use mapping as fallback
              setDepartmentName(departmentMapping[deptCode] || deptCode);
            }
          }
        }
      } catch (err) {
        console.error('Load doctor profile failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.userId]);

  const scheduleRows = useMemo(() => {
    const daysOrder = [
      { key: 'monday', label: 'Thứ 2' },
      { key: 'tuesday', label: 'Thứ 3' },
      { key: 'wednesday', label: 'Thứ 4' },
      { key: 'thursday', label: 'Thứ 5' },
      { key: 'friday', label: 'Thứ 6' },
      { key: 'saturday', label: 'Thứ 7' },
      { key: 'sunday', label: 'Chủ nhật' },
    ] as const;
    const workingDays = new Set(
      staff?.workSchedule?.workingDays?.map((d) => d.toLowerCase()) || []
    );
    const start = staff?.workSchedule?.workingHours?.start || '08:00';
    const end = staff?.workSchedule?.workingHours?.end || '17:00';
    const daily = staff?.workSchedule?.dailySchedules;
    return daysOrder.map((d) => ({
      day: d.label,
      working: workingDays.has(d.key),
      morning: workingDays.has(d.key)
        ? `${daily?.find((x: any) => x.day?.toLowerCase() === d.key)?.start || start} - ${daily?.find((x: any) => x.day?.toLowerCase() === d.key)?.end || end
        }`
        : 'Nghỉ',
      afternoon: workingDays.has(d.key)
        ? `${daily?.find((x: any) => x.day?.toLowerCase() === d.key)?.start || start} - ${daily?.find((x: any) => x.day?.toLowerCase() === d.key)?.end || end
        }`
        : 'Nghỉ',
    }));
  }, [staff]);

  const completionRate = useMemo(() => {
    const fields = Object.values(form);
    const filled = fields.filter((f) => f && f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const handleSave = async () => {
    if (!staff) return;
    setIsSaving(true);
    try {
      const educationArray = form.education
        ? form.education
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        : [];
      const languageArray = form.languages
        ? form.languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        : [];
      const currentAddr = staff.personalInfo?.address || {};
      const addressObj =
        form.address && form.address.trim().length > 0
          ? {
            ...currentAddr,
            street: form.address.trim(),
          }
          : currentAddr && Object.keys(currentAddr).length > 0
            ? currentAddr
            : undefined;

      await updateMyStaffProfile({
        staffId: staff.staffId,
        personalInfo: {
          fullName: form.fullName || undefined,
          phoneNumber: form.phone || undefined,
          address: addressObj,
        },
        professionalInfo: {
          title: form.title || undefined,
          position: staff.professionalInfo?.position || undefined,
          education: educationArray.length ? educationArray : undefined,
          languages: languageArray.length ? languageArray : undefined,
          bio: form.bio || undefined,
        },
      });

      // Refresh data from API to reflect latest state
      if (user?.userId) {
        const fresh = await getStaffByUserId(user.userId);
        if (fresh) {
          setStaff(fresh);
          const addr = fresh.personalInfo?.address;
          const education = fresh.professionalInfo?.education || [];
          const languageList = fresh.professionalInfo?.languages || [];
          const specialization =
            fresh.specializations?.[0]?.name ||
            fresh.professionalInfo?.department ||
            'Chưa cập nhật';
          const years =
            (fresh as any).yearsOfExperience ??
            (fresh as any).employmentInfo?.yearsOfExperience ??
            0;
          const licenseOrCert =
            (fresh as any).licenseNumber ||
            (fresh.credentials && fresh.credentials.length > 0
              ? `${fresh.credentials.length} chứng chỉ`
              : null) ||
            'Chưa cập nhật';
          setForm({
            fullName: fresh.personalInfo?.fullName || '',
            specialization,
            email: fresh.personalInfo?.email || '',
            phone: fresh.personalInfo?.phoneNumber || '',
            address: addr
              ? (() => {
                const combined = [addr.street, addr.ward, addr.district, addr.city, addr.province, addr.country]
                  .map((part) => {
                    if (!part) return '';
                    return String(part)
                      .split(',')
                      .map((s) => s.trim())
                      .filter((s) => s && !s.toLowerCase().includes('chưa cập nhật'))
                      .join(', ');
                  })
                  .filter((part) => part && part.trim() !== '')
                  .join(', ');

                const allParts = combined.split(',').map((s) => s.trim()).filter(Boolean);
                const seen = new Set<string>();
                const unique = allParts.filter((part) => {
                  const normalized = part.toLowerCase();
                  if (seen.has(normalized)) return false;
                  seen.add(normalized);
                  return true;
                });

                return unique.join(', ') || 'Chưa cập nhật';
              })()
              : 'Chưa cập nhật',
            education: education.join(', '),
            title: fresh.professionalInfo?.title || '',
            experience: `${years} năm`,
            languages: languageList.join(', ') || 'Tiếng Việt',
            license: licenseOrCert,
            bio:
              fresh.professionalInfo?.bio ||
              `${fresh.personalInfo?.fullName || 'Bác sĩ'} với ${years || 0
              } năm kinh nghiệm tại khoa ${fresh.professionalInfo?.department || 'Chưa cập nhật'}.`,
          });
        }
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Save doctor profile failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl"
        >
          {/* Animated background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10 blur-3xl"
                style={{
                  width: `${200 + i * 100}px`,
                  height: `${200 + i * 100}px`,
                  left: `${10 + i * 30}%`,
                  top: `${-20 + i * 20}%`,
                }}
                animate={{
                  x: [0, 20, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="absolute -inset-1 rounded-full bg-white/30 blur-sm" />
                <Avatar className="h-28 w-28 border-4 border-white/20 shadow-2xl">
                  <AvatarImage src={(staff?.personalInfo as any)?.avatar} alt={staff?.personalInfo?.fullName} />
                  <AvatarFallback className="bg-white/10 text-3xl font-bold text-white backdrop-blur-md">
                    {staff?.personalInfo?.fullName?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'BS'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-indigo-600 bg-emerald-400 shadow-sm" />
              </motion.div>

              <div>
                <h1 className="mb-1 text-3xl font-bold tracking-tight text-white">
                  {staff?.personalInfo?.fullName || 'Bác sĩ'}
                </h1>
                <div className="flex flex-col gap-1 text-blue-100">
                  <div className="flex items-center gap-2 text-lg font-medium opacity-90">
                    <Stethoscope className="h-4 w-4" />
                    {form.specialization}
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-80">
                    <Mail className="h-3.5 w-3.5" />
                    {form.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-80">
                    <Building2 className="h-3.5 w-3.5" />
                    Khoa: {departmentName || 'Chưa cập nhật'}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-black/20 backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full ${completionRate === 100 ? 'bg-emerald-400' : 'bg-yellow-400'
                        }`}
                    />
                  </div>
                  <span className="text-xs font-medium text-white/80">
                    {completionRate}% hoàn thiện
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start">
              <ChangePasswordDialog
                userId={user?.userId}
                trigger={
                  <Button
                    type="button"
                    disabled={!user?.userId}
                    className="rounded-xl border border-white/40 bg-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Đổi mật khẩu
                  </Button>
                }
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={isSaving}
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-600 shadow-lg hover:bg-blue-50"
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mr-2 h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent"
                      />
                      Đang lưu...
                    </>
                  ) : isEditing ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Lưu
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>



        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3 rounded-xl bg-gray-100/50 p-1">
            <TabsTrigger
              value="personal"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger
              value="professional"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              Thông tin nghề nghiệp
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              Lịch làm việc
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0 outline-none">
            {/* Personal Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
                  <p className="text-sm text-gray-500">Thông tin chi tiết về bác sĩ</p>
                </div>
              </div>

              <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                <FormField
                  label="Họ và tên"
                  value={form.fullName}
                  isEditing={isEditing}
                  icon={User}
                  onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
                />
                <FormField
                  label="Chuyên khoa"
                  value={form.specialization}
                  isEditing={isEditing}
                  readOnly
                  icon={Stethoscope}
                />
                <FormField
                  label="Email"
                  value={form.email}
                  isEditing={isEditing}
                  readOnly
                  icon={Mail}
                  type="email"
                />
                <FormField
                  label="Số điện thoại"
                  value={form.phone}
                  isEditing={isEditing}
                  icon={Phone}
                  type="tel"
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                />
                <FormField
                  label="Địa chỉ"
                  value={form.address}
                  isEditing={isEditing}
                  icon={MapPin}
                  onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                />
                <FormField
                  label="Trình độ"
                  value={form.education}
                  isEditing={isEditing}
                  icon={GraduationCap}
                  onChange={(v) => setForm((f) => ({ ...f, education: v }))}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="professional" className="mt-0 outline-none">
            {/* Professional Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Thông tin nghề nghiệp</h2>
                  <p className="text-sm text-gray-500">Kinh nghiệm và chứng chỉ</p>
                </div>
              </div>

              <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                <FormField
                  label="Chức danh"
                  value={form.title}
                  isEditing={isEditing}
                  icon={Briefcase}
                  onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                />
                <FormField
                  label="Kinh nghiệm"
                  value={form.experience}
                  isEditing={isEditing}
                  readOnly
                  icon={Clock}
                />
                <FormField
                  label="Ngôn ngữ"
                  value={form.languages}
                  isEditing={isEditing}
                  icon={Languages}
                  onChange={(v) => setForm((f) => ({ ...f, languages: v }))}
                />
                <FormField
                  label="Số chứng chỉ"
                  value={form.license}
                  isEditing={isEditing}
                  readOnly
                  icon={FileText}
                />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-500">
                  <FileText className="h-4 w-4" />
                  Giới thiệu
                </label>
                {isEditing ? (
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50"
                    rows={4}
                    placeholder="Giới thiệu về bản thân và kinh nghiệm..."
                  />
                ) : (
                  <div className="rounded-xl bg-gray-50/50 p-4 text-gray-700 leading-relaxed">
                    {form.bio || 'Chưa có thông tin giới thiệu.'}
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-0 outline-none">
            {/* Schedule Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Lịch làm việc</h2>
                  <p className="text-sm text-gray-500">Thời gian làm việc trong tuần</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-4 mb-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buổi sáng</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buổi chiều</div>
                </div>

                {/* Schedule Rows */}
                {scheduleRows.map((row) => (
                  <ScheduleRow
                    key={row.day}
                    day={row.day}
                    morning={row.morning}
                    afternoon={row.afternoon}
                    isOff={!row.working}
                  />
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout >
  );
}

function FormField({
  label,
  value,
  isEditing,
  readOnly,
  icon: Icon,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  readOnly?: boolean;
  icon: any;
  type?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="group">
      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-500">
        <Icon className="h-4 w-4" />
        {label}
      </label>

      {isEditing && !readOnly ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50"
          placeholder={`Nhập ${label.toLowerCase()}...`}
        />
      ) : (
        <div className={`relative flex items-center justify-between rounded-lg px-4 py-2.5 transition-colors ${isEditing ? 'bg-gray-50 border border-gray-200' : 'hover:bg-gray-50'}`}>
          <span className={`font-medium ${!value ? 'text-gray-400 italic' : 'text-gray-900'}`}>
            {value || 'Chưa cập nhật'}
          </span>
          {isEditing && readOnly && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <Lock className="h-3.5 w-3.5" />
              <span>Không thể sửa</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScheduleRow({
  day,
  morning,
  afternoon,
  isOff = false,
}: {
  day: string;
  morning: string;
  afternoon: string;
  isOff?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.005, backgroundColor: 'rgba(59, 130, 246, 0.02)' }}
      className="grid grid-cols-3 gap-4 rounded-xl border-b border-gray-50 px-4 py-4 transition-all last:border-0"
    >
      <div className="flex items-center gap-3 font-medium text-gray-900">
        <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ${isOff ? 'bg-gray-300 ring-gray-100' : 'bg-emerald-500 ring-emerald-100'}`} />
        {day}
      </div>
      <div
        className={`flex items-center gap-2 text-sm ${morning === 'Nghỉ' ? 'text-gray-400' : 'text-gray-700 font-medium'
          }`}
      >
        {morning !== 'Nghỉ' && <Clock className="h-4 w-4 text-blue-500" />}
        {morning}
      </div>
      <div
        className={`flex items-center gap-2 text-sm ${afternoon === 'Nghỉ' ? 'text-gray-400' : 'text-gray-700 font-medium'
          }`}
      >
        {afternoon !== 'Nghỉ' && <Clock className="h-4 w-4 text-blue-500" />}
        {afternoon}
      </div>
    </motion.div>
  );
}
