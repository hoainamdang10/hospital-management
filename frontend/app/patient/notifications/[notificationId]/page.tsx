'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  getNotificationDetail,
  markNotificationAsRead,
  type UserNotification,
  formatNotificationPreview,
} from '@/lib/api/notifications.service';
import { useAuth } from '@/hooks/useAuth';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveContextLink(notification: UserNotification) {
  const context = notification.healthcareContext;
  if (context?.appointmentId) {
    return {
      href: `/patient/appointments/${context.appointmentId}`,
      label: 'Xem lịch hẹn',
    };
  }
  if (context?.invoiceId) {
    return {
      href: `/patient/billing?invoice=${context.invoiceId}`,
      label: 'Xem hoá đơn',
    };
  }
  if (context?.medicalRecordId) {
    return {
      href: `/patient/medical-history/${context.medicalRecordId}`,
      label: 'Xem hồ sơ bệnh án',
    };
  }
  return null;
}

export default function PatientNotificationDetailPage() {
  const params = useParams<{ notificationId: string }>();
  const notificationId =
    typeof params?.notificationId === 'string' ? params.notificationId : '';
  const { user } = useAuth();

  const [notification, setNotification] = useState<UserNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    if (!user?.userId || !notificationId) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getNotificationDetail(user.userId, notificationId)
      .then((detail) => {
        if (isMounted) {
          if (!detail) {
            setError('Không tìm thấy thông báo.');
          } else {
            setNotification(detail);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Không thể tải thông báo. Vui lòng thử lại sau.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [notificationId, user?.userId]);

  const preview = useMemo(
    () => (notification ? formatNotificationPreview(notification) : null),
    [notification]
  );

  const contextLink = notification ? resolveContextLink(notification) : null;

  const handleToggleRead = async () => {
    if (!notification || !user?.userId) return;

    const recipientFallback =
      notification.recipientId || user.patientId || user.userId;

    setIsMutating(true);
    try {
      await markNotificationAsRead(
        notification.notificationId,
        recipientFallback,
        !notification.readAt
      );
      setNotification({
        ...notification,
        readAt: notification.readAt ? null : new Date().toISOString(),
      });
    } catch (err) {
      console.error('[NotificationDetail] Failed to toggle read state', err);
      setError('Không thể cập nhật trạng thái đọc thông báo.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/patient/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Về bảng điều khiển
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Chi tiết thông báo</span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang tải thông báo...
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Có lỗi xảy ra</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && notification && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gradient-to-br from-blue-50 to-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-blue-500">
                    {notification.templateType || 'Thông báo hệ thống'}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                    {preview?.title || notification.subject || 'Thông báo'}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      notification.readAt
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {notification.readAt ? 'Đã đọc' : 'Chưa đọc'}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Ưu tiên: {notification.priority}
                  </span>
                </div>
              </div>
              {preview?.description && (
                <p className="text-base text-gray-600">{preview.description}</p>
              )}
              <div className="text-sm text-gray-500">
                Được tạo lúc {formatDate(notification.createdAt)}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs uppercase text-gray-400">Trạng thái</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {notification.status}
                </p>
                <p className="mt-3 text-xs uppercase text-gray-400">Kênh gửi</p>
                <p className="mt-1 text-sm text-gray-700">
                  {notification.channels.join(', ') || 'Không xác định'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs uppercase text-gray-400">Gửi lúc</p>
                <p className="mt-1 text-sm text-gray-700">{formatDate(notification.sentAt)}</p>
                <p className="mt-3 text-xs uppercase text-gray-400">Đã đọc lúc</p>
                <p className="mt-1 text-sm text-gray-700">{formatDate(notification.readAt)}</p>
              </div>
            </div>

            {contextLink && (
              <Link
                href={contextLink.href}
                className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                {contextLink.label}
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}

            <div className="rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Nội dung</h2>
              <div className="mt-4 space-y-4 text-gray-700">
                {notification.body ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: notification.body }}
                  />
                ) : (
                  <p>Không có nội dung chi tiết.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={handleToggleRead}
                disabled={isMutating}
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
                {notification.readAt ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
              </button>
              <Link
                href="/patient/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại bảng điều khiển
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
