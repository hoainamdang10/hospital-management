'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MoreVertical,
  UserCheck,
  UserPlus,
  Wrench,
  Pill,
  AlertCircle,
  Calendar,
  FileText,
  CreditCard,
  Activity as ActivityIcon,
} from 'lucide-react';

import {
  getUserNotifications,
  transformNotificationsToActivities,
  type RecentActivity as Activity,
} from '@/lib/api/notifications.service';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface RecentActivityProps {
  patientId?: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'discharge',
    title: 'Ban da xuat vien tu Phong 205',
    description: 'sau khi dieu tri thanh cong',
    time: '08:30 AM',
  },
  {
    id: '2',
    type: 'appointment',
    title: 'Lich hen kham voi BS. Nguyen Van A',
    description: 'Da duoc xac nhan cho ngay mai',
    time: '09:15 AM',
  },
  {
    id: '3',
    type: 'test_result',
    title: 'Ket qua xet nghiem mau da san sang',
    description: 'vui long xem trong ho so benh an',
    time: '10:00 AM',
  },
  {
    id: '4',
    type: 'medication',
    title: 'Don thuoc moi da duoc ke',
    description: 'boi BS. Tran Thi B',
    time: '11:30 AM',
  },
  {
    id: '5',
    type: 'payment',
    title: 'Hoa don thanh toan da duoc tao',
    description: 'Tong so tien: 1.500.000 VND',
    time: '01:15 PM',
  },
];

export function RecentActivity({ patientId }: RecentActivityProps) {
  const { user } = useAuth();
  const { notifications, isLoading: hookLoading } = useNotifications();
  const [fallbackActivities, setFallbackActivities] = useState<Activity[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);

  const shouldUseHook = !patientId || (user?.patientId && user.patientId === patientId);

  useEffect(() => {
    if (shouldUseHook || !patientId) {
      return;
    }

    async function loadActivities() {
      try {
        setFallbackLoading(true);
        const response = await getUserNotifications(patientId, { limit: 10 });

        if (response.success) {
          setFallbackActivities(transformNotificationsToActivities(response.data.notifications));
        } else {
          setFallbackActivities(MOCK_ACTIVITIES);
        }
      } catch (error) {
        console.error('Error loading activities:', error);
        setFallbackActivities(MOCK_ACTIVITIES);
      } finally {
        setFallbackLoading(false);
      }
    }

    loadActivities();
  }, [patientId, shouldUseHook]);

  const activities = useMemo(() => {
    if (shouldUseHook) {
      const converted = transformNotificationsToActivities(notifications);
      return converted.length > 0 ? converted : MOCK_ACTIVITIES;
    }

    return fallbackActivities.length > 0 ? fallbackActivities : MOCK_ACTIVITIES;
  }, [shouldUseHook, notifications, fallbackActivities]);

  const activitiesToShow = activities.slice(0, 3);

  const loading = shouldUseHook ? hookLoading : fallbackLoading;

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Hoat dong gan day</h2>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
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
        return 'bg-teal-50 text-teal-600 ring-teal-100';
      case 'admission':
        return 'bg-blue-50 text-blue-600 ring-blue-100';
      case 'maintenance':
        return 'bg-purple-50 text-purple-600 ring-purple-100';
      case 'medication':
        return 'bg-green-50 text-green-600 ring-green-100';
      case 'emergency':
        return 'bg-orange-50 text-orange-600 ring-orange-100';
      case 'appointment':
        return 'bg-blue-50 text-blue-600 ring-blue-100';
      case 'test_result':
        return 'bg-purple-50 text-purple-600 ring-purple-100';
      case 'payment':
        return 'bg-green-50 text-green-600 ring-green-100';
      default:
        return 'bg-gray-50 text-gray-600 ring-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-2">
            <ActivityIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Hoat dong gan day</h2>
        </div>
        <button
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-0">
        {activitiesToShow.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const isLast = index === activitiesToShow.length - 1;

          return (
            <div key={activity.id} className="group relative flex gap-4 pb-8 last:pb-0">
              {!isLast && (
                <div className="absolute top-12 bottom-0 left-5 w-px bg-gray-200 transition-colors group-hover:bg-gray-300" />
              )}

              <div
                className={cn(
                  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition-all group-hover:scale-110',
                  getActivityColor(activity.type)
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 pt-1">
                <p className="group-hover:text-primary-700 text-sm leading-relaxed font-medium text-gray-900 transition-colors">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="mt-0.5 text-sm text-gray-500">{activity.description}</p>
                )}
                <p className="mt-1 text-xs font-medium text-gray-400">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-right">
        <Link
          href="/dashboard/notifications"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Xem tat ca thong bao
        </Link>
      </div>
    </div>
  );
}
