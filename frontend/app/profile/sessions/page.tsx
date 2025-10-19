'use client';

/**
 * Session Management Page
 * User can view and terminate active sessions
 * 
 * URL: /profile/sessions
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as identityService from '@/modules/identity/services/identityService';
import type { UserSession } from '@/modules/identity/services/identityService';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const uid = localStorage.getItem('userId');

    if (!token || !uid) {
      router.push('/login?redirect=/profile/sessions');
      return;
    }

    setAccessToken(token);
    setUserId(uid);
  }, [router]);

  useEffect(() => {
    if (accessToken && userId) {
      loadSessions();
    }
  }, [accessToken, userId]);

  const loadSessions = async () => {
    if (!userId || !accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const response = await identityService.listSessions(userId, accessToken);
      setSessions(response.sessions);
      setCurrentSessionId(response.currentSessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách phiên đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!userId || !accessToken) return;

    if (!confirm('Bạn có chắc chắn muốn đăng xuất phiên này?')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      await identityService.terminateSession(userId, sessionId, accessToken);
      setSuccess('Đã đăng xuất phiên thành công');
      await loadSessions(); // Reload sessions
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng xuất phiên');
    }
  };

  const handleTerminateAllSessions = async () => {
    if (!userId || !accessToken) return;

    if (!confirm('Bạn có chắc chắn muốn đăng xuất tất cả các phiên khác? Bạn sẽ cần đăng nhập lại trên các thiết bị khác.')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      await identityService.terminateAllSessions(userId, accessToken);
      setSuccess('Đã đăng xuất tất cả các phiên khác');
      await loadSessions(); // Reload sessions
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng xuất các phiên');
    }
  };

  const formatDeviceInfo = (session: UserSession) => {
    const { deviceInfo } = session;
    if (!deviceInfo) return 'Không xác định';

    const parts = [];
    if (deviceInfo.browser) parts.push(deviceInfo.browser);
    if (deviceInfo.os) parts.push(deviceInfo.os);
    if (deviceInfo.platform) parts.push(deviceInfo.platform);

    return parts.length > 0 ? parts.join(' • ') : 'Không xác định';
  };

  const formatLastAccessed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-neutral-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Phiên đăng nhập</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
              </p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 text-neutral-700 hover:text-neutral-900 transition-colors">
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Menu</h2>
              <nav className="space-y-2">
                <Link
                  href="/profile/settings"
                  className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Thông tin cá nhân
                </Link>
                <Link
                  href="/profile/security"
                  className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Bảo mật
                </Link>
                <Link
                  href="/profile/sessions"
                  className="block px-4 py-2 rounded-lg bg-brand text-white"
                >
                  Phiên đăng nhập
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Header with Terminate All Button */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Phiên hoạt động ({sessions.length})
                </h2>
                {sessions.length > 1 && (
                  <button
                    onClick={handleTerminateAllSessions}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Đăng xuất tất cả
                  </button>
                )}
              </div>

              {/* Sessions List */}
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600">Không có phiên đăng nhập nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`border rounded-lg p-4 ${
                        session.isCurrent
                          ? 'border-brand bg-brand/5'
                          : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Device Info */}
                          <div className="flex items-center mb-2">
                            <span className="text-2xl mr-3">
                              {session.deviceInfo?.platform === 'mobile' ? '📱' : '💻'}
                            </span>
                            <div>
                              <h3 className="text-sm font-medium text-neutral-900">
                                {formatDeviceInfo(session)}
                                {session.isCurrent && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-brand text-white rounded-full">
                                    Phiên hiện tại
                                  </span>
                                )}
                              </h3>
                              <p className="text-xs text-neutral-500 mt-1">
                                IP: {session.ipAddress}
                              </p>
                            </div>
                          </div>

                          {/* Session Details */}
                          <div className="ml-11 space-y-1 text-xs text-neutral-600">
                            <p>
                              <span className="font-medium">Truy cập lần cuối:</span>{' '}
                              {formatLastAccessed(session.lastAccessedAt)}
                            </p>
                            <p>
                              <span className="font-medium">Đăng nhập lúc:</span>{' '}
                              {new Date(session.createdAt).toLocaleString('vi-VN')}
                            </p>
                            <p>
                              <span className="font-medium">Hết hạn:</span>{' '}
                              {new Date(session.expiresAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        {/* Terminate Button */}
                        {!session.isCurrent && (
                          <button
                            onClick={() => handleTerminateSession(session.id)}
                            className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          >
                            Đăng xuất
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Lưu ý bảo mật:</strong> Nếu bạn thấy phiên đăng nhập không quen thuộc,
                  hãy đăng xuất ngay và thay đổi mật khẩu của bạn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

