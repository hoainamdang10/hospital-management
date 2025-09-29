"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, UserCheck } from 'lucide-react'

export default function SimpleDoctorApiTest() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (test: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toISOString() }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Direct Doctor Service (bypass API Gateway)
  const testDoctorServiceDirect = async () => {
    try {
      addResult('Direct Doctor Service', 'success', 'Testing http://localhost:3002/api/doctors')
      
      const response = await fetch('http://localhost:3002/api/doctors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Doctor Service Response', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          addResult('Doctor Service Data', 'success', 'Response parsed successfully', data)
        } catch (parseError) {
          addResult('Doctor Service Parse', 'error', 'Failed to parse JSON', responseText)
        }
      }

      return response.ok
    } catch (error) {
      addResult('Doctor Service Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 2: API Gateway without auth
  const testApiGatewayNoAuth = async () => {
    try {
      addResult('API Gateway No Auth', 'success', 'Testing http://localhost:3100/api/doctors (no auth)')
      
      const response = await fetch('http://localhost:3100/api/doctors', {
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

  // Test 3: API Gateway with real token
  const testApiGatewayRealToken = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      if (!token) {
        addResult('API Gateway Real Token', 'error', 'No token found in localStorage')
        return false
      }

      addResult('API Gateway Real Token', 'success', `Testing with real token: ${token.substring(0, 20)}...`)
      
      const response = await fetch('http://localhost:3100/api/doctors?page=1&limit=5', {
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

  // Test 4: Doctor Service Health Check
  const testDoctorServiceHealth = async () => {
    try {
      addResult('Doctor Service Health', 'success', 'Testing http://localhost:3002/health')
      
      const response = await fetch('http://localhost:3002/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Doctor Service Health Response', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      return response.ok
    } catch (error) {
      addResult('Doctor Service Health Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 5: Doctor Service Statistics
  const testDoctorServiceStats = async () => {
    try {
      addResult('Doctor Service Stats', 'success', 'Testing http://localhost:3002/api/doctors/stats')
      
      const response = await fetch('http://localhost:3002/api/doctors/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Doctor Service Stats Response', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          addResult('Doctor Service Stats Data', 'success', 'Stats retrieved successfully', data)
        } catch (parseError) {
          addResult('Doctor Service Stats Parse', 'error', 'Failed to parse stats JSON', responseText)
        }
      }

      return response.ok
    } catch (error) {
      addResult('Doctor Service Stats Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Run all simple tests
  const runSimpleTests = async () => {
    setIsRunning(true)
    clearResults()

    addResult('Simple Doctor Test Session', 'success', 'Starting simple Doctor API tests...')

    // Test Doctor Service health
    await testDoctorServiceHealth()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test direct Doctor Service (should work)
    await testDoctorServiceDirect()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test Doctor Service stats
    await testDoctorServiceStats()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test API Gateway without auth (should fail with 401)
    await testApiGatewayNoAuth()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test API Gateway with real token
    await testApiGatewayRealToken()

    setIsRunning(false)
    addResult('Simple Doctor Test Session', 'success', 'Simple Doctor tests completed!')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Simple Doctor API Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={runSimpleTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              Run Simple Doctor Tests
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={isRunning}
            >
              Clear Results
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>This will test:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Doctor Service health check (port 3002)</li>
              <li>Direct Doctor Service call (bypass API Gateway)</li>
              <li>Doctor Service statistics endpoint</li>
              <li>API Gateway without authentication</li>
              <li>API Gateway with real token</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Doctor Test Results ({testResults.length})</CardTitle>
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
                No test results yet. Click "Run Simple Doctor Tests" to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
