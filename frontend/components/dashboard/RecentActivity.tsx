
'use client';

import { useEffect, useMemo, useState } from 'react';
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
    title: 'B?n ?? xu?t vi?n t? Ph?ng 205',
    description: 'sau khi ?i?u tr? th?nh c?ng',
    time: '08:30 AM',
  },
  {
    id: '2',
    type: 'appointment',
    title: 'L?ch h?n kh?m v?i BS. Nguy?n V?n A',
    description: '?? ???c x?c nh?n cho ng?y mai',
    time: '09:15 AM',
  },
  {
    id: '3',
    type: 'test_result',
    title: 'K?t qu? x?t nghi?m m?u ?? s?n s?ng',
    description: 'vui l?ng xem trong h? s? b?nh ?n',
    time: '10:00 AM',
  },
  {
    id: '4',
    type: 'medication',
    title: '??n thu?c m?i ?? ???c k?',
    description: 'b?i BS. Tr?n Th? B',
    time: '11:30 AM',
  },
  {
    id: '5',
    type: 'payment',
    title: 'H?a ??n thanh to?n ?? ???c t?o',
    description: 't?ng s? ti?n: 1,500,000 VN?',
    time: '01:15 PM',
  },
];

export function RecentActivity({ patientId }: RecentActivityProps) {
  const { user } = useAuth();
  const { notifications, isLoading: hookLoading } = useNotifications();
  const [fallbackActivities, setFallbackActivities] = useState<Activity[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);

  const shouldUseHook =
    !patientId || (user?.patientId && user.patientId === patientId);

  useEffect(() => {
    if (shouldUseHook || !patientId) {
      return;
    }

    async function loadActivities() {
      try {
        setFallbackLoading(true);
        const response = await getUserNotifications(patientId, { limit: 10 });

        if (response.success) {
          setFallbackActivities(
            transformNotificationsToActivities(response.data.notifications),
          );
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

    return fallbackActivities.length > 0
      ? fallbackActivities
      : MOCK_ACTIVITIES;
  }, [shouldUseHook, notifications, fallbackActivities]);

  const loading = shouldUseHook ? hookLoading : fallbackLoading;

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Ho?t ??ng g?n ??y</h2>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
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
          <h2 className="text-xl font-bold text-gray-900">Ho?t ??ng g?n ??y</h2>
        </div>
        <button
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-0">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const isLast = index === activities.length - 1;

          return (
            <div
              key={activity.id}
              className="group relative flex gap-4 pb-8 last:pb-0"
            >
              {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200 transition-colors group-hover:bg-gray-300" />
              )}

              <div
                className={cn(
                  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition-all group-hover:scale-110',
                  getActivityColor(activity.type),
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 pt-1">
                <p className="text-sm font-medium leading-relaxed text-gray-900 transition-colors group-hover:text-primary-700">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="mt-0.5 text-sm text-gray-500">
                    {activity.description}
                  </p>
                )}
                <p className="mt-1 text-xs font-medium text-gray-400">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
