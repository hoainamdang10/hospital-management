"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Send, AlertTriangle } from 'lucide-react'
import { patientsApi } from '@/lib/api/patients'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  data?: any
  timestamp: string
}

export default function PatientPostTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (test: string, status: 'success' | 'error' | 'warning', message: string, data?: any) => {
    setTestResults(prev => [...prev, { 
      test, 
      status, 
      message, 
      data, 
      timestamp: new Date().toISOString() 
    }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Valid data POST (should redirect)
  const testValidPost = async () => {
    try {
      const validData = {
        profile_id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Test Patient Valid',
        phone_number: '0987654321',
        gender: 'male' as const,
        date_of_birth: '1990-01-01',
        blood_type: 'O+',
        address: {
          street: '123 Test Street',
          city: 'Ho Chi Minh City'
        }
      }

      const response = await patientsApi.create(validData)
      
      if (response.success === false && response.error?.includes('Auth Service')) {
        addResult(
          'Valid POST Request', 
          'success', 
          '✅ Correctly redirected to Auth Service',
          { redirect_info: response.redirect, message: response.error }
        )
      } else if (response.success === true) {
        addResult(
          'Valid POST Request', 
          'error', 
          '❌ Patient created directly - Violates microservice architecture',
          response
        )
      } else {
        addResult(
          'Valid POST Request', 
          'warning', 
          `⚠️ Unexpected response: ${response.error}`,
          response
        )
      }
    } catch (error: any) {
      addResult(
        'Valid POST Request', 
        'success', 
        `✅ Request blocked: ${error.message}`,
        { error: error.message }
      )
    }
  }

  // Test 2: Invalid data POST (validation test)
  const testInvalidPost = async () => {
    try {
      const invalidData = {
        // Missing profile_id
        full_name: '', // Empty name
        phone_number: '123', // Invalid phone
        gender: 'invalid' as any,
        date_of_birth: 'not-a-date'
      }

      const response = await patientsApi.create(invalidData)
      
      if (response.success === false) {
        addResult(
          'Invalid POST Request', 
          'success', 
          '✅ Invalid data properly rejected',
          { validation_error: response.error }
        )
      } else {
        addResult(
          'Invalid POST Request', 
          'error', 
          '❌ Invalid data was accepted',
          response
        )
      }
    } catch (error: any) {
      addResult(
        'Invalid POST Request', 
        'success', 
        `✅ Validation error: ${error.message}`,
        { error: error.message }
      )
    }
  }

  // Test 3: Direct service call
  const testDirectCall = async () => {
    try {
      const testData = {
        profile_id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Direct Call Test',
        phone_number: '0987654321',
        gender: 'female',
        date_of_birth: '1995-05-15'
      }

      const response = await fetch('http://localhost:3003/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      const data = await response.json()

      if (!response.ok && data.error?.includes('Auth Service')) {
        addResult(
          'Direct Service Call', 
          'success', 
          '✅ Direct call redirected correctly',
          { status: response.status, message: data.error }
        )
      } else if (response.ok) {
        addResult(
          'Direct Service Call', 
          'error', 
          '❌ Direct call succeeded - Should redirect',
          data
        )
      } else {
        addResult(
          'Direct Service Call', 
          'warning', 
          `⚠️ Unexpected response: ${data.error}`,
          data
        )
      }
    } catch (error: any) {
      addResult(
        'Direct Service Call', 
        'success', 
        `✅ Network error (expected): ${error.message}`,
        { error: error.message }
      )
    }
  }

  // Test 4: Auth Service registration (correct way)
  const testAuthServiceRegistration = async () => {
    try {
      const registrationData = {
        email: `test.patient.${Date.now()}@hospital.com`,
        password: 'TestPassword123!',
        full_name: 'Auth Service Test Patient',
        phone_number: '0987654321',
        gender: 'male',
        date_of_birth: '1990-01-01',
        blood_type: 'A+',
        address: {
          street: '456 Auth Street',
          city: 'Ho Chi Minh City'
        },
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '0123456789',
          relationship: 'Family'
        }
      }

      const response = await fetch('http://localhost:3001/api/auth/register-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        addResult(
          'Auth Service Registration', 
          'success', 
          `✅ Patient created successfully: ${data.data?.patient?.patient_id || 'ID not returned'}`,
          { patient_data: data.data }
        )
      } else {
        addResult(
          'Auth Service Registration', 
          'error', 
          `❌ Registration failed: ${data.error || 'Unknown error'}`,
          data
        )
      }
    } catch (error: any) {
      addResult(
        'Auth Service Registration', 
        'error', 
        `❌ Network error: ${error.message}`,
        { error: error.message }
      )
    }
  }

  // Run all POST tests
  const runAllPostTests = async () => {
    setIsRunning(true)
    clearResults()

    addResult('Test Session', 'success', '🚀 Starting comprehensive POST method tests...')

    await testValidPost()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testInvalidPost()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testDirectCall()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testAuthServiceRegistration()
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsRunning(false)
    addResult('Test Session', 'success', '✅ All POST tests completed!')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Patient POST Method Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Expected Behavior:</strong> Patient Service should redirect POST requests to Auth Service. 
              This tests the microservice architecture boundaries.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button 
              onClick={runAllPostTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Run All POST Tests
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={isRunning}
            >
              Clear Results
            </Button>

            <Badge variant="outline">
              {testResults.length} results
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Tests Included:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Valid data POST (should redirect)</li>
                <li>• Invalid data POST (validation)</li>
                <li>• Direct service call (bypass gateway)</li>
                <li>• Auth Service registration (correct way)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Expected Results:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• ✅ Redirect to Auth Service</li>
                <li>• ✅ Validation errors</li>
                <li>• ✅ Service boundaries enforced</li>
                <li>• ✅ Successful patient creation via Auth</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>POST Test Results ({testResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : result.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.test}</span>
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
                No test results yet. Click "Run All POST Tests" to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
