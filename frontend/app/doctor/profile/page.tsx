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
  Heart,
  Sparkles,
  Shield,
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
import { cn } from '@/lib/utils';

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
  const { user, isLoading: isAuthLoading, updateUser } = useAuth();
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
            data.professionalInfo?.department || 'Chưa cập nhật';
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

          if (data.professionalInfo?.department) {
            const deptCode = data.professionalInfo.department;
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
              if (deptResponse.success && deptResponse.data.nameVi) {
                setDepartmentName(deptResponse.data.nameVi);
              } else {
                setDepartmentName(departmentMapping[deptCode] || deptCode);
              }
            } catch (err) {
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

      if (user?.userId) {
        const fresh = await getStaffByUserId(user.userId);
        if (fresh) {
          setStaff(fresh);
          const addr = fresh.personalInfo?.address;
          const education = fresh.professionalInfo?.education || [];
          const languageList = fresh.professionalInfo?.languages || [];
          const specialization =
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
          // Update AuthContext user to refresh header
          if (updateUser && user && fresh.personalInfo?.fullName) {
            updateUser({
              ...user,
              fullName: fresh.personalInfo.fullName,
            });
          }
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
        <div className="space-y-6 p-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen space-y-6 pb-10">
        {/* Premium Header with Healthcare Theme */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 p-8 text-white shadow-xl"
        >
          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
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
                <Avatar className="h-28 w-28 border-4 border-white/30 shadow-2xl lg:h-32 lg:w-32">
                  <AvatarImage src={(staff?.personalInfo as any)?.avatar} alt={staff?.personalInfo?.fullName} />
                  <AvatarFallback className="bg-white/20 text-3xl font-bold text-white backdrop-blur-md lg:text-4xl">
                    {staff?.personalInfo?.fullName?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'BS'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-teal-600 bg-emerald-400 shadow-lg" />
              </motion.div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
                  {staff?.personalInfo?.fullName || 'Bác sĩ'}
                </h1>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-lg font-medium text-cyan-100">
                    <Heart className="h-5 w-5" />
                    {form.specialization}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cyan-100/80">
                    <Mail className="h-4 w-4" />
                    {form.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cyan-100/80">
                    <Building2 className="h-4 w-4" />
                    Khoa: {departmentName || form.specialization}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2.5 w-36 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className={cn(
                        'h-full rounded-full',
                        completionRate === 100 ? 'bg-emerald-300' : 'bg-amber-300'
                      )}
                    />
                  </div>
                  <span className="text-sm font-medium text-white/80">
                    {completionRate}% hoàn thiện
                  </span>
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
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={isSaving}
                  className="rounded-xl bg-white px-6 py-2.5 font-semibold text-teal-700 shadow-lg transition-all hover:bg-teal-50"
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mr-2 h-4 w-4 rounded-full border-2 border-teal-600 border-t-transparent"
                      />
                      Đang lưu...
                    </>
                  ) : isEditing ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Lưu thay đổi
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

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5">
            <TabsTrigger
              value="personal"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
            >
              <User className="mr-2 h-4 w-4" />
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger
              value="professional"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
            >
              <Award className="mr-2 h-4 w-4" />
              Thông tin nghề nghiệp
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Lịch làm việc
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              {/* Gradient accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />

              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100">
                  <User className="h-6 w-6 text-cyan-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h2>
                  <p className="text-sm text-slate-500">Thông tin chi tiết về bác sĩ</p>
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              {/* Gradient accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                  <Award className="h-6 w-6 text-violet-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Thông tin nghề nghiệp</h2>
                  <p className="text-sm text-slate-500">Kinh nghiệm và chứng chỉ</p>
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
                  icon={Shield}
                />
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <FileText className="h-4 w-4" />
                  Giới thiệu
                </label>
                {isEditing ? (
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                    rows={4}
                    placeholder="Giới thiệu về bản thân và kinh nghiệm..."
                  />
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 leading-relaxed text-slate-700">
                    {form.bio || 'Chưa có thông tin giới thiệu.'}
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              {/* Gradient accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                  <Calendar className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Lịch làm việc</h2>
                  <p className="text-sm text-slate-500">Thời gian làm việc trong tuần</p>
                </div>
              </div>

              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Ngày</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Buổi sáng</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Buổi chiều</div>
                </div>

                {/* Schedule Rows */}
                {scheduleRows.map((row, i) => (
                  <ScheduleRow
                    key={row.day}
                    day={row.day}
                    morning={row.morning}
                    afternoon={row.afternoon}
                    isOff={!row.working}
                    index={i}
                  />
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
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
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </label>

      {isEditing && !readOnly ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
          placeholder={`Nhập ${label.toLowerCase()}...`}
        />
      ) : (
        <div className={cn(
          'relative flex items-center justify-between rounded-xl px-4 py-3 transition-colors',
          isEditing ? 'border border-slate-200 bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-50'
        )}>
          <span className={cn(
            'font-medium',
            !value || value === 'Chưa cập nhật' ? 'italic text-slate-400' : 'text-slate-900'
          )}>
            {value || 'Chưa cập nhật'}
          </span>
          {isEditing && readOnly && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
              <Lock className="h-3 w-3" />
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
  index = 0,
}: {
  day: string;
  morning: string;
  afternoon: string;
  isOff?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'grid grid-cols-3 gap-4 rounded-xl px-4 py-4 transition-all',
        isOff ? 'bg-slate-50/50' : 'hover:bg-cyan-50/30'
      )}
    >
      <div className="flex items-center gap-3 font-medium text-slate-900">
        <div className={cn(
          'h-3 w-3 rounded-full ring-2 ring-offset-2',
          isOff
            ? 'bg-slate-300 ring-slate-100'
            : 'bg-emerald-500 ring-emerald-100'
        )} />
        {day}
      </div>
      <div className={cn(
        'flex items-center gap-2 text-sm',
        morning === 'Nghỉ' ? 'text-slate-400' : 'font-medium text-slate-700'
      )}>
        {morning !== 'Nghỉ' && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-100">
            <Clock className="h-3.5 w-3.5 text-cyan-600" />
          </div>
        )}
        {morning}
      </div>
      <div className={cn(
        'flex items-center gap-2 text-sm',
        afternoon === 'Nghỉ' ? 'text-slate-400' : 'font-medium text-slate-700'
      )}>
        {afternoon !== 'Nghỉ' && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-100">
            <Clock className="h-3.5 w-3.5 text-teal-600" />
          </div>
        )}
        {afternoon}
      </div>
    </motion.div>
  );
}
