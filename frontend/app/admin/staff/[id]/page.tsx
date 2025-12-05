'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import {
  getStaffById,
  updateStaffInfo,
  suspendStaff,
  reactivateStaff,
  assignStaffToDepartment,
} from '@/lib/api/staff.service';
import { getDepartments } from '@/lib/api/departments.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Banknote,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Clock,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptCode, setDeptCode] = useState('');
  const [consultationFee, setConsultationFee] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const s = await getStaffById(params.id as string);
      setStaff(s);
      setConsultationFee(((s as any).consultationFee ?? '').toString());
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải thông tin nhân viên');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) load();
  }, [params.id]);

  const saveProfile = async () => {
    if (!staff) return;
    setSaving(true);
    try {
      const data: any = {
        staffId: staff.staffId,
        consultationFee: consultationFee ? Number(consultationFee) : null,
      };
      await updateStaffInfo(staff.staffId, data);
      await load();
      toast.success('Cập nhật thông tin thành công!');
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const assignDepartment = async () => {
    if (!staff || !deptCode) return;
    const target = departments.find((d) => d.code === deptCode);
    if (!target) return;
    setLoading(true);
    try {
      await assignStaffToDepartment(staff.staffId, {
        departmentId: target.id,
        departmentName: target.nameVi || target.nameEn || target.code,
        isPrimary: true,
      });
      toast.success('Gán khoa thành công!');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Gán khoa thất bại');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!staff) return;
    setLoading(true);
    try {
      if (String(staff.status).toLowerCase() === 'suspended') {
        await reactivateStaff(staff.staffId);
        toast.success('Đã kích hoạt lại nhân viên');
      } else {
        await suspendStaff(staff.staffId);
        toast.success('Đã tạm nghỉ nhân viên');
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Thay đổi trạng thái thất bại');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Đang hoạt động
        </span>
      );
    } else if (normalizedStatus === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
          <XCircle className="h-3.5 w-3.5" />
          Tạm nghỉ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
        {status}
      </span>
    );
  };

  const getEmploymentLabel = (type: string) => {
    const map: { [key: string]: string } = {
      full_time: 'Toàn thời gian',
      part_time: 'Bán thời gian',
      contract: 'Hợp đồng',
      intern: 'Thực tập',
      volunteer: 'Tình nguyện',
    };
    return map[type] || type;
  };

  if (loading && !staff) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
          <p className="mt-4 text-sm text-slate-500">Đang tải thông tin nhân viên...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !staff) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <p className="mt-4 text-lg font-medium text-slate-900">Không thể tải dữ liệu</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <Button onClick={() => router.back()} className="mt-6" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-lg font-semibold">Chỉnh sửa nhân viên</span>
            </button>
            <Button
              onClick={saveProfile}
              disabled={saving}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-700 hover:to-blue-700"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-6xl px-6 py-8">
          {staff && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Card */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {/* Avatar Header */}
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white backdrop-blur-sm">
                      {staff.personalInfo?.fullName?.split(' ').pop()?.[0] || 'N'}
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-white">
                      {staff.personalInfo?.fullName || 'Chưa có tên'}
                    </h2>
                    <p className="mt-1 capitalize text-cyan-100">
                      {staff.staffType || 'Nhân viên'}
                    </p>
                    <div className="mt-3">{getStatusBadge(staff.status)}</div>
                  </div>

                  {/* Info List */}
                  <div className="divide-y divide-slate-100 p-4">
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50">
                        <Mail className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="truncate text-sm font-medium text-slate-900">
                          {staff.personalInfo?.email || 'Chưa cập nhật'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">Điện thoại</p>
                        <p className="text-sm font-medium text-slate-900">
                          {staff.personalInfo?.phoneNumber || 'Chưa cập nhật'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                        <FileText className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">Mã nhân viên</p>
                        <p className="font-mono text-sm font-medium text-slate-900">
                          {staff.staffId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">Hình thức làm việc</p>
                        <p className="text-sm font-medium text-slate-900">
                          {getEmploymentLabel(staff.employmentType || 'full_time')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="border-t border-slate-100 p-4">
                    <Button
                      variant="outline"
                      onClick={toggleStatus}
                      disabled={loading}
                      className={`w-full ${String(staff.status).toLowerCase() === 'suspended'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                    >
                      {String(staff.status).toLowerCase() === 'suspended' ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Kích hoạt lại
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Tạm nghỉ
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Edit Forms */}
              <motion.div variants={itemVariants} className="space-y-6 lg:col-span-2">
                {/* Consultation Fee */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Thông tin hợp đồng</h3>
                        <p className="text-sm text-slate-500">Cập nhật phí tư vấn cho bác sĩ</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Phí tư vấn (VND)
                      </label>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={consultationFee}
                          onChange={(e) => setConsultationFee(e.target.value)}
                          placeholder="Nhập số tiền..."
                          className="pl-10"
                          type="number"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Để trống nếu không áp dụng phí tư vấn
                      </p>
                    </div>
                  </div>
                </div>

                {/* Department Assignment */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Phân khoa</h3>
                        <p className="text-sm text-slate-500">Gán nhân viên vào khoa phòng</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-6 flex gap-3">
                      <div className="flex-1">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Chọn khoa
                        </label>
                        <select
                          value={deptCode}
                          onChange={(e) => setDeptCode(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="">-- Chọn khoa --</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.code}>
                              {d.nameVi} ({d.nameEn})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={assignDepartment}
                          disabled={loading || !deptCode}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                        >
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Gán khoa
                        </Button>
                      </div>
                    </div>

                    {/* Current Departments */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Building2 className="h-4 w-4" />
                        Khoa hiện tại
                      </h4>
                      <div className="space-y-2">
                        {(staff.departmentAssignments || staff.department_assignments || []).length > 0 ? (
                          (staff.departmentAssignments || staff.department_assignments || []).map(
                            (a: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-4 py-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                    <Building2 className="h-4 w-4 text-emerald-600" />
                                  </div>
                                  <span className="font-medium text-slate-900">
                                    {a.departmentNameVi || a.departmentCode}
                                  </span>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                  {a.role || 'Thành viên'}
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <Building2 className="h-10 w-10 text-slate-300" />
                            <p className="mt-2 text-sm text-slate-500">Chưa được gán khoa nào</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}