"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  RefreshCw,
  Eye,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedStatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' | 'yellow' | 'indigo' | 'pink'
  isLoading?: boolean
  showTrend?: boolean
  showActions?: boolean
  showProgress?: boolean
  progressValue?: number
  progressMax?: number
  status?: 'normal' | 'warning' | 'critical' | 'success'
  subtitle?: string
  onRefresh?: () => void
  onViewDetails?: () => void
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient' | 'minimal' | 'outlined'
}

export function EnhancedStatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  description,
  trend = 'neutral',
  color = 'blue',
  isLoading = false,
  showTrend = true,
  showActions = false,
  showProgress = false,
  progressValue = 0,
  progressMax = 100,
  status = 'normal',
  subtitle,
  onRefresh,
  onViewDetails,
  onClick,
  className,
  size = 'md',
  variant = 'gradient'
}: EnhancedStatCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(0)

  // Animate number changes
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000
      const steps = 60
      const stepValue = value / steps
      let currentStep = 0

      const timer = setInterval(() => {
        currentStep++
        setAnimatedValue(Math.round(stepValue * currentStep))
        
        if (currentStep >= steps) {
          clearInterval(timer)
          setAnimatedValue(value)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [value])

  // Enhanced color system with variants
  const getColorClasses = () => {
    const baseColors = {
      blue: {
        gradient: 'from-blue-50 to-blue-100',
        minimal: 'bg-blue-50',
        outlined: 'bg-white border-blue-200',
        border: 'border-blue-200',
        icon: 'bg-blue-200 text-blue-600',
        text: 'text-blue-900',
        accent: 'text-blue-600',
        progress: 'bg-blue-500'
      },
      green: {
        gradient: 'from-green-50 to-emerald-100',
        minimal: 'bg-green-50',
        outlined: 'bg-white border-green-200',
        border: 'border-green-200',
        icon: 'bg-green-200 text-green-600',
        text: 'text-green-900',
        accent: 'text-green-600',
        progress: 'bg-green-500'
      },
      orange: {
        gradient: 'from-orange-50 to-amber-100',
        minimal: 'bg-orange-50',
        outlined: 'bg-white border-orange-200',
        border: 'border-orange-200',
        icon: 'bg-orange-200 text-orange-600',
        text: 'text-orange-900',
        accent: 'text-orange-600',
        progress: 'bg-orange-500'
      },
      purple: {
        gradient: 'from-purple-50 to-violet-100',
        minimal: 'bg-purple-50',
        outlined: 'bg-white border-purple-200',
        border: 'border-purple-200',
        icon: 'bg-purple-200 text-purple-600',
        text: 'text-purple-900',
        accent: 'text-purple-600',
        progress: 'bg-purple-500'
      },
      red: {
        gradient: 'from-red-50 to-rose-100',
        minimal: 'bg-red-50',
        outlined: 'bg-white border-red-200',
        border: 'border-red-200',
        icon: 'bg-red-200 text-red-600',
        text: 'text-red-900',
        accent: 'text-red-600',
        progress: 'bg-red-500'
      },
      gray: {
        gradient: 'from-gray-50 to-gray-100',
        minimal: 'bg-gray-50',
        outlined: 'bg-white border-gray-200',
        border: 'border-gray-200',
        icon: 'bg-gray-200 text-gray-600',
        text: 'text-gray-900',
        accent: 'text-gray-600',
        progress: 'bg-gray-500'
      },
      // Additional colors that might be used
      yellow: {
        gradient: 'from-yellow-50 to-amber-100',
        minimal: 'bg-yellow-50',
        outlined: 'bg-white border-yellow-200',
        border: 'border-yellow-200',
        icon: 'bg-yellow-200 text-yellow-600',
        text: 'text-yellow-900',
        accent: 'text-yellow-600',
        progress: 'bg-yellow-500'
      },
      indigo: {
        gradient: 'from-indigo-50 to-indigo-100',
        minimal: 'bg-indigo-50',
        outlined: 'bg-white border-indigo-200',
        border: 'border-indigo-200',
        icon: 'bg-indigo-200 text-indigo-600',
        text: 'text-indigo-900',
        accent: 'text-indigo-600',
        progress: 'bg-indigo-500'
      },
      pink: {
        gradient: 'from-pink-50 to-rose-100',
        minimal: 'bg-pink-50',
        outlined: 'bg-white border-pink-200',
        border: 'border-pink-200',
        icon: 'bg-pink-200 text-pink-600',
        text: 'text-pink-900',
        accent: 'text-pink-600',
        progress: 'bg-pink-500'
      }
    }

    // Ensure we always return a valid color object
    const selectedColor = baseColors[color as keyof typeof baseColors]
    if (!selectedColor) {
      console.warn(`Color "${color}" not found in colorClasses, falling back to blue`)
      return baseColors.blue
    }
    return selectedColor
  }

  const colorClasses = getColorClasses()

  // Size configurations
  const getSizeClasses = () => {
    const sizes = {
      sm: {
        padding: 'p-4',
        iconSize: 'h-5 w-5',
        iconPadding: 'p-2',
        valueText: 'text-2xl',
        titleText: 'text-sm'
      },
      md: {
        padding: 'p-6',
        iconSize: 'h-6 w-6',
        iconPadding: 'p-3',
        valueText: 'text-3xl',
        titleText: 'text-sm'
      },
      lg: {
        padding: 'p-8',
        iconSize: 'h-8 w-8',
        iconPadding: 'p-4',
        valueText: 'text-4xl',
        titleText: 'text-base'
      }
    }
    return sizes[size as keyof typeof sizes] || sizes.md
  }

  const sizeClasses = getSizeClasses()

  // Status indicators
  const getStatusIcon = () => {
    switch (status) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  // Background variant
  const getBackgroundClass = () => {
    switch (variant) {
      case 'gradient':
        return `bg-gradient-to-br ${colorClasses.gradient}`
      case 'minimal':
        return colorClasses.minimal
      case 'outlined':
        return colorClasses.outlined
      default:
        return `bg-gradient-to-br ${colorClasses.gradient}`
    }
  }

  const getTrendIcon = () => {
    if (!showTrend || change === undefined) return null
    
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-gray-600" />
  }

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-600'
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const displayValue = typeof value === 'number' ? animatedValue : value

  return (
    <Card
      className={cn(
        getBackgroundClass(),
        colorClasses.border,
        'hover:shadow-lg transition-all duration-300',
        onClick && 'cursor-pointer',
        isHovered && 'scale-105 shadow-xl',
        variant === 'outlined' && 'border-2',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <CardContent className={sizeClasses.padding || 'p-6'}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className={`${sizeClasses.titleText || 'text-sm'} font-medium ${colorClasses.accent || 'text-gray-600'}`}>
                  {title}
                </p>
                {getStatusIcon()}
              </div>
              {showActions && (
                <div className="flex items-center gap-1">
                  {onRefresh && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={onRefresh}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={onViewDetails}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-gray-600 mb-2">{subtitle}</p>
            )}

            {/* Value */}
            {isLoading ? (
              <div className={`animate-pulse bg-${color}-200 h-8 w-16 rounded mt-1`}></div>
            ) : (
              <p className={`${sizeClasses.valueText || 'text-3xl'} font-bold ${colorClasses.text || 'text-gray-900'} mb-1`}>
                {displayValue}
              </p>
            )}

            {/* Progress Bar */}
            {showProgress && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{progressValue}</span>
                  <span>{progressMax}</span>
                </div>
                <Progress
                  value={(progressValue / progressMax) * 100}
                  className="h-2"
                />
              </div>
            )}

            {/* Change and Description */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showTrend && change !== undefined && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <span className={`text-xs font-medium ${getTrendColor()}`}>
                      {Math.abs(change)}%
                    </span>
                  </div>
                )}
                {changeLabel && (
                  <span className="text-xs text-gray-600">
                    {changeLabel}
                  </span>
                )}
              </div>
            </div>

            {description && (
              <p className={`text-xs ${colorClasses.accent || 'text-gray-600'} mt-2 flex items-center gap-1`}>
                {description}
              </p>
            )}
          </div>

          {/* Icon */}
          <div className={`${sizeClasses.iconPadding || 'p-3'} ${colorClasses.icon || 'bg-gray-200 text-gray-600'} rounded-full ml-4 flex items-center justify-center`}>
            <div className={sizeClasses.iconSize || 'h-6 w-6'}>
              {icon}
            </div>
          </div>
        </div>

        {/* Hover Actions */}
        {isHovered && (showActions || onViewDetails) && (
          <div className="mt-4 pt-4 border-t border-white/50">
            <div className="flex gap-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-white/50 hover:bg-white/70"
                  onClick={onViewDetails}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Chi tiết
                </Button>
              )}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/50 hover:bg-white/70"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Specialized stat cards for different metrics
export function AppointmentStatCard({ 
  appointments, 
  isLoading, 
  onRefresh 
}: { 
  appointments: any, 
  isLoading: boolean, 
  onRefresh?: () => void 
}) {
  return (
    <EnhancedStatCard
      title="Cuộc hẹn hôm nay"
      value={appointments?.today || 0}
      change={12}
      changeLabel="so với hôm qua"
      icon={<TrendingUp className="h-6 w-6" />}
      description={`${appointments?.pending || 0} đang chờ xác nhận`}
      color="green"
      isLoading={isLoading}
      showActions={true}
      onRefresh={onRefresh}
    />
  )
}

export function PatientStatCard({ 
  patients, 
  isLoading, 
  onRefresh 
}: { 
  patients: any, 
  isLoading: boolean, 
  onRefresh?: () => void 
}) {
  return (
    <EnhancedStatCard
      title="Tổng bệnh nhân"
      value={patients?.total || 0}
      change={8}
      changeLabel="tăng trưởng tháng này"
      icon={<TrendingUp className="h-6 w-6" />}
      description={`${patients?.new_this_month || 0} bệnh nhân mới`}
      color="blue"
      isLoading={isLoading}
      showActions={true}
      onRefresh={onRefresh}
    />
  )
}

export function DoctorStatCard({ 
  doctors, 
  isLoading, 
  onRefresh 
}: { 
  doctors: any, 
  isLoading: boolean, 
  onRefresh?: () => void 
}) {
  return (
    <EnhancedStatCard
      title="Bác sĩ hoạt động"
      value={doctors?.active || 0}
      change={2}
      changeLabel="so với tuần trước"
      icon={<TrendingUp className="h-6 w-6" />}
      description={`${doctors?.total || 0} tổng số bác sĩ`}
      color="purple"
      isLoading={isLoading}
      showActions={true}
      onRefresh={onRefresh}
    />
  )
}

export function RevenueStatCard({ 
  revenue, 
  isLoading, 
  onRefresh 
}: { 
  revenue: any, 
  isLoading: boolean, 
  onRefresh?: () => void 
}) {
  return (
    <EnhancedStatCard
      title="Doanh thu tháng"
      value={`${revenue?.monthly || 0}M`}
      change={15}
      changeLabel="so với tháng trước"
      icon={<TrendingUp className="h-6 w-6" />}
      description={`${revenue?.daily || 0}K hôm nay`}
      color="orange"
      isLoading={isLoading}
      showActions={true}
      onRefresh={onRefresh}
    />
  )
}
