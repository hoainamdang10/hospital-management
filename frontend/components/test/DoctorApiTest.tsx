"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, UserCheck, Plus } from 'lucide-react'
import { doctorsApi } from '@/lib/api/doctors'
import { useAuth } from '@/lib/auth/auth-wrapper'
import { useToast } from '@/components/ui/toast-provider'

interface CreateDoctorTestData {
  profile_id: string
  full_name: string
  date_of_birth: string
  specialty: string
  qualification: string
  department_id: string
  license_number: string
  gender: 'male' | 'female' | 'other'
  bio?: string
  experience_years?: number
  consultation_fee?: number
  languages_spoken?: string[]
  phone_number?: string
  email?: string
}

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
  duration?: number
}

export default function DoctorApiTest() {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  
  // Test data for creating doctor
  const testDoctorData: CreateDoctorTestData = {
    profile_id: user?.id || '',
    full_name: 'BS. Nguyễn Văn Test',
    date_of_birth: '1985-01-01',
    specialty: 'Tim mạch',
    qualification: 'Thạc sĩ Y khoa',
    department_id: 'CARD',
    license_number: 'VN-TM-2024',
    gender: 'male',
    bio: 'Bác sĩ chuyên khoa tim mạch với 10 năm kinh nghiệm',
    experience_years: 10,
    consultation_fee: 500000,
    languages_spoken: ['Vietnamese', 'English'],
    phone_number: '0987654321',
    email: 'doctor.test@hospital.com'
  }

  const addTestResult = (test: string, status: 'success' | 'error', message: string, data?: any, duration?: number) => {
    setTestResults(prev => [...prev, { test, status, message, data, duration }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Get All Doctors
  const testGetAllDoctors = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.getAll({ page: 1, limit: 10 })
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        const paginatedData = response.data as any
        const doctorList = paginatedData.data || paginatedData
        
        const count = Array.isArray(doctorList) ? doctorList.length : 0
        const total = paginatedData.pagination?.total || count
        
        addTestResult(
          'GET /api/doctors',
          'success',
          `Retrieved ${count} doctors (Total: ${total})`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors',
          'error',
          response.error?.message || 'Failed to get doctors',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 2: Create Doctor
  const testCreateDoctor = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.create(testDoctorData)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        setSelectedDoctorId(response.data.doctor_id)
        addTestResult(
          'POST /api/doctors',
          'success',
          `Created doctor with ID: ${response.data.doctor_id}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'POST /api/doctors',
          'error',
          response.error?.message || 'Failed to create doctor',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'POST /api/doctors',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 3: Get Doctor by ID
  const testGetDoctorById = async () => {
    if (!selectedDoctorId) {
      addTestResult('GET /api/doctors/:id', 'error', 'No doctor ID selected', null)
      return
    }

    const startTime = Date.now()
    try {
      const response = await doctorsApi.getById(selectedDoctorId)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        addTestResult(
          'GET /api/doctors/:id',
          'success',
          `Retrieved doctor: ${response.data.doctor_id}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors/:id',
          'error',
          response.error?.message || 'Failed to get doctor',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors/:id',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 4: Get Doctor Profile
  const testGetDoctorProfile = async () => {
    if (!selectedDoctorId) {
      addTestResult('GET /api/doctors/:id/profile', 'error', 'No doctor ID selected', null)
      return
    }

    const startTime = Date.now()
    try {
      const response = await doctorsApi.getProfile(selectedDoctorId)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        addTestResult(
          'GET /api/doctors/:id/profile',
          'success',
          `Retrieved doctor profile: ${response.data.doctor_id}`,
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

  // Test 5: Update Doctor
  const testUpdateDoctor = async () => {
    if (!selectedDoctorId) {
      addTestResult('PUT /api/doctors/:id', 'error', 'No doctor ID selected', null)
      return
    }

    const startTime = Date.now()
    const updateData = {
      bio: `Updated at ${new Date().toISOString()}`
    }

    try {
      const response = await doctorsApi.update(selectedDoctorId, updateData)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        addTestResult(
          'PUT /api/doctors/:id',
          'success',
          `Updated doctor: ${response.data.doctor_id}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'PUT /api/doctors/:id',
          'error',
          response.error?.message || 'Failed to update doctor',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'PUT /api/doctors/:id',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 6: Search Doctors
  const testSearchDoctors = async () => {
    const startTime = Date.now()
    try {
      const response = await doctorsApi.search('Test')
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        const results = Array.isArray(response.data) ? response.data : []
        addTestResult(
          'GET /api/doctors/search',
          'success',
          `Found ${results.length} doctors matching "Test"`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/doctors/search',
          'error',
          response.error?.message || 'Failed to search doctors',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/doctors/search',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 7: Get Doctor Statistics
  const testGetDoctorStats = async () => {
    if (!selectedDoctorId) {
      addTestResult('GET /api/doctors/:id/stats', 'error', 'No doctor ID selected', null)
      return
    }

    const startTime = Date.now()
    try {
      const response = await doctorsApi.getStats(selectedDoctorId)
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

  // Test 8: Get Doctor Schedule
  const testGetDoctorSchedule = async () => {
    if (!selectedDoctorId) {
      addTestResult('GET /api/doctors/:id/schedule', 'error', 'No doctor ID selected', null)
      return
    }

    const startTime = Date.now()
    try {
      const response = await doctorsApi.getSchedule(selectedDoctorId)
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

  // Test 9: Get Today's Schedule
  const testGetTodaySchedule = async () => {
    if (!selectedDoctorId) {
      addTestResult('GET /api/doctors/:id/schedule/today', 'error', 'No doctor ID selected', null)
      return
    }

    const startTime = Date.now()
    try {
      const response = await doctorsApi.getTodaySchedule(selectedDoctorId)
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        const todaySchedule = Array.isArray(response.data) ? response.data : []
        addTestResult(
          'GET /api/doctors/:id/schedule/today',
          'success',
          `Retrieved ${todaySchedule.length} appointments for today`,
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

  // Test 10: Get Doctor Reviews
  const testGetDoctorReviews = async () => {
    if (!selectedDoctorId) {
      addTestResult('GET /api/doctors/:id/reviews', 'error', 'No doctor ID selected', null)
      return
    }

    const startTime = Date.now()
    try {
      const response = await doctorsApi.getReviews(selectedDoctorId, 1, 5)
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        const reviews = Array.isArray(response.data) ? response.data : []
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

  // Test 11: Get Doctor Experiences
  const testGetDoctorExperiences = async () => {
    if (!selectedDoctorId) {
      addTestResult('GET /api/doctors/:id/experiences', 'error', 'No doctor ID selected', null)
      return
    }

    const startTime = Date.now()
    try {
      const response = await doctorsApi.getExperiences(selectedDoctorId)
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        const experiences = Array.isArray(response.data) ? response.data : []
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

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()

    showToast("🧪 Testing", "Starting Doctor API integration tests...", "info")

    // Basic CRUD tests
    await testGetAllDoctors()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testCreateDoctor()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorById()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorProfile()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testUpdateDoctor()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Search and stats tests
    await testSearchDoctors()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorStats()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Profile-related tests
    await testGetDoctorSchedule()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetTodaySchedule()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorReviews()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorExperiences()

    setIsRunning(false)
    showToast("✅ Complete", "All Doctor API tests completed!", "success")
  }

  // Run profile-specific tests only
  const runProfileTests = async () => {
    setIsRunning(true)
    clearResults()

    showToast("👤 Profile Testing", "Starting Doctor Profile API tests...", "info")

    if (!selectedDoctorId) {
      // Try to get a doctor ID first
      await testGetAllDoctors()
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    await testGetDoctorProfile()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorSchedule()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetTodaySchedule()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorReviews()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorExperiences()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testGetDoctorStats()

    setIsRunning(false)
    showToast("✅ Profile Complete", "Doctor Profile API tests completed!", "success")
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to test Doctor APIs
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
            <UserCheck className="h-5 w-5" />
            Doctor Service API Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Run All Tests
            </Button>

            <Button
              onClick={runProfileTests}
              disabled={isRunning}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              Profile Tests Only
            </Button>

            <Button
              variant="outline"
              onClick={clearResults}
              disabled={isRunning}
            >
              Clear Results
            </Button>

            <Badge variant="outline">
              User: {user?.role} | {user?.full_name}
            </Badge>
          </div>

          {selectedDoctorId && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Selected Doctor ID: <code>{selectedDoctorId}</code>
              </AlertDescription>
            </Alert>
          )}
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
              <p className="text-gray-500 text-center py-8">
                No test results yet. Click "Run All Tests" to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
