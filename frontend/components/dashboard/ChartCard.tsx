"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Download,
  RefreshCw,
  Maximize2,
  Filter,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  chartType?: 'bar' | 'line' | 'pie' | 'area'
  data?: any[]
  isLoading?: boolean
  showLegend?: boolean
  showExport?: boolean
  onExport?: () => void
  onRefresh?: () => void
  onExpand?: () => void
  period?: string
  onPeriodChange?: (period: string) => void
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  className = "",
  chartType = 'bar',
  data = [],
  isLoading = false,
  showLegend = false,
  showExport = false,
  onExport,
  onRefresh,
  onExpand,
  period = 'week',
  onPeriodChange,
  trend
}: ChartCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getChartIcon = () => {
    switch (chartType) {
      case 'bar':
        return <BarChart3 className="h-4 w-4" />
      case 'line':
        return <LineChart className="h-4 w-4" />
      case 'pie':
        return <PieChart className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text-gray-600'

    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const periodOptions = [
    { value: 'day', label: 'Ngày' },
    { value: 'week', label: 'Tuần' },
    { value: 'month', label: 'Tháng' },
    { value: 'year', label: 'Năm' }
  ]

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getChartIcon()}
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Selector */}
            {onPeriodChange && (
              <div className="flex items-center gap-1">
                {periodOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={period === option.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPeriodChange(option.value)}
                    className="text-xs px-2 py-1"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Trend Indicator */}
            {trend && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={`text-xs font-medium ${getTrendColor()}`}>
                  {trend.value}% {trend.label}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}

              {showExport && onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {onExpand && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExpand}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}

              {actions}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Bar Chart Components
interface BarChartGroupProps {
  label: string
  value1: number
  value2: number
  maxValue?: number
  colors?: {
    primary: string
    secondary: string
  }
  showValues?: boolean
}

export function BarChartGroup({
  label,
  value1,
  value2,
  maxValue = 100,
  colors = {
    primary: 'bg-blue-500',
    secondary: 'bg-green-500'
  },
  showValues = false
}: BarChartGroupProps) {
  const getHeightClass = (value: number) => {
    const percentage = Math.min((value / maxValue) * 100, 100)
    if (percentage >= 90) return 'h-18'
    if (percentage >= 80) return 'h-16'
    if (percentage >= 70) return 'h-14'
    if (percentage >= 60) return 'h-12'
    if (percentage >= 50) return 'h-10'
    if (percentage >= 40) return 'h-8'
    if (percentage >= 30) return 'h-6'
    if (percentage >= 20) return 'h-4'
    if (percentage >= 10) return 'h-2'
    return 'h-1'
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-end space-x-1 h-20">
        <div className="flex flex-col items-center">
          <div className={`w-4 ${colors.primary} rounded-t transition-all duration-300 ${getHeightClass(value1)}`} />
          {showValues && (
            <span className="text-xs text-gray-500 mt-1">{value1}</span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-4 ${colors.secondary} rounded-t transition-all duration-300 ${getHeightClass(value2)}`} />
          {showValues && (
            <span className="text-xs text-gray-500 mt-1">{value2}</span>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </div>
  )
}

// Simple Progress Chart
interface ProgressChartProps {
  data: Array<{
    label: string
    value: number
    color: string
    target?: number
  }>
  className?: string
}

export function ProgressChart({ data, className }: ProgressChartProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{item.value}</span>
              {item.target && (
                <span className="text-xs text-gray-500">/ {item.target}</span>
              )}
            </div>
          </div>
          <Progress
            value={item.target ? (item.value / item.target) * 100 : item.value}
            className="h-2"
          />
        </div>
      ))}
    </div>
  )
}

// Metric Comparison Chart
interface MetricComparisonProps {
  title: string
  current: number
  previous: number
  unit?: string
  format?: 'number' | 'percentage' | 'currency'
}

export function MetricComparison({
  title,
  current,
  previous,
  unit = '',
  format = 'number'
}: MetricComparisonProps) {
  const change = current - previous
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0
  const isPositive = change > 0
  const isNeutral = change === 0

  const formatValue = (value: number) => {
    switch (format) {
      case 'percentage':
        return `${value}%`
      case 'currency':
        return `${value.toLocaleString('vi-VN')}đ`
      default:
        return `${value}${unit}`
    }
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{formatValue(current)}</span>
        <div className="flex items-center gap-1">
          {!isNeutral && (
            <>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(changePercent).toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        So với kỳ trước: {formatValue(previous)}
      </p>
    </div>
  )
}
