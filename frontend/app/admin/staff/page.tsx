'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Shield,
  UserCog,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { listAdminUsers, type AdminUser } from '@/lib/api/admin-users.service';
import {
  deactivateAccount,
  reactivateAccount,
  unlockAccount,
} from '@/lib/api/admin-accounts.service';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'active' | 'inactive';
type AccentVariant = 'violet' | 'emerald' | 'amber';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã vô hiệu hóa' },
];

const ITEMS_PER_PAGE = 10;

export default function AdminStaffPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  });

  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchAdmins = useCallback(
    async (options: { refresh?: boolean } = {}) => {
      setError(null);
      if (options.refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await listAdminUsers({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch,
          status: statusFilter,
        });

        setAdmins(response.users || []);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: Math.max(1, response.pagination.totalPages),
        });
      } catch (err) {
        console.error('Failed to fetch admins', err);
        setError('Không thể tải danh sách admin');
        toast.error('Không thể tải danh sách admin');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, debouncedSearch, statusFilter]
  );

  const fetchStats = useCallback(async () => {
    try {
      const [totalRes, activeRes] = await Promise.all([
        listAdminUsers({ page: 1, limit: 1, status: 'all' }),
        listAdminUsers({ page: 1, limit: 1, status: 'active' }),
      ]);

      const total = totalRes.pagination.total;
      const active = activeRes.pagination.total;
      setStats({
        total,
        active,
        inactive: Math.max(0, total - active),
      });
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDeactivate = async (admin: AdminUser) => {
    if (!window.confirm(`Vô hiệu hóa quyền truy cập của ${admin.fullName}?`)) {
      return;
    }
    setActionLoading(admin.id);
    try {
      await deactivateAccount({
        userId: admin.id,
        reason: 'Deactivated from admin management page',
        terminateSessions: true,
      });
      toast.success('Đã vô hiệu hóa tài khoản admin');
      await Promise.all([fetchAdmins({ refresh: true }), fetchStats()]);
    } catch (err) {
      console.error('Deactivate admin failed', err);
      toast.error('Không thể vô hiệu hóa admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (admin: AdminUser) => {
    setActionLoading(admin.id);
    try {
      await reactivateAccount({
        userId: admin.id,
        reason: 'Reactivated from admin management page',
      });
      toast.success('Đã kích hoạt lại admin');
      await Promise.all([fetchAdmins({ refresh: true }), fetchStats()]);
    } catch (err) {
      console.error('Reactivate admin failed', err);
      toast.error('Không thể kích hoạt lại admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (admin: AdminUser) => {
    setActionLoading(admin.id);
    try {
      await unlockAccount({
        userId: admin.id,
        reason: 'Unlock from admin management page',
      });
      toast.success('Đã mở khóa tài khoản admin');
      await fetchAdmins({ refresh: true });
    } catch (err) {
      console.error('Unlock admin failed', err);
      toast.error('Không thể mở khóa admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    fetchAdmins({ refresh: true });
    fetchStats();
  };

  const paginationInfo = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return {
      start: pagination.total === 0 ? 0 : start,
      end: pagination.total === 0 ? 0 : end,
    };
  }, [pagination]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Admin</h1>
            <p className="mt-2 text-gray-600">
              Theo dõi và quản trị các tài khoản quản trị hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Làm mới
            </Button>
            <Link href="/admin/staff/add?role=admin">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm admin
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Tổng admin"
            value={stats.total}
            subtitle="Tất cả quyền quản trị"
            icon={<Shield className="h-5 w-5" />}
            accent="violet"
          />
          <StatCard
            title="Đang hoạt động"
            value={stats.active}
            subtitle="Có thể đăng nhập"
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="emerald"
          />
          <StatCard
            title="Đã vô hiệu hóa"
            value={stats.inactive}
            subtitle="Cần kích hoạt lại"
            icon={<AlertTriangle className="h-5 w-5" />}
            accent="amber"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              })}
              placeholder="Tìm theo tên, email..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Danh sách admin</p>
                <p className="text-xs text-slate-500">
                  {pagination.total} tài khoản quản trị
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <TableHead>Admin</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Trạng thái & vai trò</TableHead>
                  <TableHead>Hoạt động</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" />
                      <p className="mt-2 text-sm">Đang tải dữ liệu admin...</p>
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      <UserCog className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                      {error ?? 'Không có admin nào khớp với bộ lọc.'}
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <AdminRow
                      key={admin.id}
                      admin={admin}
                      actionLoading={actionLoading === admin.id}
                      onDeactivate={() => handleDeactivate(admin)}
                      onReactivate={() => handleReactivate(admin)}
                      onUnlock={() => handleUnlock(admin)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <p>
              Hiển thị{' '}
              <span className="font-semibold text-slate-900">
                {paginationInfo.start} - {paginationInfo.end}
              </span>{' '}
              trên tổng số{' '}
              <span className="font-semibold text-slate-900">{pagination.total}</span> admin
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </Button>
              <span className="text-slate-500">
                Trang {pagination.page}/{pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                }
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

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent: AccentVariant;
}) {
  const gradientMap: Record<AccentVariant, string> = {
    violet: 'from-violet-500 to-purple-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{subtitle}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">{title}</p>
        </div>
        <div
          className={cn(
            'rounded-2xl p-3 text-white shadow-lg shadow-slate-200',
            'bg-gradient-to-br',
            gradientMap[accent]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function AdminRow({
  admin,
  actionLoading,
  onDeactivate,
  onReactivate,
  onUnlock,
}: {
  admin: AdminUser;
  actionLoading: boolean;
  onDeactivate: () => void;
  onReactivate: () => void;
  onUnlock: () => void;
}) {
  const statusStyles = admin.isActive
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    : 'bg-rose-50 text-rose-700 border border-rose-100';

  const formattedLastLogin = admin.lastLoginAt
    ? format(new Date(admin.lastLoginAt), 'HH:mm dd/MM/yyyy', { locale: vi })
    : 'Chưa đăng nhập';

  const createdAt = format(new Date(admin.createdAt), 'dd/MM/yyyy', { locale: vi });

  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-lg font-semibold text-white shadow-md shadow-violet-100">
            {admin.fullName?.charAt(0) ?? admin.email.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{admin.fullName || 'Chưa cập nhật'}</p>
            <p className="text-sm text-slate-500">{admin.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        <p>{admin.phoneNumber || 'Chưa cập nhật'}</p>
        <p className="text-xs text-slate-400">Tạo: {createdAt}</p>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles}`}>
            {admin.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            Vai trò: {admin.roles.join(', ').toUpperCase()}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs ${
              admin.isEmailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {admin.isEmailVerified ? 'Email đã xác minh' : 'Chưa xác minh email'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        <p>{formattedLastLogin}</p>
      </td>
      <td className="px-6 py-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            {admin.isActive ? (
              <DropdownMenuItem onClick={onDeactivate}>Vô hiệu hóa</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onReactivate}>Kích hoạt lại</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onUnlock}>
              <Lock className="mr-2 h-3.5 w-3.5" />
              Mở khóa đăng nhập
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className ?? ''}`}
    >
      {children}
    </th>
  );
}
