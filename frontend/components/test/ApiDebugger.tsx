"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Bug } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-wrapper'

export default function ApiDebugger() {
  const { user, isAuthenticated } = useAuth()
  const [debugResults, setDebugResults] = useState<any[]>([])
  const [isDebugging, setIsDebugging] = useState(false)

  const addDebugResult = (step: string, status: 'success' | 'error', message: string, data?: any) => {
    setDebugResults(prev => [...prev, { step, status, message, data, timestamp: new Date().toISOString() }])
  }

  const clearResults = () => {
    setDebugResults([])
  }

  // Test 1: Check API Gateway connectivity
  const testApiGateway = async () => {
    try {
      const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100'
      const response = await fetch(`${apiGatewayUrl}/health`)
      if (response.ok) {
        const data = await response.json()
        addDebugResult('API Gateway Health', 'success', 'API Gateway is responding', data)
        return true
      } else {
        addDebugResult('API Gateway Health', 'error', `HTTP ${response.status}: ${response.statusText}`)
        return false
      }
    } catch (error) {
      addDebugResult('API Gateway Health', 'error', error instanceof Error ? error.message : 'Network error')
      return false
    }
  }

  // Test 2: Check authentication token
  const testAuthentication = async () => {
    try {
      // Check localStorage token
      const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      if (authToken) {
        addDebugResult('Auth Token (localStorage)', 'success', `Token found: ${authToken.substring(0, 20)}...`)
      } else {
        addDebugResult('Auth Token (localStorage)', 'error', 'No auth token found in localStorage')
      }

      // Note: Removed Supabase session check - using Auth Service exclusively
      addDebugResult('Auth Service Token', 'info', 'Using Auth Service exclusively (Supabase auth removed)')

      return authToken
    } catch (error) {
      addDebugResult('Authentication Check', 'error', error instanceof Error ? error.message : 'Auth error')
      return null
    }
  }

  // Test 3: Test direct API call
  const testDirectApiCall = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      const headers: any = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      addDebugResult('API Request', 'success', `Making request to: http://localhost:3100/api/patients`, {
        url: 'http://localhost:3100/api/patients?page=1&limit=5',
        headers: headers,
        method: 'GET'
      })

      const response = await fetch('http://localhost:3100/api/patients?page=1&limit=5', {
        method: 'GET',
        headers: headers
      })

      addDebugResult('API Response Status', response.ok ? 'success' : 'error', `HTTP ${response.status}: ${response.statusText}`)

      const responseText = await response.text()
      addDebugResult('Raw Response', 'success', 'Response received', responseText)

      try {
        const data = JSON.parse(responseText)
        addDebugResult('Parsed Response', 'success', 'JSON parsed successfully', data)
        return data
      } catch (parseError) {
        addDebugResult('JSON Parse', 'error', 'Failed to parse JSON response', responseText)
        return null
      }
    } catch (error) {
      addDebugResult('Direct API Call', 'error', error instanceof Error ? error.message : 'Request failed')
      return null
    }
  }

  // Test 4: Test Patient Service directly
  const testPatientService = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/patients/health')
      if (response.ok) {
        const data = await response.json()
        addDebugResult('Patient Service Health', 'success', 'Patient Service is responding', data)
        return true
      } else {
        addDebugResult('Patient Service Health', 'error', `HTTP ${response.status}: ${response.statusText}`)
        return false
      }
    } catch (error) {
      addDebugResult('Patient Service Health', 'error', error instanceof Error ? error.message : 'Service not responding')
      return false
    }
  }

  // Test 5: Test Auth Service
  const testAuthService = async () => {
    try {
      const response = await fetch('http://localhost:3001/health')
      if (response.ok) {
        const data = await response.json()
        addDebugResult('Auth Service Health', 'success', 'Auth Service is responding', data)
        return true
      } else {
        addDebugResult('Auth Service Health', 'error', `HTTP ${response.status}: ${response.statusText}`)
        return false
      }
    } catch (error) {
      addDebugResult('Auth Service Health', 'error', error instanceof Error ? error.message : 'Service not responding')
      return false
    }
  }

  // Test 6: Test Auth Service Token Verification
  const testAuthVerification = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

      if (!token) {
        addDebugResult('Auth Verification', 'error', 'No token available for verification')
        return false
      }

      addDebugResult('Auth Verification', 'success', `Testing token verification with Auth Service`, {
        tokenPreview: token.substring(0, 20) + '...',
        url: 'http://localhost:3001/api/auth/verify'
      })

      const response = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const responseText = await response.text()
      addDebugResult('Auth Verification Response', response.ok ? 'success' : 'error',
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          addDebugResult('Auth Verification Data', 'success', 'Token verification successful', data)
          return true
        } catch (parseError) {
          addDebugResult('Auth Verification Parse', 'error', 'Failed to parse auth response', responseText)
          return false
        }
      } else {
        addDebugResult('Auth Verification Failed', 'error', `Auth service rejected token: ${response.status}`)
        return false
      }
    } catch (error) {
      addDebugResult('Auth Verification Error', 'error', error instanceof Error ? error.message : 'Auth verification failed')
      return false
    }
  }

  // Test 7: Test Patient Service Direct Call
  const testPatientServiceDirect = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

      addDebugResult('Patient Service Direct', 'success', 'Testing direct call to Patient Service', {
        url: 'http://localhost:3003/api/patients',
        hasToken: !!token
      })

      const headers: any = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('http://localhost:3003/api/patients?page=1&limit=5', {
        method: 'GET',
        headers: headers
      })

      const responseText = await response.text()
      addDebugResult('Patient Service Direct Response', response.ok ? 'success' : 'error',
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      return response.ok
    } catch (error) {
      addDebugResult('Patient Service Direct Error', 'error', error instanceof Error ? error.message : 'Direct call failed')
      return false
    }
  }

  // Run all debug tests
  const runDebugTests = async () => {
    setIsDebugging(true)
    clearResults()

    addDebugResult('Debug Session', 'success', 'Starting comprehensive API debugging...')

    // Test services health
    await testApiGateway()
    await testAuthService()
    await testPatientService()

    // Test authentication
    await testAuthentication()

    // Test auth verification
    await testAuthVerification()

    // Test direct Patient Service call
    await testPatientServiceDirect()

    // Test API Gateway call
    await testDirectApiCall()

    setIsDebugging(false)
    addDebugResult('Debug Session', 'success', 'Debugging completed!')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            API Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={runDebugTests} 
              disabled={isDebugging}
              className="flex items-center gap-2"
            >
              {isDebugging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bug className="h-4 w-4" />
              )}
              Run Debug Tests
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={isDebugging}
            >
              Clear Results
            </Button>

            {user && (
              <Badge variant="outline">
                User: {user.role} | {user.full_name}
              </Badge>
            )}
          </div>

          {!isAuthenticated && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                You are not authenticated. Please login first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Debug Results */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Results ({debugResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {debugResults.map((result, index) => (
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
                    <span className="font-medium">{result.step}</span>
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
                      View Debug Data
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            {debugResults.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No debug results yet. Click "Run Debug Tests" to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
