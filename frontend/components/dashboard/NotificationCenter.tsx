"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bell,
  BellRing,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Heart,
  Settings,
  X,
  MoreHorizontal,
  Filter,
  Search,
  MarkAsRead
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'appointment' | 'emergency' | 'system'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sender?: {
    name: string
    role: string
    avatar?: string
  }
  actionUrl?: string
  metadata?: Record<string, any>
}

interface NotificationCenterProps {
  notifications: Notification[]
  onNotificationClick?: (notification: Notification) => void
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
  onDeleteNotification?: (notificationId: string) => void
  onClearAll?: () => void
  className?: string
  showFilters?: boolean
  maxItems?: number
  showSearch?: boolean
  groupByType?: boolean
}

export function NotificationCenter({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  className,
  showFilters = true,
  maxItems = 20,
  showSearch = true,
  groupByType = false
}: NotificationCenterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const notificationTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'appointment', label: 'Cuộc hẹn' },
    { value: 'emergency', label: 'Cấp cứu' },
    { value: 'system', label: 'Hệ thống' },
    { value: 'info', label: 'Thông tin' },
    { value: 'warning', label: 'Cảnh báo' },
    { value: 'error', label: 'Lỗi' },
    { value: 'success', label: 'Thành công' }
  ]

  const priorityTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'urgent', label: 'Khẩn cấp' },
    { value: 'high', label: 'Cao' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'low', label: 'Thấp' }
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />
      case 'emergency':
        return <AlertTriangle className="h-4 w-4" />
      case 'system':
        return <Settings className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'error':
        return <XCircle className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'text-blue-600 bg-blue-100'
      case 'emergency':
        return 'text-red-600 bg-red-100'
      case 'system':
        return 'text-gray-600 bg-gray-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'success':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-orange-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-300'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`
    
    return date.toLocaleDateString('vi-VN')
  }

  // Filter notifications
  const filteredNotifications = notifications
    .filter(notification => {
      const matchesSearch = searchTerm === "" || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = selectedType === "all" || notification.type === selectedType
      const matchesPriority = selectedPriority === "all" || notification.priority === selectedPriority
      const matchesReadStatus = !showUnreadOnly || !notification.isRead
      
      return matchesSearch && matchesType && matchesPriority && matchesReadStatus
    })
    .slice(0, maxItems)

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Group by type if enabled
  const groupedNotifications = groupByType 
    ? filteredNotifications.reduce((groups, notification) => {
        const typeKey = notification.type
        if (!groups[typeKey]) {
          groups[typeKey] = []
        }
        groups[typeKey].push(notification)
        return groups
      }, {} as Record<string, Notification[]>)
    : { 'all': filteredNotifications }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">Thông báo</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {unreadCount} mới
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onMarkAllAsRead && unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Đánh dấu đã đọc
              </Button>
            )}
            {onClearAll && (
              <Button variant="outline" size="sm" onClick={onClearAll}>
                <X className="h-4 w-4 mr-1" />
                Xóa tất cả
              </Button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        {(showFilters || showSearch) && (
          <div className="space-y-3">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thông báo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {showFilters && (
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorityTypes.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  Chỉ chưa đọc
                </label>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedNotifications).map(([typeKey, typeNotifications]) => (
              <div key={typeKey}>
                {groupByType && (
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      {notificationTypes.find(t => t.value === typeKey)?.label || typeKey}
                    </h4>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}

                <div className="space-y-3">
                  {typeNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "relative flex gap-3 p-4 border-l-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
                        getPriorityBorder(notification.priority),
                        !notification.isRead && "bg-blue-50/50"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn(
                                "font-medium truncate",
                                notification.isRead ? "text-gray-700" : "text-gray-900"
                              )}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                              <Badge className={`${getPriorityColor(notification.priority)} border text-xs`}>
                                {priorityTypes.find(p => p.value === notification.priority)?.label}
                              </Badge>
                            </div>

                            <p className={cn(
                              "text-sm mb-2",
                              notification.isRead ? "text-gray-500" : "text-gray-600"
                            )}>
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(notification.timestamp)}
                              </div>

                              {notification.sender && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {notification.sender.name}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.isRead && onMarkAsRead && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onMarkAsRead(notification.id)
                                }}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                            {onDeleteNotification && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteNotification(notification.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact Notification Bell for header
export function NotificationBell({
  notifications,
  onNotificationClick,
  className
}: {
  notifications: Notification[]
  onNotificationClick?: (notification: Notification) => void
  className?: string
}) {
  const unreadCount = notifications.filter(n => !n.isRead).length
  const recentNotifications = notifications
    .filter(n => !n.isRead)
    .slice(0, 5)

  return (
    <div className={cn("relative", className)}>
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}
