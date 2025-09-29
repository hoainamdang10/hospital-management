"use client"

import { useState } from "react"
import {
  Heart,
  Activity,
  Thermometer,
  Weight,
  Droplets,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Eye
} from "lucide-react"
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth/auth-wrapper"

export default function PatientHealthTracking() {
  const { user, loading } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  // Mock health data
  const healthMetrics = {
    bloodPressure: {
      current: { systolic: 120, diastolic: 80 },
      trend: "stable",
      lastReading: "2024-01-15 08:30",
      status: "normal",
      target: { systolic: 120, diastolic: 80 }
    },
    heartRate: {
      current: 72,
      trend: "down",
      lastReading: "2024-01-15 08:30",
      status: "normal",
      target: 70
    },
    temperature: {
      current: 36.5,
      trend: "stable",
      lastReading: "2024-01-15 07:00",
      status: "normal",
      target: 36.5
    },
    weight: {
      current: 70.5,
      trend: "down",
      lastReading: "2024-01-15 07:00",
      status: "good",
      target: 68.0
    },
    bloodSugar: {
      current: 95,
      trend: "up",
      lastReading: "2024-01-15 09:00",
      status: "normal",
      target: 100
    }
  }

  const recentReadings = [
    {
      id: "1",
      date: "2024-01-15",
      time: "08:30",
      type: "Blood Pressure",
      value: "120/80 mmHg",
      status: "normal",
      notes: "Morning reading after breakfast"
    },
    {
      id: "2",
      date: "2024-01-15",
      time: "07:00",
      type: "Weight",
      value: "70.5 kg",
      status: "good",
      notes: "Weekly weigh-in"
    },
    {
      id: "3",
      date: "2024-01-14",
      time: "21:00",
      type: "Blood Sugar",
      value: "110 mg/dL",
      status: "normal",
      notes: "After dinner reading"
    },
    {
      id: "4",
      date: "2024-01-14",
      time: "08:00",
      type: "Heart Rate",
      value: "68 bpm",
      status: "normal",
      notes: "Resting heart rate"
    }
  ]

  const healthGoals = [
    {
      id: "1",
      title: "Maintain Blood Pressure",
      target: "< 130/85 mmHg",
      current: "120/80 mmHg",
      progress: 85,
      status: "on_track"
    },
    {
      id: "2",
      title: "Weight Loss",
      target: "68 kg",
      current: "70.5 kg",
      progress: 60,
      status: "on_track"
    },
    {
      id: "3",
      title: "Blood Sugar Control",
      target: "< 100 mg/dL",
      current: "95 mg/dL",
      progress: 90,
      status: "achieved"
    },
    {
      id: "4",
      title: "Daily Exercise",
      target: "30 min/day",
      current: "25 min/day",
      progress: 75,
      status: "needs_attention"
    }
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'good':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'danger':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-800'
      case 'on_track':
        return 'bg-blue-100 text-blue-800'
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800'
      case 'off_track':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getGoalStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle className="h-4 w-4" />
      case 'on_track':
        return <TrendingUp className="h-4 w-4" />
      case 'needs_attention':
        return <AlertCircle className="h-4 w-4" />
      case 'off_track':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </RoleBasedLayout>
    )
  }

  if (!user || user.role !== 'patient') {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Patient role required.</p>
          </div>
        </div>
      </RoleBasedLayout>
    )
  }

  return (
    <RoleBasedLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Health Tracking</h2>
            <p className="text-gray-600">Monitor your vital signs and health metrics</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select time period"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">This Year</option>
            </select>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Reading
            </Button>
          </div>
        </div>
      </div>

      {/* Health Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium">Blood Pressure</h3>
                  <p className="text-sm text-gray-600">Last: {healthMetrics.bloodPressure.lastReading}</p>
                </div>
              </div>
              {getTrendIcon(healthMetrics.bloodPressure.trend)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">
                  {healthMetrics.bloodPressure.current.systolic}/{healthMetrics.bloodPressure.current.diastolic}
                </span>
                <Badge className={getStatusColor(healthMetrics.bloodPressure.status)}>
                  {healthMetrics.bloodPressure.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">mmHg</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Heart Rate</h3>
                  <p className="text-sm text-gray-600">Last: {healthMetrics.heartRate.lastReading}</p>
                </div>
              </div>
              {getTrendIcon(healthMetrics.heartRate.trend)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{healthMetrics.heartRate.current}</span>
                <Badge className={getStatusColor(healthMetrics.heartRate.status)}>
                  {healthMetrics.heartRate.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">bpm</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Thermometer className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">Temperature</h3>
                  <p className="text-sm text-gray-600">Last: {healthMetrics.temperature.lastReading}</p>
                </div>
              </div>
              {getTrendIcon(healthMetrics.temperature.trend)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{healthMetrics.temperature.current}</span>
                <Badge className={getStatusColor(healthMetrics.temperature.status)}>
                  {healthMetrics.temperature.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">°C</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Weight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Weight</h3>
                  <p className="text-sm text-gray-600">Last: {healthMetrics.weight.lastReading}</p>
                </div>
              </div>
              {getTrendIcon(healthMetrics.weight.trend)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{healthMetrics.weight.current}</span>
                <Badge className={getStatusColor(healthMetrics.weight.status)}>
                  {healthMetrics.weight.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">kg</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Droplets className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Blood Sugar</h3>
                  <p className="text-sm text-gray-600">Last: {healthMetrics.bloodSugar.lastReading}</p>
                </div>
              </div>
              {getTrendIcon(healthMetrics.bloodSugar.trend)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{healthMetrics.bloodSugar.current}</span>
                <Badge className={getStatusColor(healthMetrics.bloodSugar.status)}>
                  {healthMetrics.bloodSugar.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">mg/dL</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Health Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{goal.title}</h4>
                    <Badge className={getGoalStatusColor(goal.status)}>
                      {getGoalStatusIcon(goal.status)}
                      <span className="ml-1 capitalize">{goal.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Current: {goal.current}</span>
                    <span>Target: {goal.target}</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="text-right text-sm text-gray-500">
                    {goal.progress}% complete
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Readings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReadings.map((reading) => (
                <div key={reading.id} className="flex justify-between items-start p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{reading.type}</span>
                      <Badge className={getStatusColor(reading.status)} variant="secondary">
                        {reading.status}
                      </Badge>
                    </div>
                    <div className="text-lg font-semibold">{reading.value}</div>
                    <div className="text-xs text-gray-500">
                      {reading.date} at {reading.time}
                    </div>
                    {reading.notes && (
                      <div className="text-xs text-gray-600 mt-1">{reading.notes}</div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  )
}
