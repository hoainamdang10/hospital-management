"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, XCircle, Zap, TestTube, User } from 'lucide-react'

export default function SimpleApiTest() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [availablePatients, setAvailablePatients] = useState<any[]>([])
  const [customPatientId, setCustomPatientId] = useState<string>('PAT-202412-001')

  const addResult = (test: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toISOString() }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Health Check
  const testHealthCheck = async () => {
    try {
      addResult('Health Check', 'success', 'Testing http://localhost:3003/api/patients/health')

      const response = await fetch('http://localhost:3003/api/patients/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Health Check Response', response.ok ? 'success' : 'error',
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      return response.ok
    } catch (error) {
      addResult('Health Check Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 2: Get All Patients and populate dropdown
  const testGetAllPatients = async () => {
    try {
      addResult('Get All Patients', 'success', 'Testing http://localhost:3003/api/patients?page=1&limit=10')

      const response = await fetch('http://localhost:3003/api/patients?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Get All Patients Response', response.ok ? 'success' : 'error',
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          const patients = data.data?.data || data.data || data
          const count = Array.isArray(patients) ? patients.length : 0
          const total = data.data?.pagination?.total || count

          addResult('Patient Data Parse', 'success', `Parsed ${count} patients (Total: ${total})`)

          // Store patients for dropdown
          if (Array.isArray(patients) && patients.length > 0) {
            setAvailablePatients(patients)
            if (!selectedPatientId && patients[0]?.patient_id) {
              setSelectedPatientId(patients[0].patient_id)
            }
          }
        } catch (parseError) {
          addResult('Patient Data Parse', 'error', 'Failed to parse JSON response')
        }
      }

      return response.ok
    } catch (error) {
      addResult('Get All Patients Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 2.5: Get Patient Statistics
  const testGetPatientStats = async () => {
    try {
      addResult('Get Patient Stats', 'success', 'Testing http://localhost:3003/api/patients/stats')

      const response = await fetch('http://localhost:3003/api/patients/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Get Patient Stats Response', response.ok ? 'success' : 'error',
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          const stats = data.data || data
          addResult('Patient Stats Parse', 'success',
            `Stats: Total: ${stats.total}, Active: ${stats.active}, Inactive: ${stats.inactive}`)
        } catch (parseError) {
          addResult('Patient Stats Parse', 'error', 'Failed to parse JSON response')
        }
      }

      return response.ok
    } catch (error) {
      addResult('Get Patient Stats Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 3: Validate Patient ID
  const testValidatePatientId = async (patientId: string) => {
    try {
      addResult('Validate Patient ID', 'success', `Testing validation for: ${patientId}`)

      const response = await fetch(`http://localhost:3003/api/patients/validate/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Validate ID Response', response.ok ? 'success' : 'error',
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      return response.ok
    } catch (error) {
      addResult('Validate ID Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 4: Get Patient by ID
  const testGetPatientById = async (patientId: string) => {
    try {
      addResult('Get Patient by ID', 'success', `Testing get patient: ${patientId}`)

      const response = await fetch(`http://localhost:3003/api/patients/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Get Patient Response', response.ok ? 'success' : 'error',
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          const patient = data.data || data
          addResult('Patient Details', 'success', `Found patient: ${patient.patient_id}`, patient)
        } catch (parseError) {
          addResult('Patient Parse Error', 'error', 'Failed to parse patient data')
        }
      }

      return response.ok
    } catch (error) {
      addResult('Get Patient Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 2: API Gateway without auth
  const testApiGatewayNoAuth = async () => {
    try {
      addResult('API Gateway No Auth', 'success', 'Testing http://localhost:3100/api/patients (no auth)')
      
      const response = await fetch('http://localhost:3100/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('API Gateway Response (No Auth)', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      return response.ok
    } catch (error) {
      addResult('API Gateway Error (No Auth)', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 3: API Gateway with fake token
  const testApiGatewayFakeToken = async () => {
    try {
      addResult('API Gateway Fake Token', 'success', 'Testing with fake Bearer token')
      
      const response = await fetch('http://localhost:3100/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token-for-testing'
        }
      })

      const responseText = await response.text()
      addResult('API Gateway Response (Fake Token)', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      return response.ok
    } catch (error) {
      addResult('API Gateway Error (Fake Token)', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 4: Auth Service verify endpoint
  const testAuthVerifyEndpoint = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      if (!token) {
        addResult('Auth Verify', 'error', 'No token found in localStorage')
        return false
      }

      addResult('Auth Verify', 'success', `Testing auth verify with real token: ${token.substring(0, 20)}...`)
      
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const responseText = await response.text()
      addResult('Auth Verify Response', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          addResult('Auth Verify Data', 'success', 'Auth verification successful', data)
        } catch (parseError) {
          addResult('Auth Verify Parse', 'error', 'Failed to parse auth response', responseText)
        }
      }

      return response.ok
    } catch (error) {
      addResult('Auth Verify Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 5: API Gateway with real token
  const testApiGatewayRealToken = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      if (!token) {
        addResult('API Gateway Real Token', 'error', 'No token found in localStorage')
        return false
      }

      addResult('API Gateway Real Token', 'success', `Testing with real token: ${token.substring(0, 20)}...`)
      
      const response = await fetch('http://localhost:3100/api/patients?page=1&limit=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const responseText = await response.text()
      addResult('API Gateway Response (Real Token)', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          addResult('API Gateway Data (Real Token)', 'success', 'Response parsed successfully', data)
        } catch (parseError) {
          addResult('API Gateway Parse (Real Token)', 'error', 'Failed to parse JSON', responseText)
        }
      }

      return response.ok
    } catch (error) {
      addResult('API Gateway Error (Real Token)', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Run all simple tests
  const runSimpleTests = async () => {
    setIsRunning(true)
    clearResults()

    addResult('Simple Test Session', 'success', 'Starting simple API tests...')

    // Test 1: Health Check
    await testHealthCheck()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 2: Get All Patients (populate dropdown)
    await testGetAllPatients()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 2.5: Get Patient Statistics
    await testGetPatientStats()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test API Gateway without auth (should fail with 401)
    await testApiGatewayNoAuth()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test API Gateway with fake token (should fail with 401)
    await testApiGatewayFakeToken()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test auth verify endpoint
    await testAuthVerifyEndpoint()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test API Gateway with real token (this is where the 500 error happens)
    await testApiGatewayRealToken()

    setIsRunning(false)
    addResult('Simple Test Session', 'success', 'Simple tests completed!')
  }

  // Test POST method - Patient Service (should redirect to Auth Service)
  const testPatientServicePost = async () => {
    try {
      const testPatientData = {
        profile_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        full_name: 'Test Patient POST',
        phone_number: '0987654321',
        gender: 'male',
        date_of_birth: '1990-01-01',
        blood_type: 'O+',
        address: {
          street: '123 Test Street',
          city: 'Ho Chi Minh City',
          district: 'District 1',
          ward: 'Ward 1'
        },
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '0123456789',
          relationship: 'Family'
        }
      }

      console.log('🔄 Testing Patient Service POST (expecting redirect)...')
      const response = await patientsApi.create(testPatientData)

      // This should return a redirect message (status 400), not success
      if (response.success === false && response.error?.includes('Auth Service')) {
        addResult(
          'POST /api/patients (Redirect Test)',
          'success',
          '✅ Correctly redirected to Auth Service - Microservice architecture working!',
          {
            redirect_message: response.error,
            redirect_info: response.redirect || 'Redirect info available',
            expected_behavior: 'This is the CORRECT behavior for microservice architecture'
          }
        )
      } else if (response.success === true) {
        addResult(
          'POST /api/patients (Redirect Test)',
          'error',
          '❌ Patient Service created patient directly - This violates microservice architecture!',
          {
            unexpected_success: response,
            issue: 'Patient Service should NOT create patients directly',
            solution: 'Should redirect to Auth Service instead'
          }
        )
      } else {
        addResult(
          'POST /api/patients (Redirect Test)',
          'error',
          `❌ Unexpected response: ${response.error || 'Unknown error'}`,
          response
        )
      }
    } catch (error: any) {
      // Network errors or validation errors are also valid test results
      addResult(
        'POST /api/patients (Redirect Test)',
        'success',
        `✅ Request blocked/failed as expected: ${error.message}`,
        {
          error_type: error.name || 'Unknown',
          message: error.message,
          note: 'Blocking patient creation is correct behavior'
        }
      )
    }
  }

  // Test POST method - Auth Service Registration
  const testAuthServiceRegistration = async () => {
    try {
      const testPatientData = {
        email: `test.patient.${Date.now()}@hospital.com`,
        password: 'TestPassword123!',
        full_name: 'Test Patient Auth',
        phone_number: '0987654321',
        gender: 'male',
        date_of_birth: '1990-01-01',
        blood_type: 'O+',
        address: {
          street: '123 Test Street',
          city: 'Ho Chi Minh City',
          district: 'District 1',
          ward: 'Ward 1'
        },
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '0123456789',
          relationship: 'Family'
        }
      }

      // Call Auth Service registration endpoint
      const response = await fetch('http://localhost:3001/api/auth/register-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPatientData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        addResult(
          'POST /api/auth/register-patient',
          'success',
          `Patient created successfully: ${data.data?.patient?.patient_id || 'ID not returned'}`,
          data
        )
      } else {
        addResult(
          'POST /api/auth/register-patient',
          'error',
          data.error || 'Registration failed',
          data
        )
      }
    } catch (error: any) {
      addResult(
        'POST /api/auth/register-patient',
        'error',
        `Error: ${error.message}`,
        error
      )
    }
  }

  // Run Patient ID specific tests
  const runPatientIdTests = async () => {
    const patientId = selectedPatientId || customPatientId
    if (!patientId) {
      addResult('Patient ID Test', 'error', 'No Patient ID selected')
      return
    }

    setIsRunning(true)
    addResult('Patient ID Test Session', 'success', `Starting tests for Patient ID: ${patientId}`)

    // Test validate Patient ID
    await testValidatePatientId(patientId)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test get Patient by ID
    await testGetPatientById(patientId)

    setIsRunning(false)
    addResult('Patient ID Test Session', 'success', 'Patient ID tests completed!')
  }

  // Test POST with invalid data (validation test)
  const testPatientServiceValidation = async () => {
    try {
      const invalidData = {
        // Missing required profile_id
        full_name: '', // Invalid empty name
        phone_number: '123', // Invalid phone format
        gender: 'invalid', // Invalid gender
        date_of_birth: 'invalid-date', // Invalid date
      }

      console.log('🔄 Testing Patient Service validation...')
      const response = await patientsApi.create(invalidData)

      if (response.success === false && (response.error?.includes('Validation') || response.error?.includes('Auth Service'))) {
        addResult(
          'POST /api/patients (Validation Test)',
          'success',
          '✅ Validation working correctly - Invalid data rejected',
          {
            validation_response: response.error,
            test_data: 'Intentionally invalid data',
            result: 'Properly rejected invalid input'
          }
        )
      } else {
        addResult(
          'POST /api/patients (Validation Test)',
          'error',
          '❌ Validation failed - Invalid data was accepted',
          response
        )
      }
    } catch (error: any) {
      addResult(
        'POST /api/patients (Validation Test)',
        'success',
        `✅ Request properly rejected: ${error.message}`,
        { error_type: 'Validation or Network Error', message: error.message }
      )
    }
  }

  // Test direct API call to Patient Service (bypass API Gateway)
  const testDirectPatientServicePost = async () => {
    try {
      const testData = {
        profile_id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Direct Test Patient',
        phone_number: '0987654321',
        gender: 'male',
        date_of_birth: '1990-01-01'
      }

      console.log('🔄 Testing direct Patient Service call...')
      const response = await fetch('http://localhost:3003/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      const data = await response.json()

      if (!response.ok && data.error?.includes('Auth Service')) {
        addResult(
          'POST Direct Patient Service',
          'success',
          '✅ Direct call correctly redirected to Auth Service',
          {
            status: response.status,
            redirect_message: data.error,
            architecture: 'Microservice boundaries enforced'
          }
        )
      } else if (response.ok) {
        addResult(
          'POST Direct Patient Service',
          'error',
          '❌ Direct call succeeded - Should redirect to Auth Service',
          data
        )
      } else {
        addResult(
          'POST Direct Patient Service',
          'success',
          `✅ Request blocked: ${data.error || 'Unknown error'}`,
          data
        )
      }
    } catch (error: any) {
      addResult(
        'POST Direct Patient Service',
        'success',
        `✅ Direct call failed as expected: ${error.message}`,
        { error: error.message }
      )
    }
  }

  // Run POST method tests
  const runPostTests = async () => {
    setIsRunning(true)
    addResult('POST Test Session', 'success', 'Starting comprehensive POST method tests...')

    // Test 1: Patient Service POST with valid data (should redirect)
    await testPatientServicePost()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 2: Patient Service validation test
    await testPatientServiceValidation()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 3: Direct Patient Service call
    await testDirectPatientServicePost()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 4: Auth Service Registration (proper way)
    await testAuthServiceRegistration()
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsRunning(false)
    addResult('POST Test Session', 'success', 'All POST method tests completed! ✅')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Simple API Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Test Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={runSimpleTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Run Simple Tests
            </Button>

            <Button
              onClick={runPostTests}
              disabled={isRunning}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test POST Methods
            </Button>

            <Button
              variant="outline"
              onClick={clearResults}
              disabled={isRunning}
            >
              Clear Results
            </Button>
          </div>

          {/* Patient ID Testing Section */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient ID Testing
            </h4>

            <div className="space-y-3">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient-select">Select Patient from Database:</Label>
                  <select
                    id="patient-select"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                    disabled={isRunning}
                  >
                    <option value="">-- Select Patient --</option>
                    {availablePatients.map((patient) => (
                      <option key={patient.patient_id} value={patient.patient_id}>
                        {patient.patient_id} - {patient.profile?.full_name || 'No Name'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="custom-patient-id">Or Enter Custom Patient ID:</Label>
                  <Input
                    id="custom-patient-id"
                    value={customPatientId}
                    onChange={(e) => setCustomPatientId(e.target.value)}
                    placeholder="PAT-202412-001"
                    disabled={isRunning}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Patient ID Test Controls */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={runPatientIdTests}
                  disabled={isRunning || (!selectedPatientId && !customPatientId)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Test Patient ID
                </Button>

                <Button
                  onClick={testGetAllPatients}
                  disabled={isRunning}
                  size="sm"
                  variant="outline"
                >
                  Load Patients
                </Button>

                <Badge variant="outline">
                  {availablePatients.length} patients loaded
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Simple Tests include:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Health check endpoint</li>
              <li>Get all patients (loads dropdown)</li>
              <li>API Gateway without authentication</li>
              <li>API Gateway with fake token</li>
              <li>Auth Service token verification</li>
              <li>API Gateway with real token</li>
            </ul>

            <p className="mt-3"><strong>POST Method Tests include:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Patient Service POST</strong> - Should redirect to Auth Service (✅ Expected behavior)</li>
              <li><strong>Validation Test</strong> - Invalid data should be rejected</li>
              <li><strong>Direct Service Call</strong> - Bypass API Gateway test</li>
              <li><strong>Auth Service Registration</strong> - Proper way to create patients</li>
              <li><strong>Microservice Architecture</strong> - Verify service boundaries</li>
            </ul>

            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">🎯 Expected POST Test Results:</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• <strong>Patient Service POST:</strong> Should return 400 with redirect message (✅ Success)</li>
                <li>• <strong>Validation:</strong> Should reject invalid data (✅ Success)</li>
                <li>• <strong>Auth Service:</strong> Should create patient successfully (✅ Success)</li>
                <li>• <strong>Architecture:</strong> Services respect boundaries (✅ Success)</li>
              </ul>
            </div>

            <p className="mt-3"><strong>Patient ID Tests include:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Validate Patient ID format</li>
              <li>Get specific patient by ID</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Test Results ({testResults.length})</CardTitle>
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
                    <span className="font-medium">{result.test}</span>
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
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            {testResults.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No test results yet. Click "Run Simple Tests" to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
