"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, User, Database, Clock, Eye, EyeOff } from "lucide-react"

export function SessionDebug() {
  const { user, loading, isAuthenticated, refreshUser } = useAuth()
  const [showDetails, setShowDetails] = useState(false)
  const [storageData, setStorageData] = useState<any>(null)
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  useEffect(() => {
    checkStorageData()
  }, [user])

  const checkStorageData = () => {
    const authToken = localStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const userData = localStorage.getItem('user_data')
    
    let parsedUserData = null
    try {
      parsedUserData = userData ? JSON.parse(userData) : null
    } catch (e) {
      console.error('Error parsing user data:', e)
    }

    setStorageData({
      authToken: authToken ? `${authToken.substring(0, 20)}...` : null,
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
      userData: parsedUserData,
      hasAuthToken: !!authToken,
      hasRefreshToken: !!refreshToken,
      hasUserData: !!userData,
      authTokenLength: authToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0
    })
    setLastCheck(new Date())
  }

  const handleRefresh = async () => {
    await refreshUser()
    checkStorageData()
  }

  const handleClearStorage = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    checkStorageData()
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading auth state...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Session Debug
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Authentication Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Authenticated:</span>
          <Badge variant={isAuthenticated ? "default" : "destructive"} className="text-xs">
            {isAuthenticated ? "Yes" : "No"}
          </Badge>
        </div>

        {/* User Info */}
        {user && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Role:</span>
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Email:</span>
              <span className="text-xs text-gray-600 truncate max-w-32">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Name:</span>
              <span className="text-xs text-gray-600 truncate max-w-32">
                {user.full_name}
              </span>
            </div>
          </>
        )}

        {/* Storage Status */}
        {storageData && (
          <>
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-3 w-3" />
                <span className="text-xs font-medium">Storage Status</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Auth Token:</span>
                  <Badge variant={storageData.hasAuthToken ? "default" : "destructive"} className="text-xs">
                    {storageData.hasAuthToken ? "✓" : "✗"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">Refresh Token:</span>
                  <Badge variant={storageData.hasRefreshToken ? "default" : "destructive"} className="text-xs">
                    {storageData.hasRefreshToken ? "✓" : "✗"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">User Data:</span>
                  <Badge variant={storageData.hasUserData ? "default" : "destructive"} className="text-xs">
                    {storageData.hasUserData ? "✓" : "✗"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Detailed Info */}
            {showDetails && storageData.userData && (
              <div className="border-t pt-3">
                <div className="text-xs font-medium mb-2">Stored User Data:</div>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div>Role: {storageData.userData.role}</div>
                  <div>Email: {storageData.userData.email}</div>
                  <div>ID: {storageData.userData.id?.substring(0, 8)}...</div>
                  {storageData.userData.sessionTimestamp && (
                    <div>Stored: {new Date(storageData.userData.sessionTimestamp).toLocaleTimeString()}</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleRefresh} size="sm" className="flex-1 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button onClick={checkStorageData} variant="outline" size="sm" className="flex-1 text-xs">
              <Database className="h-3 w-3 mr-1" />
              Check
            </Button>
          </div>
          
          <Button onClick={handleClearStorage} variant="destructive" size="sm" className="w-full text-xs">
            Clear Storage
          </Button>
          
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            Last check: {lastCheck.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
