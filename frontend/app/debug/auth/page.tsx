"use client"

import { useAuth } from "@/lib/auth/auth-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuthDebugger } from "@/components/auth/AuthDebugger"
import { authServiceApi } from "@/lib/api/auth"
import { useState } from "react"

export default function AuthDebugPage() {
  const { user, loading, isAuthenticated, hasRole, signIn, signOut, clearAuthData, error } = useAuth()
  const { clearAuthAndReload, checkAuthState } = useAuthDebugger()
  const router = useRouter()
  const [testResult, setTestResult] = useState<any>(null)
  const [isTestingAPI, setIsTestingAPI] = useState(false)

  const handleTestAPI = async () => {
    setIsTestingAPI(true)
    setTestResult(null)

    try {
      const response = await authServiceApi.getCurrentUser()
      setTestResult({
        success: true,
        data: response
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsTestingAPI(false)
    }
  }

  const handleTestLogin = async () => {
    try {
      await signIn('doctor@hospital.com', 'Doctor123.')
    } catch (error) {
      console.error('Test login failed:', error)
    }
  }

  const authState = checkAuthState()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid gap-6">
          {/* Auth State */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Context State</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Loading:</strong> <span className={loading ? 'text-yellow-600' : 'text-green-600'}>{loading ? 'Yes' : 'No'}</span></p>
                    <p><strong>Authenticated:</strong> <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{isAuthenticated ? 'Yes' : 'No'}</span></p>
                    <p><strong>Has User:</strong> <span className={user ? 'text-green-600' : 'text-red-600'}>{user ? 'Yes' : 'No'}</span></p>
                    <p><strong>Error:</strong> <span className={error ? 'text-red-600' : 'text-green-600'}>{error || 'None'}</span></p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">LocalStorage State</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Auth Token:</strong> <span className={authState.hasAuthToken ? 'text-green-600' : 'text-red-600'}>{authState.hasAuthToken ? 'Present' : 'Missing'}</span></p>
                    <p><strong>Refresh Token:</strong> <span className={authState.hasRefreshToken ? 'text-green-600' : 'text-red-600'}>{authState.hasRefreshToken ? 'Present' : 'Missing'}</span></p>
                    <p><strong>User Data:</strong> <span className={authState.hasUserData ? 'text-green-600' : 'text-red-600'}>{authState.hasUserData ? 'Present' : 'Missing'}</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Full Name:</strong> {user.full_name}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Active:</strong> {user.is_active ? 'Yes' : 'No'}</p>
                  <p><strong>Phone:</strong> {user.phone_number}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Role Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Is Admin:</strong> {hasRole('admin') ? 'Yes' : 'No'}</p>
                <p><strong>Is Doctor:</strong> {hasRole('doctor') ? 'Yes' : 'No'}</p>
                <p><strong>Is Patient:</strong> {hasRole('patient') ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>

          {/* API Test */}
          <Card>
            <CardHeader>
              <CardTitle>API Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={handleTestAPI}
                  disabled={isTestingAPI}
                  variant="outline"
                >
                  {isTestingAPI ? 'Testing...' : 'Test getCurrentUser API'}
                </Button>

                {testResult && (
                  <div className={`p-3 rounded border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h4 className="font-medium mb-2">API Test Result:</h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Debug Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <Button onClick={handleTestLogin} variant="default">
                  Test Login (Doctor)
                </Button>
                <Button onClick={() => signOut()} variant="secondary">
                  Sign Out
                </Button>
                <Button onClick={clearAuthData} variant="outline">
                  Clear Auth Data
                </Button>
                <Button onClick={clearAuthAndReload} variant="destructive">
                  Clear & Reload
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tests */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => router.push('/doctors/dashboard')} variant="outline">
                    Go to Doctor Dashboard
                  </Button>
                  <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
                    Go to Admin Dashboard
                  </Button>
                  <Button onClick={() => router.push('/patient/dashboard')} variant="outline">
                    Go to Patient Dashboard
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => router.push('/doctors/profile')} variant="outline">
                    Doctor Profile
                  </Button>
                  <Button onClick={() => router.push('/doctors/schedule')} variant="outline">
                    Doctor Schedule
                  </Button>
                  <Button onClick={() => router.push('/doctors/appointments')} variant="outline">
                    Doctor Appointments
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw User Object */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Raw User Object</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Troubleshooting Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <strong>1. Token Issues:</strong> If you see "Invalid token" errors, click "Clear Auth Data" and try logging in again.
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <strong>2. Redirect Issues:</strong> If login succeeds but doesn't redirect, check the console for errors and try "Clear & Reload".
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <strong>3. API Errors:</strong> Use "Test getCurrentUser API" to check if the backend services are running properly.
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <strong>4. Persistent Issues:</strong> Clear browser cache and cookies, then try again.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
