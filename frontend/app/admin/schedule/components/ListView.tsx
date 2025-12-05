'use client';

import { Clock, User, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';

interface ListViewProps {
  appointments: any[];
  selectedDoctor: string;
}

export function ListView({ appointments, selectedDoctor }: ListViewProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      confirmed: {
        label: 'Đã xác nhận',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      pending: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
      completed: { label: 'Hoàn thành', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    };
    const { label, className } = statusMap[status] || statusMap.pending;
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
      >
        {label}
      </span>
    );
  };

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <User className="mx-auto h-16 w-16 text-slate-400" />
        <h3 className="mt-4 text-lg font-medium text-slate-600">Không có lịch hẹn</h3>
        <p className="mt-1 text-sm text-slate-500">Không tìm thấy lịch hẹn nào phù hợp bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                Ngày
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                Giờ
              </th>
              {selectedDoctor === 'all' && (
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  Bác sĩ
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                Bệnh nhân
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                Loại khám
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold tracking-wider text-slate-600 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {appointments.map((apt) => {
              const patientName = apt.patientName || 'Chưa rõ';
              const initials =
                patientName
                  .split(' ')
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase() || 'NA';
              return (
                <tr key={apt.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-700">
                    {new Date(apt.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {apt.time}
                    </div>
                  </td>
                  {selectedDoctor === 'all' && (
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-700">
                      {apt.doctorName}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                        {initials}
                      </div>
                      <span className="font-medium text-slate-900">{patientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-700">
                    {apt.visitType === 'CONSULTATION' ? 'Khám bệnh' : 'Tái khám'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(apt.status)}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-red-100 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
