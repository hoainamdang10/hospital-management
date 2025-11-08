'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Lịch hẹn mới',
      message: 'Bạn có lịch hẹn mới lúc 14:00',
      time: '5 phút',
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 hover:bg-gray-100"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-96 rounded-lg border bg-white shadow-lg">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Thông báo</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className={`border-b p-4 ${!n.read ? 'bg-blue-50' : ''}`}>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-500">{n.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
