"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Clock,
  User,
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineActivity {
  id: string
  type: 'appointment' | 'surgery' | 'admission' | 'discharge' | 'medication' | 'test' | 'note'
  title: string
  description?: string
  timestamp: Date
  user: {
    name: string
    role: string
    avatar?: string
  }
  patient?: {
    name: string
    id: string
  }
  status: 'completed' | 'in-progress' | 'cancelled' | 'pending'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: Record<string, any>
}

interface ActivityTimelineProps {
  activities: TimelineActivity[]
  onActivityClick?: (activity: TimelineActivity) => void
  onAddActivity?: () => void
  className?: string
  showFilters?: boolean
  showSearch?: boolean
  maxItems?: number
  groupByDate?: boolean
  showActions?: boolean
}

export function ActivityTimeline({
  activities,
  onActivityClick,
  onAddActivity,
  className,
  showFilters = true,
  showSearch = true,
  maxItems = 10,
  groupByDate = true,
  showActions = true
}: ActivityTimelineProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  const activityTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'appointment', label: 'Cuộc hẹn' },
    { value: 'surgery', label: 'Phẫu thuật' },
    { value: 'admission', label: 'Nhập viện' },
    { value: 'discharge', label: 'Xuất viện' },
    { value: 'medication', label: 'Thuốc' },
    { value: 'test', label: 'Xét nghiệm' },
    { value: 'note', label: 'Ghi chú' }
  ]

  const statusTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'in-progress', label: 'Đang thực hiện' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'cancelled', label: 'Đã hủy' }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />
      case 'surgery':
        return <Activity className="h-4 w-4" />
      case 'admission':
      case 'discharge':
        return <User className="h-4 w-4" />
      case 'medication':
        return <Plus className="h-4 w-4" />
      case 'test':
        return <FileText className="h-4 w-4" />
      case 'note':
        return <Edit className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'text-blue-600 bg-blue-100'
      case 'surgery':
        return 'text-red-600 bg-red-100'
      case 'admission':
        return 'text-green-600 bg-green-100'
      case 'discharge':
        return 'text-orange-600 bg-orange-100'
      case 'medication':
        return 'text-purple-600 bg-purple-100'
      case 'test':
        return 'text-indigo-600 bg-indigo-100'
      case 'note':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'in-progress':
        return <Clock className="h-3 w-3 text-blue-600" />
      case 'cancelled':
        return <XCircle className="h-3 w-3 text-red-600" />
      case 'pending':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />
      default:
        return <Clock className="h-3 w-3 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority?: string) => {
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
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isYesterday = (date: Date) => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return date.toDateString() === yesterday.toDateString()
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hôm nay'
    if (isYesterday(date)) return 'Hôm qua'
    return formatDate(date)
  }

  // Filter activities
  const filteredActivities = activities
    .filter(activity => {
      const matchesSearch = searchTerm === "" || 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = selectedType === "all" || activity.type === selectedType
      const matchesStatus = selectedStatus === "all" || activity.status === selectedStatus
      
      return matchesSearch && matchesType && matchesStatus
    })
    .slice(0, maxItems)

  // Group by date if enabled
  const groupedActivities = groupByDate 
    ? filteredActivities.reduce((groups, activity) => {
        const dateKey = activity.timestamp.toDateString()
        if (!groups[dateKey]) {
          groups[dateKey] = []
        }
        groups[dateKey].push(activity)
        return groups
      }, {} as Record<string, TimelineActivity[]>)
    : { 'all': filteredActivities }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Hoạt động gần đây</CardTitle>
          <div className="flex items-center gap-2">
            {onAddActivity && (
              <Button variant="outline" size="sm" onClick={onAddActivity}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm
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
                  placeholder="Tìm kiếm hoạt động..."
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
                  {activityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusTypes.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Không có hoạt động nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
              <div key={dateKey}>
                {groupByDate && (
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      {getDateLabel(dayActivities[0].timestamp)}
                    </h4>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}

                <div className="space-y-4">
                  {dayActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      onClick={() => onActivityClick && onActivityClick(activity)}
                      className={cn(
                        "relative flex gap-4 p-4 border-l-4 rounded-lg hover:bg-gray-50 transition-colors",
                        getPriorityColor(activity.priority),
                        onActivityClick && "cursor-pointer"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        getActivityColor(activity.type)
                      )}>
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {activity.title}
                              </h4>
                              <Badge className={`${getStatusColor(activity.status)} border text-xs`}>
                                {getStatusIcon(activity.status)}
                                <span className="ml-1">
                                  {statusTypes.find(s => s.value === activity.status)?.label}
                                </span>
                              </Badge>
                            </div>

                            {activity.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {activity.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(activity.timestamp)}
                              </div>

                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.user.name} ({activity.user.role})
                              </div>

                              {activity.patient && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {activity.patient.name}
                                </div>
                              )}
                            </div>
                          </div>

                          {showActions && (
                            <div className="flex items-center gap-1 ml-2">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
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

// Compact Timeline for sidebar
export function CompactActivityTimeline({
  activities,
  maxItems = 5,
  className
}: {
  activities: TimelineActivity[]
  maxItems?: number
  className?: string
}) {
  return (
    <ActivityTimeline
      activities={activities}
      maxItems={maxItems}
      showFilters={false}
      showSearch={false}
      groupByDate={false}
      showActions={false}
      className={className}
    />
  )
}
