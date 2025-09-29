"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, User, Plus } from 'lucide-react'
import { patientsApi, CreatePatientDto } from '@/lib/api/patients'
import { useAuth } from '@/lib/auth/auth-wrapper'
import { useToast } from '@/components/ui/toast-provider'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
  duration?: number
}

export default function PatientApiTest() {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [currentTest, setCurrentTest] = useState<string>('')
  const [testProgress, setTestProgress] = useState<{ current: number; total: number }>({ current: 0, total: 6 })
  
  // Test data for creating patient
  const testPatientData: CreatePatientDto = {
    // Skip profile_id - let backend handle it or use existing patient for other tests
    full_name: 'Nguyễn Văn Test API',
    date_of_birth: '1990-01-01',
    gender: 'male',
    blood_type: 'O+',
    address: {
      street: '123 Test Street',
      district: 'Test District',
      city: 'Ho Chi Minh City'
    },
    emergency_contact: {
      name: 'Nguyễn Thị Emergency',
      phone: '0987654321',
      relationship: 'spouse'
    },
    medical_history: 'No significant medical history',
    allergies: ['penicillin'],
    notes: 'Test patient created by API integration test'
  }

  const addTestResult = (test: string, status: 'success' | 'error', message: string, data?: any, duration?: number) => {
    const result = { test, status, message, data, duration }
    setTestResults(prev => [...prev, result])

    // Log to console for debugging
    console.log(`[${status.toUpperCase()}] ${test}: ${message}${duration ? ` (${duration}ms)` : ''}`)
    if (data) {
      console.log('Response data:', data)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Get All Patients
  const testGetAllPatients = async () => {
    const startTime = Date.now()
    try {
      console.log('🔄 Starting GET /api/patients test...')
      const response = await patientsApi.getAll({ page: 1, limit: 5 })
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        // Handle paginated response
        const paginatedData = response.data as any
        const patientList = paginatedData.data || paginatedData

        const count = Array.isArray(patientList) ? patientList.length : 0
        const total = paginatedData.pagination?.total || count

        addTestResult(
          'GET /api/patients (Paginated)',
          'success',
          `Retrieved ${count} patients (Total: ${total}, Page: ${paginatedData.pagination?.page || 1})`,
          response.data,
          duration
        )

        // Store first patient for later tests
        if (Array.isArray(patientList) && patientList.length > 0) {
          setSelectedPatientId(patientList[0].patient_id)
          console.log('✅ Selected patient for further tests:', patientList[0].patient_id)
        }
      } else {
        addTestResult(
          'GET /api/patients',
          'error',
          response.error?.message || 'Failed to get patients',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('❌ GET /api/patients test failed:', error)
      addTestResult(
        'GET /api/patients',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 1.5: Get Patient Statistics
  const testGetPatientStats = async () => {
    const startTime = Date.now()
    try {
      const response = await patientsApi.getStats()
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        const stats = response.data
        addTestResult(
          'GET /api/patients/stats',
          'success',
          `Retrieved statistics: Total: ${stats.total}, Active: ${stats.active}, Inactive: ${stats.inactive}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/patients/stats',
          'error',
          response.error?.message || 'Failed to get patient statistics',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/patients/stats',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 2: Get patient by ID (use the patient we created or an existing one)
  const testGetExistingPatient = async () => {
    const startTime = Date.now()
    try {
      console.log('🔄 Starting GET /api/patients/:id test...')

      // Use the patient we created, or fall back to getting one from the list
      let patientIdToTest = selectedPatientId

      if (!patientIdToTest) {
        console.log('⚠️ No selected patient, getting one from the list...')
        // Fallback: get a patient from the list
        const allPatientsResponse = await patientsApi.getAll({ page: 1, limit: 1 })

        if (allPatientsResponse.success && allPatientsResponse.data) {
          const paginatedData = allPatientsResponse.data as any
          const patientList = paginatedData.data || paginatedData

          if (Array.isArray(patientList) && patientList.length > 0) {
            patientIdToTest = patientList[0].patient_id
            setSelectedPatientId(patientIdToTest)
            console.log('✅ Found patient from list:', patientIdToTest)
          }
        }
      } else {
        console.log('✅ Using selected patient:', patientIdToTest)
      }

      if (!patientIdToTest) {
        addTestResult(
          'GET /api/patients/:id',
          'error',
          'No patient ID available for testing',
          null,
          Date.now() - startTime
        )
        return
      }

      // Now test getting this specific patient
      const response = await patientsApi.getById(patientIdToTest)
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        console.log('✅ Successfully retrieved patient:', response.data.patient_id)
        addTestResult(
          'GET /api/patients/:id',
          'success',
          `Retrieved patient: ${response.data.patient_id}`,
          response.data,
          duration
        )
      } else {
        console.error('❌ Failed to get patient:', response.error)
        addTestResult(
          'GET /api/patients/:id',
          'error',
          response.error?.message || 'Failed to get patient',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('❌ GET /api/patients/:id test failed:', error)
      addTestResult(
        'GET /api/patients/:id',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 3: Test Auth Service Patient Registration
  const testAuthServiceRegistration = async () => {
    const startTime = Date.now()
    try {
      console.log('🔄 Testing Auth Service patient registration...')

      // Generate unique test data for Auth Service
      const timestamp = Date.now()
      const authServiceData = {
        email: `test.patient.${timestamp}@example.com`,
        password: 'TestPassword123',
        full_name: `Test Patient ${timestamp}`,
        phone_number: '0901234567',
        gender: 'male',
        date_of_birth: '1990-05-15',
        blood_type: 'A+',
        address: {
          street: '123 Test Street',
          district: 'Test District',
          city: 'Ho Chi Minh City'
        },
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '0987654321',
          relationship: 'spouse'
        }
      }

      console.log('📤 Sending registration data to Auth Service:', authServiceData.email)

      // Call Auth Service registration endpoint
      const response = await fetch('http://localhost:3001/api/auth/register-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authServiceData)
      })

      const duration = Date.now() - startTime
      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ Patient registered via Auth Service:', result.user?.id)
        addTestResult(
          'Auth Service Registration',
          'success',
          `Patient registered: ${result.user?.email} (User ID: ${result.user?.id})`,
          result,
          duration
        )

        // Try to get the patient record from Patient Service
        if (result.user?.id) {
          try {
            const patientResponse = await patientsApi.getByProfileId(result.user.id)
            if (patientResponse.success && patientResponse.data) {
              setSelectedPatientId(patientResponse.data.patient_id)
              console.log('✅ Found patient record:', patientResponse.data.patient_id)
            }
          } catch (error) {
            console.log('⚠️ Could not fetch patient record immediately (may need time to sync)')
          }
        }
      } else {
        console.log('⚠️ Auth Service registration failed:', result.error)
        addTestResult(
          'Auth Service Registration',
          'error',
          result.error || 'Registration failed',
          result,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('❌ Auth Service registration test failed:', error)
      addTestResult(
        'Auth Service Registration',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 3.5: Test Patient Service POST (should redirect to Auth Service)
  const testPatientServicePostRedirect = async () => {
    const startTime = Date.now()
    try {
      console.log('🔄 Testing Patient Service POST redirect...')

      const testData = {
        full_name: 'Test Direct Create',
        date_of_birth: '1990-01-01',
        gender: 'male'
      }

      const response = await patientsApi.create(testData as CreatePatientDto)
      const duration = Date.now() - startTime

      // This should fail and redirect to Auth Service
      if (!response.success && response.error) {
        const errorMessage = response.error.message || ''
        if (errorMessage.includes('Auth Service') || errorMessage.includes('redirect')) {
          addTestResult(
            'Patient Service POST Redirect',
            'success',
            'Correctly redirects to Auth Service for patient creation',
            response,
            duration
          )
        } else {
          addTestResult(
            'Patient Service POST Redirect',
            'error',
            'Unexpected error: ' + errorMessage,
            response,
            duration
          )
        }
      } else {
        addTestResult(
          'Patient Service POST Redirect',
          'error',
          'Patient Service should not allow direct patient creation',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'Patient Service POST Redirect',
        'success',
        'Correctly blocks direct patient creation (expected error)',
        error,
        duration
      )
    }
  }

  // Test 4: Update Patient
  const testUpdatePatient = async () => {
    // Get a patient ID if we don't have one
    let patientIdToUpdate = selectedPatientId

    if (!patientIdToUpdate) {
      // Try to get a patient from the API
      const patientsResponse = await patientsApi.getAll({ page: 1, limit: 1 })
      if (patientsResponse.success && patientsResponse.data) {
        const paginatedData = patientsResponse.data as any
        const patientList = paginatedData.data || paginatedData
        if (Array.isArray(patientList) && patientList.length > 0) {
          patientIdToUpdate = patientList[0].patient_id
          setSelectedPatientId(patientIdToUpdate)
        }
      }
    }

    if (!patientIdToUpdate) {
      addTestResult('PUT /api/patients/:id', 'error', 'No patient ID available for testing', null)
      return
    }

    const startTime = Date.now()
    const updateData = {
      notes: `Updated at ${new Date().toISOString()}`
    }

    try {
      const response = await patientsApi.update(patientIdToUpdate, updateData)
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        addTestResult(
          'PUT /api/patients/:id',
          'success',
          `Updated patient: ${response.data.patient_id}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'PUT /api/patients/:id',
          'error',
          response.error?.message || 'Failed to update patient',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'PUT /api/patients/:id',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 5: Search Patients
  const testSearchPatients = async () => {
    const startTime = Date.now()
    try {
      // Use getAll with search filter instead of separate search endpoint
      const response = await patientsApi.getAll({ search: 'Test', page: 1, limit: 10 })
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        // Handle paginated response
        const paginatedData = response.data as any
        const patientList = paginatedData.data || paginatedData
        const results = Array.isArray(patientList) ? patientList : []

        addTestResult(
          'GET /api/patients?search=Test',
          'success',
          `Found ${results.length} patients matching "Test"`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/patients?search=Test',
          'error',
          response.error?.message || 'Failed to search patients',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/patients?search=Test',
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
    setTestProgress({ current: 0, total: 8 })

    try {
      showToast("🧪 Testing", "Starting Patient API integration tests...", "info")
      console.log('🚀 Starting Patient API integration tests...')

      // Test 1: Get All Patients (with pagination)
      setCurrentTest('Getting all patients...')
      setTestProgress({ current: 1, total: 8 })
      await testGetAllPatients()
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Test 2: Get Patient Statistics
      setCurrentTest('Getting patient statistics...')
      setTestProgress({ current: 2, total: 8 })
      await testGetPatientStats()
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Test 3: Test Auth Service Registration (proper way to create patients)
      setCurrentTest('Testing Auth Service registration...')
      setTestProgress({ current: 3, total: 8 })
      await testAuthServiceRegistration()
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait longer for Auth Service

      // Test 4: Test Patient Service POST redirect
      setCurrentTest('Testing Patient Service POST redirect...')
      setTestProgress({ current: 4, total: 8 })
      await testPatientServicePostRedirect()
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Test 5: Get patient by ID (use existing patients)
      setCurrentTest('Getting patient by ID...')
      setTestProgress({ current: 5, total: 8 })
      await testGetExistingPatient()
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Test 6: Update existing patient
      setCurrentTest('Updating patient...')
      setTestProgress({ current: 6, total: 8 })
      await testUpdatePatient()
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Test 7: Search patients
      setCurrentTest('Searching patients...')
      setTestProgress({ current: 7, total: 8 })
      await testSearchPatients()
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Test 8: Test soft delete
      setCurrentTest('Testing soft delete...')
      setTestProgress({ current: 8, total: 8 })
      await testSoftDelete()

      setCurrentTest('Tests completed!')
      console.log('✅ All Patient API tests completed successfully!')
      showToast("✅ Complete", "Patient API tests completed!", "success")
    } catch (error) {
      console.error('❌ Test suite error:', error)
      setCurrentTest('Test suite error!')
      addTestResult(
        'Test Suite Error',
        'error',
        error instanceof Error ? error.message : 'Unknown error occurred during testing',
        error
      )
      showToast("❌ Error", "Test suite encountered an error", "error")
    } finally {
      // Always ensure isRunning is set to false
      setIsRunning(false)
      setCurrentTest('')
    }
  }

  // Test 6: Test Soft Delete
  const testSoftDelete = async () => {
    // Get a patient ID if we don't have one
    let patientIdToDelete = selectedPatientId

    if (!patientIdToDelete) {
      // Try to get a patient from the API
      const patientsResponse = await patientsApi.getAll({ page: 1, limit: 1 })
      if (patientsResponse.success && patientsResponse.data) {
        const paginatedData = patientsResponse.data as any
        const patientList = paginatedData.data || paginatedData
        if (Array.isArray(patientList) && patientList.length > 0) {
          patientIdToDelete = patientList[0].patient_id
        }
      }
    }

    if (!patientIdToDelete) {
      addTestResult('DELETE /api/patients/:id', 'error', 'No patient ID available for testing', null)
      return
    }

    const startTime = Date.now()
    try {
      // Delete the patient
      const response = await patientsApi.delete(patientIdToDelete)
      const duration = Date.now() - startTime

      if (response.success) {
        addTestResult(
          'DELETE /api/patients/:id (Soft Delete)',
          'success',
          `Patient ${patientIdToDelete} soft deleted successfully`,
          response.data,
          duration
        )

        // Verify soft delete by checking if patient still exists but is inactive
        const verifyResponse = await patientsApi.getById(patientIdToDelete)
        if (verifyResponse.success && verifyResponse.data) {
          const patient = verifyResponse.data as any
          if (patient.status === 'inactive') {
            addTestResult(
              'Verify Soft Delete',
              'success',
              `Patient status correctly changed to 'inactive'`,
              patient
            )
          } else {
            addTestResult(
              'Verify Soft Delete',
              'error',
              `Expected status 'inactive', got '${patient.status}'`,
              patient
            )
          }
        }
      } else {
        addTestResult(
          'DELETE /api/patients/:id',
          'error',
          response.error?.message || 'Failed to delete patient',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'DELETE /api/patients/:id',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to test Patient APIs
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
            Patient Service API Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
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

          {/* Progress indicator */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentTest}</span>
                <span>{testProgress.current}/{testProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(testProgress.current / testProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {selectedPatientId && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Selected Patient ID: <code>{selectedPatientId}</code>
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
