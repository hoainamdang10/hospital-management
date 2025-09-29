import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ActivityItem {
  id: string
  type: 'appointment' | 'patient' | 'doctor' | 'report'
  title: string
  description: string
  time: string
  status?: 'pending' | 'completed' | 'cancelled'
  avatar?: string
  initials?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
  title?: string
  maxItems?: number
}

export function RecentActivity({ 
  activities, 
  title = "Recent Activity", 
  maxItems = 5 
}: RecentActivityProps) {
  const displayedActivities = activities.slice(0, maxItems)

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return '📅'
      case 'patient':
        return '👤'
      case 'doctor':
        return '👨‍⚕️'
      case 'report':
        return '📊'
      default:
        return '📋'
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                {activity.avatar ? (
                  <AvatarImage src={activity.avatar} alt="" />
                ) : (
                  <AvatarFallback className="text-xs">
                    {activity.initials || getTypeIcon(activity.type)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {activity.description}
                </p>
                {activity.status && (
                  <Badge 
                    variant="secondary" 
                    className={`mt-1 text-xs ${getStatusColor(activity.status)}`}
                  >
                    {activity.status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
