import React from 'react'
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  description?: string
}

export function StatCard({ title, value, change, icon, description }: StatCardProps) {
  const isPositive = change !== undefined ? change >= 0 : null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {description && (
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
          </div>
          <div className="p-2 rounded-full bg-gray-100">{icon}</div>
        </div>
        {change !== undefined && (
          <div className={`mt-2 flex items-center text-sm ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}>
            <span>
              {isPositive ? "↑" : "↓"} {Math.abs(change)}%
            </span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
