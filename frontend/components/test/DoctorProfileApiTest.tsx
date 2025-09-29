"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, XCircle, User, Calendar, Star, Briefcase, BarChart3 } from 'lucide-react'
import { doctorsApi } from '@/lib/api/doctors'
import { useAuth } from '@/lib/auth/auth-wrapper'
import { useToast } from '@/components/ui/toast-provider'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
  duration?: number
}

export default function DoctorProfileApiTest() {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [doctorId, setDoctorId] = useState<string>('CARD-DOC-202412-001')
  
  const addTestResult = (test: string, status: 'success' | 'error', message: string, data?: any, duration?: number) => {
    setTestResults(prev => [...prev, { test, status, message, data, duration }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test Doctor Profile
  const testDoctorProfile = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.getProfile(doctorId)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        addTestResult(
          'GET /api/doctors/:id/profile',
          'success',
          `Retrieved doctor profile: ${response.data.doctor?.doctor_id || 'N/A'}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors/:id/profile',
          'error',
          response.error?.message || 'Failed to get doctor profile',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors/:id/profile',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test Doctor Schedule
  const testDoctorSchedule = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.getSchedule(doctorId)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        const schedules = Array.isArray(response.data) ? response.data : []
        addTestResult(
          'GET /api/doctors/:id/schedule',
          'success',
          `Retrieved ${schedules.length} schedule entries`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors/:id/schedule',
          'error',
          response.error?.message || 'Failed to get doctor schedule',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors/:id/schedule',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test Today's Schedule
  const testTodaySchedule = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.getTodaySchedule(doctorId)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        addTestResult(
          'GET /api/doctors/:id/schedule/today',
          'success',
          `Retrieved today's schedule data`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors/:id/schedule/today',
          'error',
          response.error?.message || 'Failed to get today schedule',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors/:id/schedule/today',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test Doctor Reviews
  const testDoctorReviews = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.getReviews(doctorId, 1, 5)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        const reviews = response.data.reviews || []
        addTestResult(
          'GET /api/doctors/:id/reviews',
          'success',
          `Retrieved ${reviews.length} reviews`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors/:id/reviews',
          'error',
          response.error?.message || 'Failed to get doctor reviews',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors/:id/reviews',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test Doctor Experiences
  const testDoctorExperiences = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.getExperiences(doctorId)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        const experiences = response.data.experiences || []
        addTestResult(
          'GET /api/doctors/:id/experiences',
          'success',
          `Retrieved ${experiences.length} work experiences`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors/:id/experiences',
          'error',
          response.error?.message || 'Failed to get doctor experiences',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors/:id/experiences',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test Doctor Statistics
  const testDoctorStats = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.getStats(doctorId)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        addTestResult(
          'GET /api/doctors/:id/stats',
          'success',
          `Retrieved doctor statistics`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors/:id/stats',
          'error',
          response.error?.message || 'Failed to get doctor stats',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors/:id/stats',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Run all profile tests
  const runAllProfileTests = async () => {
    if (!doctorId.trim()) {
      showToast("⚠️ Warning", "Please enter a doctor ID", "warning")
      return
    }

    setIsRunning(true)
    clearResults()
    
    showToast("👤 Profile Testing", "Starting Doctor Profile API tests...", "info")
    
    await testDoctorProfile()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testDoctorSchedule()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testTodaySchedule()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testDoctorReviews()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testDoctorExperiences()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testDoctorStats()
    
    setIsRunning(false)
    showToast("✅ Complete", "Doctor Profile API tests completed!", "success")
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to test Doctor Profile APIs
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Doctor Profile API Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doctorId">Doctor ID</Label>
              <Input
                id="doctorId"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                placeholder="Enter doctor ID (e.g., CARD-DOC-202412-001)"
                disabled={isRunning}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={runAllProfileTests} 
                disabled={isRunning || !doctorId.trim()}
                className="flex items-center gap-2 w-full"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                Run Profile Tests
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={isRunning}
              size="sm"
            >
              Clear Results
            </Button>
            
            <Badge variant="outline">
              User: {user?.role} | {user?.full_name}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Individual Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              onClick={testDoctorProfile}
              disabled={isRunning || !doctorId.trim()}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testDoctorSchedule}
              disabled={isRunning || !doctorId.trim()}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testTodaySchedule}
              disabled={isRunning || !doctorId.trim()}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Today
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testDoctorReviews}
              disabled={isRunning || !doctorId.trim()}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Reviews
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testDoctorExperiences}
              disabled={isRunning || !doctorId.trim()}
              className="flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Experience
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testDoctorStats}
              disabled={isRunning || !doctorId.trim()}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Statistics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results ({testResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <code className="font-mono text-sm">{result.test}</code>
                    {result.duration && (
                      <Badge variant="outline" className="text-xs">
                        {result.duration}ms
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    variant={result.status === 'success' ? 'default' : 'destructive'}
                  >
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      View Response Data
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            {testResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No test results yet. Click "Run Profile Tests" to start testing.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
