'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminInvitationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const res = await authService.listStaffInvitations({
        page,
        limit,
        status: status || undefined,
        role: role || undefined,
        email: email || undefined,
      });
      setItems(res.invitations || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách lời mời');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, limit]);

  const copyLink = async (id: string) => {
    const r = await authService.resendStaffInvitation(id);
    if (r?.invitationUrl) navigator.clipboard.writeText(r.invitationUrl);
  };

  const cancel = async (id: string) => {
    await authService.cancelStaffInvitation(id);
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Lời mời tài khoản</h1>
          <Button onClick={() => router.push('/admin/doctors/add')}>Tạo lời mời</Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Vai trò</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="ADMIN">Quản trị</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Trạng thái</option>
            <option value="PENDING">Đang chờ</option>
            <option value="ACCEPTED">Đã chấp nhận</option>
            <option value="EXPIRED">Hết hạn</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <Button
            onClick={() => {
              setPage(1);
              load();
            }}
          >
            Lọc
          </Button>
        </div>

        {error && <div className="text-red-600">{error}</div>}
        {loading && <div className="text-gray-600">Đang tải...</div>}

        <div className="rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">Vai trò</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">Hết hạn</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3">{inv.email}</td>
                    <td className="px-4 py-3">{inv.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs ${String(inv.status).toUpperCase() === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : String(inv.status).toUpperCase() === 'ACCEPTED' ? 'bg-green-100 text-green-800' : String(inv.status).toUpperCase() === 'EXPIRED' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => copyLink(inv.id)}>
                          Sao chép link
                        </Button>
                        <Button variant="destructive" onClick={() => cancel(inv.id)}>
                          Hủy
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-gray-600">Tổng {total}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className="text-sm">Trang {page}</span>
              <Button
                variant="outline"
                disabled={page * limit >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
