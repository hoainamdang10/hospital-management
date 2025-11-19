'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { getStaffById, updateStaffInfo, suspendStaff, reactivateStaff } from '@/lib/api/staff.service';
import { getDepartments } from '@/lib/api/departments.service';
import { assignStaffToDepartment } from '@/lib/api/staff.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptCode, setDeptCode] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [consultationFee, setConsultationFee] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const s = await getStaffById(params.id as string);
      setStaff(s);
      setEmploymentType((s as any).employmentType || 'full_time');
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
    setLoading(true);
    try {
      const data: any = { employmentType, consultationFee: consultationFee ? Number(consultationFee) : null };
      const res = await updateStaffInfo(staff.staffId, data);
      setStaff(res.data);
    } catch (e: any) {
      setError(e?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const assignDepartment = async () => {
    if (!staff || !deptCode) return;
    const target = departments.find(d => d.code === deptCode);
    if (!target) return;
    setLoading(true);
    try {
      await assignStaffToDepartment(staff.staffId, { departmentId: target.id, isPrimary: true });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gán khoa thất bại');
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
      } else {
        await suspendStaff(staff.staffId);
      }
      await load();
    } catch (e: any) {
      setError(e?.message || 'Thay đổi trạng thái thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !staff) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (error && !staff) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết nhân viên</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
            <Button onClick={saveProfile} disabled={loading}>Lưu</Button>
          </div>
        </div>

        {error && <div className="text-red-600">{error}</div>}

        {staff && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="text-lg font-semibold mb-3">Thông tin</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Họ tên</span><span className="font-medium">{staff.personalInfo?.fullName}</span></div>
                <div className="flex justify-between"><span>Email</span><span className="font-medium">{staff.personalInfo?.email || '-'}</span></div>
                <div className="flex justify-between"><span>Điện thoại</span><span className="font-medium">{staff.personalInfo?.phoneNumber}</span></div>
                <div className="flex justify-between"><span>Loại</span><span className="font-medium capitalize">{staff.staffType}</span></div>
                <div className="flex justify-between"><span>Trạng thái</span><span className="font-medium">{staff.status}</span></div>
                <div className="mt-3">
                  <Button variant="outline" onClick={toggleStatus} disabled={loading}>{String(staff.status).toLowerCase()==='suspended'?'Kích hoạt lại':'Tạm nghỉ'}</Button>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <div className="text-lg font-semibold mb-3">Cập nhật</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Loại hợp đồng</label>
                  <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="border px-3 py-2 rounded w-full">
                    <option value="full_time">Toàn thời gian</option>
                    <option value="part_time">Bán thời gian</option>
                    <option value="contract">Hợp đồng</option>
                    <option value="intern">Thực tập</option>
                    <option value="volunteer">Tình nguyện</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Phí tư vấn (VND)</label>
                  <Input value={consultationFee} onChange={e => setConsultationFee(e.target.value)} placeholder="0 hoặc để trống" />
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <div className="text-lg font-semibold mb-3">Phân khoa</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Chọn khoa</label>
                  <select value={deptCode} onChange={e => setDeptCode(e.target.value)} className="border px-3 py-2 rounded w-full">
                    <option value="">Chọn khoa</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.code}>{d.nameVi} ({d.nameEn})</option>
                    ))}
                  </select>
                </div>
                <Button onClick={assignDepartment} disabled={loading || !deptCode}>Gán khoa</Button>
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Khoa hiện tại</div>
                  <div className="space-y-1 text-sm">
                    {(staff.departmentAssignments || staff.department_assignments || []).map((a: any, idx: number) => (
                      <div key={idx} className="flex justify-between"><span>{a.departmentNameVi || a.departmentCode}</span><span>{a.role || 'Member'}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}