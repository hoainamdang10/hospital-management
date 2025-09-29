"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Server,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  TrendingUp,
  Wifi,
  Database
} from "lucide-react"
import { dashboardApi } from "@/lib/supabase"

interface SystemHealth {
  [key: string]: {
    status: 'healthy' | 'warning' | 'error'
    uptime: string
    responseTime?: string
  }
}

interface RealtimeMetrics {
  active_users: number
  system_load: number
  response_time: number
  error_rate: number
}

export function RealTimeStats() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({})
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    active_users: 0,
    system_load: 0,
    response_time: 0,
    error_rate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Fetch real-time data
  const fetchRealTimeData = async () => {
    try {
      const [healthData, metricsData] = await Promise.all([
        dashboardApi.getSystemHealth(),
        dashboardApi.getRealtimeMetrics()
      ])

      setSystemHealth(healthData)
      setMetrics(metricsData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching real-time data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load and set up polling
  useEffect(() => {
    fetchRealTimeData()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchRealTimeData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Server className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Tình trạng hệ thống
            <Badge variant="outline" className="ml-auto">
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(systemHealth).map(([service, health]) => (
              <div key={service} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getHealthIcon(health.status)}
                  <div>
                    <span className="text-sm font-medium capitalize">
                      {service.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <p className="text-xs text-gray-500">
                      {health.responseTime || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`text-xs ${getHealthColor(health.status)}`}>
                    {health.status}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{health.uptime}</p>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Button 
                className="w-full" 
                variant="outline" 
                size="sm"
                onClick={fetchRealTimeData}
              >
                <Zap className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Metrics thời gian thực
            <Badge variant="outline" className="ml-auto">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Active Users */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Người dùng đang hoạt động
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {metrics.active_users}
                </span>
              </div>
              <Progress value={Math.min(metrics.active_users * 2, 100)} className="h-2" />
            </div>

            {/* System Load */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Tải hệ thống
                </span>
                <span className="text-lg font-bold text-orange-600">
                  {metrics.system_load}%
                </span>
              </div>
              <Progress 
                value={metrics.system_load} 
                className="h-2"
                // @ts-ignore
                style={{
                  '--progress-background': metrics.system_load > 80 ? '#ef4444' : 
                                         metrics.system_load > 60 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>

            {/* Response Time */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Thời gian phản hồi
                </span>
                <span className="text-lg font-bold text-green-600">
                  {metrics.response_time}ms
                </span>
              </div>
              <Progress value={Math.min(metrics.response_time / 5, 100)} className="h-2" />
            </div>

            {/* Error Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Tỷ lệ lỗi
                </span>
                <span className={`text-lg font-bold ${
                  metrics.error_rate > 5 ? 'text-red-600' : 
                  metrics.error_rate > 2 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metrics.error_rate.toFixed(2)}%
                </span>
              </div>
              <Progress 
                value={Math.min(metrics.error_rate * 10, 100)} 
                className="h-2"
                // @ts-ignore
                style={{
                  '--progress-background': metrics.error_rate > 5 ? '#ef4444' : 
                                         metrics.error_rate > 2 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function SystemHealthBadge() {
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'error'>('healthy')
  const [isLoading, setIsLoading] = useState(true)

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthData = await dashboardApi.getSystemHealth()
        const services = Object.values(healthData)

        if (services.some(s => s.status === 'error')) {
          setOverallHealth('error')
        } else if (services.some(s => s.status === 'warning')) {
          setOverallHealth('warning')
        } else {
          setOverallHealth('healthy')
        }
      } catch (error) {
        setOverallHealth('error')
      } finally {
        setIsLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
        Checking...
      </Badge>
    )
  }

  return (
    <Badge className={getHealthColor(overallHealth)}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        overallHealth === 'healthy' ? 'bg-green-600' :
        overallHealth === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
      }`}></div>
      {overallHealth === 'healthy' ? 'Hệ thống ổn định' :
       overallHealth === 'warning' ? 'Cảnh báo' : 'Có lỗi'}
    </Badge>
  )
}
