'use client'

import { useState } from 'react'
import { useEmailValidation } from '@/hooks/useEmailValidation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react'

/**
 * Test component for email validation functionality
 * Tests the useEmailValidation hook and API endpoint
 */
export function EmailValidationTest() {
  const [email, setEmail] = useState('')
  const [testResults, setTestResults] = useState<string[]>([])

  const {
    isChecking,
    isAvailable,
    error,
    message,
    checkEmail,
    clearValidation
  } = useEmailValidation(500) // 500ms debounce for testing

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    
    if (newEmail) {
      checkEmail(newEmail)
      addTestResult(`Checking email: ${newEmail}`)
    } else {
      clearValidation()
      addTestResult('Cleared validation')
    }
  }

  const testValidEmails = async () => {
    const validEmails = [
      'test@example.com',
      'user123@gmail.com',
      'admin@hospital.com'
    ]

    addTestResult('Testing valid email formats...')
    
    for (const testEmail of validEmails) {
      setEmail(testEmail)
      checkEmail(testEmail)
      addTestResult(`Testing: ${testEmail}`)
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const testInvalidEmails = () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test.example.com'
    ]

    addTestResult('Testing invalid email formats...')
    
    invalidEmails.forEach(testEmail => {
      setEmail(testEmail)
      checkEmail(testEmail)
      addTestResult(`Testing invalid: ${testEmail}`)
    })
  }

  const clearResults = () => {
    setTestResults([])
    setEmail('')
    clearValidation()
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
    if (error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    if (isAvailable === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (isAvailable === false) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    return <Mail className="h-4 w-4 text-gray-400" />
  }

  const getStatusMessage = () => {
    if (isChecking) return 'Đang kiểm tra email...'
    if (error) return error
    if (message) return message
    return 'Nhập email để kiểm tra'
  }

  const getStatusColor = () => {
    if (isChecking) return 'border-blue-500'
    if (error) return 'border-red-500'
    if (isAvailable === true) return 'border-green-500'
    if (isAvailable === false) return 'border-red-500'
    return 'border-gray-300'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Validation Test
          </CardTitle>
          <CardDescription>
            Test the email validation hook and API endpoint functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email</Label>
            <div className="relative">
              <Input
                id="test-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter email to test"
                className={`pr-10 ${getStatusColor()}`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>
            
            {/* Status Message */}
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon()}
              <span className={`${
                error ? 'text-red-600' : 
                isAvailable === true ? 'text-green-600' : 
                isAvailable === false ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {getStatusMessage()}
              </span>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testValidEmails} variant="outline" size="sm">
              Test Valid Emails
            </Button>
            <Button onClick={testInvalidEmails} variant="outline" size="sm">
              Test Invalid Emails
            </Button>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </div>

          {/* Current State Display */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current State:</strong><br />
              • Checking: {isChecking ? 'Yes' : 'No'}<br />
              • Available: {isAvailable === null ? 'Unknown' : isAvailable ? 'Yes' : 'No'}<br />
              • Error: {error || 'None'}<br />
              • Message: {message || 'None'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Real-time log of email validation tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <pre className="text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Endpoint Info */}
      <Card>
        <CardHeader>
          <CardTitle>API Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Frontend API Route:</strong> /api/auth/check-email (Pages Router)</p>
            <p><strong>Backend Service:</strong> Direct Supabase Database Query</p>
            <p><strong>Method:</strong> POST</p>
            <p><strong>Debounce:</strong> 500ms</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
