"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Server,
  Database,
  Users,
  TrendingUp,
  TrendingDown,
  Heart,
  Shield,
  Globe,
  HardDrive
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SystemMetrics {
  activeUsers: number
  serverLoad: number
  databaseConnections: number
  responseTime: number
  memoryUsage?: number
  diskUsage?: number
  networkLatency?: number
  uptime?: string
}

interface RealTimeStatsProps {
  systemHealth?: 'healthy' | 'warning' | 'critical' | 'offline'
  lastUpdate?: Date
  metrics?: SystemMetrics
  onRefresh?: () => void
  className?: string
  showDetailedMetrics?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function RealTimeStatsEnhanced({
  systemHealth = 'healthy',
  lastUpdate = new Date(),
  metrics = {
    activeUsers: 0,
    serverLoad: 0,
    databaseConnections: 0,
    responseTime: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    uptime: '0h 0m'
  },
  onRefresh,
  className,
  showDetailedMetrics = false,
  autoRefresh = true,
  refreshInterval = 30000
}: RealTimeStatsProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState(lastUpdate)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setLastUpdateTime(new Date())
      if (onRefresh) {
        onRefresh()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, onRefresh])

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    if (onRefresh) {
      await onRefresh()
    }
    setLastUpdateTime(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getHealthColor = () => {
    switch (systemHealth) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      case 'offline':
        return 'text-gray-600'
      default:
        return 'text-green-600'
    }
  }

  const getHealthIcon = () => {
    switch (systemHealth) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'offline':
        return <WifiOff className="h-4 w-4 text-gray-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />
    }
  }

  const getHealthBadgeColor = () => {
    switch (systemHealth) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getMetricColor = (value: number, thresholds: { warning: number, critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card className={cn("bg-white border-gray-200 hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">System Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getHealthBadgeColor()} border flex items-center gap-1`}>
              {getHealthIcon()}
              {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
            </Badge>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Last Update */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated:</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(lastUpdateTime)}
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-gray-600">Active Users</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{metrics.activeUsers}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Server className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-gray-600">Server Load</span>
              </div>
              <div className="space-y-1">
                <p className={`text-lg font-bold ${getMetricColor(metrics.serverLoad, { warning: 70, critical: 90 })}`}>
                  {metrics.serverLoad}%
                </p>
                <Progress 
                  value={metrics.serverLoad} 
                  className="h-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-gray-600">DB Connections</span>
              </div>
              <p className="text-lg font-bold text-purple-900">{metrics.databaseConnections}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-green-600" />
                <span className="text-xs text-gray-600">Response Time</span>
              </div>
              <p className={`text-lg font-bold ${getMetricColor(metrics.responseTime, { warning: 500, critical: 1000 })}`}>
                {metrics.responseTime}ms
              </p>
            </div>
          </div>

          {/* Detailed Metrics */}
          {showDetailedMetrics && (
            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-indigo-600" />
                    <span className="text-xs text-gray-600">Memory Usage</span>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold ${getMetricColor(metrics.memoryUsage || 0, { warning: 80, critical: 95 })}`}>
                      {metrics.memoryUsage}%
                    </p>
                    <Progress 
                      value={metrics.memoryUsage || 0} 
                      className="h-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-pink-600" />
                    <span className="text-xs text-gray-600">Disk Usage</span>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold ${getMetricColor(metrics.diskUsage || 0, { warning: 85, critical: 95 })}`}>
                      {metrics.diskUsage}%
                    </p>
                    <Progress 
                      value={metrics.diskUsage || 0} 
                      className="h-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-cyan-600" />
                    <span className="text-xs text-gray-600">Network Latency</span>
                  </div>
                  <p className={`text-sm font-semibold ${getMetricColor(metrics.networkLatency || 0, { warning: 100, critical: 200 })}`}>
                    {metrics.networkLatency}ms
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-600" />
                    <span className="text-xs text-gray-600">Uptime</span>
                  </div>
                  <p className="text-sm font-semibold text-green-600">
                    {metrics.uptime}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
