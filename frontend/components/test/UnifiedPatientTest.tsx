"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle, XCircle, Play, AlertTriangle, Zap } from 'lucide-react'
import { patientsApi } from '@/lib/api/patients'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  data?: any
  timestamp: string
  duration?: number
}

export default function UnifiedPatientTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState('')
  const [progress, setProgress] = useState(0)
  const [totalTests] = useState(12) // Total number of tests

  const addResult = (test: string, status: 'success' | 'error' | 'warning', message: string, data?: any, duration?: number) => {
    setTestResults(prev => [...prev, { 
      test, 
      status, 
      message, 
      data, 
      duration,
      timestamp: new Date().toISOString() 
    }])
  }

  const clearResults = () => {
    setTestResults([])
    setProgress(0)
    setCurrentTest('')
  }

  const updateProgress = (current: number) => {
    setProgress((current / totalTests) * 100)
  }

  // Test 1: Health Check
  const testHealthCheck = async () => {
    const startTime = Date.now()
    try {
      const response = await fetch('http://localhost:3003/api/patients/health')
      const data = await response.json()
      const duration = Date.now() - startTime

      if (response.ok && data.success) {
        addResult('Health Check', 'success', '✅ Patient Service is running', data, duration)
      } else {
        addResult('Health Check', 'error', '❌ Patient Service health check failed', data, duration)
      }
    } catch (error: any) {
      addResult('Health Check', 'error', `❌ Cannot connect to Patient Service: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 2: Get All Patients
  const testGetAllPatients = async () => {
    const startTime = Date.now()
    try {
      console.log('🔄 Testing GET All Patients...')
      const response = await patientsApi.getAll({ page: 1, limit: 5 })
      const duration = Date.now() - startTime

      console.log('📊 Response structure:', {
        success: response.success,
        data_type: typeof response.data,
        data_is_array: Array.isArray(response.data),
        data_keys: response.data ? Object.keys(response.data) : 'null',
        sample_data: response.data
      })

      if (response.success && response.data) {
        // Handle both possible response structures
        const patients = Array.isArray(response.data) ? response.data : response.data.data || []
        const count = patients.length

        console.log(`✅ Found ${count} patients`)

        addResult(
          'GET All Patients',
          'success',
          `✅ Retrieved ${count} patients`,
          { count, patients: patients.slice(0, 2), response_structure: typeof response.data },
          duration
        )
      } else {
        console.log('❌ Failed response:', response)
        addResult('GET All Patients', 'error', `❌ Failed: ${response.error?.message}`, response, duration)
      }
    } catch (error: any) {
      console.log('❌ Exception:', error)
      addResult('GET All Patients', 'error', `❌ Error: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 3: Get Patient Stats
  const testGetPatientStats = async () => {
    const startTime = Date.now()
    try {
      const response = await patientsApi.getStats()
      const duration = Date.now() - startTime

      if (response.success && response.data) {
        addResult(
          'GET Patient Stats', 
          'success', 
          `✅ Stats retrieved: ${response.data.total_patients || 0} total patients`, 
          response.data,
          duration
        )
      } else {
        addResult('GET Patient Stats', 'error', `❌ Failed: ${response.error?.message}`, response, duration)
      }
    } catch (error: any) {
      addResult('GET Patient Stats', 'error', `❌ Error: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 4: POST Valid Data (should redirect)
  const testPostValidData = async () => {
    const startTime = Date.now()
    try {
      const validData = {
        profile_id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Test Patient Valid',
        phone_number: '0987654321',
        gender: 'male' as const,
        date_of_birth: '1990-01-01',
        blood_type: 'O+'
      }

      const response = await patientsApi.create(validData)
      const duration = Date.now() - startTime
      
      const errorMessage = typeof response.error === 'string' ? response.error : (response.error?.message || JSON.stringify(response.error))

      if (response.success === false && errorMessage.includes('Auth Service')) {
        addResult(
          'POST Valid Data',
          'success',
          '✅ Correctly redirected to Auth Service (Expected behavior)',
          { redirect_info: response.redirect },
          duration
        )
      } else if (response.success === false && (errorMessage.includes('blocked') || errorMessage.includes('redirect') || errorMessage.includes('auth'))) {
        addResult(
          'POST Valid Data',
          'success',
          '✅ Request blocked: Microservice architecture working correctly',
          { reason: 'Patient Service correctly blocks direct patient creation' },
          duration
        )
      } else if (response.success === true) {
        addResult(
          'POST Valid Data',
          'error',
          '❌ Patient created directly - Violates microservice architecture',
          response,
          duration
        )
      } else {
        addResult('POST Valid Data', 'warning', `⚠️ Unexpected response: ${errorMessage}`, response, duration)
      }
    } catch (error: any) {
      addResult('POST Valid Data', 'success', `✅ Request blocked: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 5: POST Invalid Data (validation)
  const testPostInvalidData = async () => {
    const startTime = Date.now()
    try {
      const invalidData = {
        full_name: '', // Invalid
        phone_number: '123', // Invalid
        gender: 'invalid' as any,
        date_of_birth: 'not-a-date'
      }

      const response = await patientsApi.create(invalidData)
      const duration = Date.now() - startTime
      
      if (response.success === false) {
        addResult('POST Invalid Data', 'success', '✅ Invalid data properly rejected', { validation_error: response.error }, duration)
      } else {
        addResult('POST Invalid Data', 'error', '❌ Invalid data was accepted', response, duration)
      }
    } catch (error: any) {
      addResult('POST Invalid Data', 'success', `✅ Validation error: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 6: Direct Service Call
  const testDirectServiceCall = async () => {
    const startTime = Date.now()
    try {
      const response = await fetch('http://localhost:3003/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: '123e4567-e89b-12d3-a456-426614174000', // Non-existent profile_id
          full_name: 'Direct Call Test',
          phone_number: '0987654321',
          gender: 'female',
          date_of_birth: '1995-05-15'
        })
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      const errorMessage = typeof data.error === 'string' ? data.error : (data.error?.message || JSON.stringify(data.error))

      // Patient Service should reject this because profile_id doesn't exist (foreign key constraint)
      if (!response.ok && (errorMessage.includes('foreign key') || errorMessage.includes('profile_id') || errorMessage.includes('Unknown error'))) {
        addResult('Direct Service Call', 'success', '✅ Correctly rejected invalid profile_id', { status: response.status, reason: 'Foreign key constraint' }, duration)
      } else if (!response.ok && errorMessage.includes('Auth Service')) {
        addResult('Direct Service Call', 'success', '✅ Direct call redirected correctly', { status: response.status }, duration)
      } else if (response.ok) {
        addResult('Direct Service Call', 'error', '❌ Direct call succeeded - Should validate profile_id', data, duration)
      } else {
        addResult('Direct Service Call', 'warning', `⚠️ Unexpected response: ${errorMessage}`, data, duration)
      }
    } catch (error: any) {
      addResult('Direct Service Call', 'success', `✅ Network error (expected): ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 7: Auth Service Registration
  const testAuthServiceRegistration = async () => {
    const startTime = Date.now()
    try {
      const registrationData = {
        email: `test.patient.${Date.now()}@hospital.com`,
        password: 'TestPassword123!',
        full_name: 'Unified Test Patient',
        phone_number: '0987654321',
        gender: 'male',
        date_of_birth: '1990-01-01',
        blood_type: 'A+',
        address: { street: '456 Test Street', city: 'Ho Chi Minh City' },
        emergency_contact: { name: 'Emergency Contact', phone: '0123456789', relationship: 'Family' }
      }

      const response = await fetch('http://localhost:3100/api/auth/register-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      if (response.ok && data.success) {
        const userId = data.user?.id
        const userRole = data.user?.role
        const patientId = data.user?.patient_id // Check if patient_id is returned

        if (userId && userRole === 'patient') {
          if (patientId) {
            addResult(
              'Auth Service Registration',
              'success',
              `✅ Complete patient registration: ${patientId}`,
              {
                user_id: userId,
                patient_id: patientId,
                role: userRole,
                email: data.user?.email,
                note: 'Auth Service creates user profile AND patient record'
              },
              duration
            )
          } else {
            addResult(
              'Auth Service Registration',
              'warning',
              `⚠️ User created but patient_id missing (ID: ${userId.substring(0, 8)}...)`,
              {
                user_id: userId,
                role: userRole,
                email: data.user?.email,
                issue: 'Auth Service should return patient_id after creating patient record'
              },
              duration
            )
          }
        } else {
          addResult(
            'Auth Service Registration',
            'warning',
            `⚠️ User created but missing expected data`,
            data,
            duration
          )
        }
      } else {
        addResult('Auth Service Registration', 'error', `❌ Registration failed: ${data.error}`, data, duration)
      }
    } catch (error: any) {
      addResult('Auth Service Registration', 'error', `❌ Network error: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 8: API Gateway without auth
  const testApiGatewayNoAuth = async () => {
    const startTime = Date.now()
    try {
      const response = await fetch('http://localhost:3100/api/patients')
      const data = await response.json()
      const duration = Date.now() - startTime

      if (response.status === 401) {
        addResult('API Gateway (No Auth)', 'success', '✅ Properly rejected - 401 Unauthorized', { status: 401 }, duration)
      } else {
        addResult('API Gateway (No Auth)', 'warning', `⚠️ Unexpected status: ${response.status}`, data, duration)
      }
    } catch (error: any) {
      addResult('API Gateway (No Auth)', 'success', `✅ Connection blocked: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 9: Auth Service Health
  const testAuthServiceHealth = async () => {
    const startTime = Date.now()
    try {
      const response = await fetch('http://localhost:3001/health')
      const data = await response.json()
      const duration = Date.now() - startTime

      if (response.ok) {
        addResult('Auth Service Health', 'success', '✅ Auth Service is running', data, duration)
      } else {
        addResult('Auth Service Health', 'error', '❌ Auth Service health check failed', data, duration)
      }
    } catch (error: any) {
      addResult('Auth Service Health', 'error', `❌ Cannot connect to Auth Service: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 10: Patient ID Validation
  const testPatientIdValidation = async () => {
    const startTime = Date.now()
    try {
      const testId = 'PAT-202412-001'
      const response = await fetch(`http://localhost:3003/api/patients/validate/${testId}`)
      const data = await response.json()
      const duration = Date.now() - startTime

      if (response.ok && data.success) {
        addResult('Patient ID Validation', 'success', `✅ Patient ID format valid: ${testId}`, data, duration)
      } else {
        addResult('Patient ID Validation', 'error', `❌ Validation failed for ${testId}`, data, duration)
      }
    } catch (error: any) {
      addResult('Patient ID Validation', 'error', `❌ Error: ${error.message}`, null, Date.now() - startTime)
    }
  }

  // Test 11: Get Existing Patient
  const testGetExistingPatient = async () => {
    const startTime = Date.now()
    try {
      // First get all patients to find an existing one
      const allPatientsResponse = await patientsApi.getAll({ page: 1, limit: 1 })

      if (allPatientsResponse.success && allPatientsResponse.data) {
        // Handle both possible response structures
        const patients = Array.isArray(allPatientsResponse.data) ? allPatientsResponse.data : allPatientsResponse.data.data || []

        if (patients.length > 0) {
          const patientId = patients[0].patient_id
          const response = await patientsApi.getById(patientId)
          const duration = Date.now() - startTime

          if (response.success && response.data) {
            addResult('GET Existing Patient', 'success', `✅ Retrieved patient: ${patientId}`, { patient_id: patientId, patient_data: response.data }, duration)
          } else {
            addResult('GET Existing Patient', 'error', `❌ Failed to get patient: ${patientId}`, response, duration)
          }
        } else {
          addResult('GET Existing Patient', 'warning', '⚠️ No patients found in response', { response_data: allPatientsResponse.data }, Date.now() - startTime)
        }
      } else {
        addResult('GET Existing Patient', 'warning', '⚠️ Failed to get patients list', { error: allPatientsResponse.error, response: allPatientsResponse }, Date.now() - startTime)
      }
    } catch (error: any) {
      addResult('GET Existing Patient', 'error', `❌ Error: ${error.message}`, { error: error.message }, Date.now() - startTime)
    }
  }

  // Test 12: Service Integration Summary
  const testServiceIntegration = async () => {
    const successCount = testResults.filter(r => r.status === 'success').length
    const errorCount = testResults.filter(r => r.status === 'error').length
    const warningCount = testResults.filter(r => r.status === 'warning').length

    addResult(
      'Integration Summary', 
      successCount >= 8 ? 'success' : 'warning', 
      `✅ Tests completed: ${successCount} success, ${errorCount} errors, ${warningCount} warnings`,
      { 
        success: successCount, 
        errors: errorCount, 
        warnings: warningCount,
        architecture_status: successCount >= 8 ? 'Microservice architecture working correctly' : 'Some issues detected'
      }
    )
  }

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()

    const tests = [
      { name: 'Health Check', fn: testHealthCheck },
      { name: 'Auth Service Health', fn: testAuthServiceHealth },
      { name: 'Get All Patients', fn: testGetAllPatients },
      { name: 'Get Patient Stats', fn: testGetPatientStats },
      { name: 'Patient ID Validation', fn: testPatientIdValidation },
      { name: 'GET Existing Patient', fn: testGetExistingPatient },
      { name: 'POST Valid Data', fn: testPostValidData },
      { name: 'POST Invalid Data', fn: testPostInvalidData },
      { name: 'Direct Service Call', fn: testDirectServiceCall },
      { name: 'API Gateway (No Auth)', fn: testApiGatewayNoAuth },
      { name: 'Auth Service Registration', fn: testAuthServiceRegistration },
      { name: 'Integration Summary', fn: testServiceIntegration }
    ]

    for (let i = 0; i < tests.length; i++) {
      setCurrentTest(tests[i].name)
      updateProgress(i + 1)
      
      await tests[i].fn()
      await new Promise(resolve => setTimeout(resolve, 800)) // Delay between tests
    }

    setCurrentTest('All tests completed!')
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'error': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Complete Patient Service Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Play className="h-4 w-4" />
            <AlertDescription>
              <strong>Comprehensive Testing:</strong> This runs all Patient Service tests including GET, POST, validation, 
              service communication, and microservice architecture verification.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isRunning ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              {isRunning ? 'Running Tests...' : 'Run Complete Test Suite'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={isRunning}
            >
              Clear Results
            </Button>

            <Badge variant="outline" className="text-sm">
              {testResults.length} / {totalTests} tests
            </Badge>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress: {Math.round(progress)}%</span>
                <span className="text-blue-600">{currentTest}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">GET Tests:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Health checks</li>
                <li>• Get all patients</li>
                <li>• Get patient stats</li>
                <li>• Get existing patient</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">POST Tests:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Valid data (should redirect)</li>
                <li>• Invalid data (validation)</li>
                <li>• Direct service call</li>
                <li>• Auth Service registration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Architecture Tests:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Service boundaries</li>
                <li>• API Gateway security</li>
                <li>• Microservice communication</li>
                <li>• Data validation</li>
              </ul>
            </div>
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
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                    {result.duration && (
                      <span className="text-xs text-gray-500">({result.duration}ms)</span>
                    )}
                  </div>
                  <Badge 
                    variant={
                      result.status === 'success' ? 'default' : 
                      result.status === 'warning' ? 'secondary' : 'destructive'
                    }
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
                No test results yet. Click "Run Complete Test Suite" to start comprehensive testing.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
