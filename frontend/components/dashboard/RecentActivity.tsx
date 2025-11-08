'use client';

import { useEffect, useState } from 'react';
import { MoreVertical, UserCheck, UserPlus, Wrench, Pill, AlertCircle, Calendar, FileText, CreditCard } from 'lucide-react';
import { getRecentActivities, RecentActivity as Activity } from '@/lib/api/notifications.service';

interface RecentActivityProps {
  patientId?: string;
}

// Mock data fallback
function getMockActivities(): Activity[] {
  return [
    {
      id: '1',
      type: 'discharge',
      title: 'Bạn đã xuất viện từ Phòng 205',
      description: 'sau khi điều trị thành công',
      time: '08:30 AM',
    },
    {
      id: '2',
      type: 'appointment',
      title: 'Lịch hẹn khám với BS. Nguyễn Văn A',
      description: 'đã được xác nhận cho ngày mai',
      time: '09:15 AM',
    },
    {
      id: '3',
      type: 'test_result',
      title: 'Kết quả xét nghiệm máu đã sẵn sàng',
      description: 'vui lòng xem trong hồ sơ bệnh án',
      time: '10:00 AM',
    },
    {
      id: '4',
      type: 'medication',
      title: 'Đơn thuốc mới đã được kê',
      description: 'bởi BS. Trần Thị B',
      time: '11:30 AM',
    },
    {
      id: '5',
      type: 'payment',
      title: 'Hóa đơn thanh toán đã được tạo',
      description: 'tổng số tiền: 1,500,000 VNĐ',
      time: '01:15 PM',
    },
  ];
}

export function RecentActivity({ patientId }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      if (!patientId) {
        // Use mock data if no patientId
        setActivities(getMockActivities());
        setLoading(false);
        return;
      }

      try {
        const data = await getRecentActivities(patientId);
        setActivities(data.length > 0 ? data : getMockActivities());
      } catch (error) {
        console.error('Error loading activities:', error);
        setActivities(getMockActivities());
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [patientId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'discharge':
        return UserCheck;
      case 'admission':
        return UserPlus;
      case 'maintenance':
        return Wrench;
      case 'medication':
        return Pill;
      case 'emergency':
        return AlertCircle;
      case 'appointment':
        return Calendar;
      case 'test_result':
        return FileText;
      case 'payment':
        return CreditCard;
      default:
        return AlertCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'discharge':
        return 'bg-teal-100 text-teal-600';
      case 'admission':
        return 'bg-blue-100 text-blue-600';
      case 'maintenance':
        return 'bg-purple-100 text-purple-600';
      case 'medication':
        return 'bg-green-100 text-green-600';
      case 'emergency':
        return 'bg-orange-100 text-orange-600';
      case 'appointment':
        return 'bg-blue-100 text-blue-600';
      case 'test_result':
        return 'bg-purple-100 text-purple-600';
      case 'payment':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <button 
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const isLast = index === activities.length - 1;

          return (
            <div key={activity.id} className="relative flex gap-4">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200" />
              )}

              {/* Icon */}
              <div
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getActivityColor(
                  activity.type
                )}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
