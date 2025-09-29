"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { debugSessionState } from "@/lib/auth/session-persistence"
import { User, RefreshCw, Eye, EyeOff, Database } from "lucide-react"

interface SessionStatusProps {
  position?: "fixed" | "static"
  className?: string
}

export function SessionStatus({ position = "fixed", className = "" }: SessionStatusProps) {
  const { user, loading, isAuthenticated, refreshUser } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    if (isExpanded) {
      const info = debugSessionState()
      setDebugInfo(info)
    }
  }, [isExpanded, user])

  const handleRefresh = async () => {
    await refreshUser()
    if (isExpanded) {
      const info = debugSessionState()
      setDebugInfo(info)
    }
  }

  const positionClasses = position === "fixed" 
    ? "fixed top-4 right-4 z-50" 
    : ""

  if (loading) {
    return (
      <div className={`${positionClasses} ${className}`}>
        <Card className="w-64">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${positionClasses} ${className}`}>
      <Card className={`transition-all duration-200 ${isExpanded ? 'w-80' : 'w-64'}`}>
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Session</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Basic Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Auth:</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"} className="text-xs">
                {isAuthenticated ? "✓" : "✗"}
              </Badge>
            </div>

            {user && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Role:</span>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Email:</span>
                  <span className="text-xs text-gray-600 truncate max-w-32">
                    {user.email}
                  </span>
                </div>
              </>
            )}

            {/* Expanded Details */}
            {isExpanded && (
              <>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-3 w-3" />
                    <span className="text-xs font-medium">Storage</span>
                  </div>
                  
                  {debugInfo && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">User Data:</span>
                        <Badge variant={debugInfo.hasUserData ? "default" : "destructive"} className="text-xs">
                          {debugInfo.hasUserData ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Auth Token:</span>
                        <Badge variant={debugInfo.hasAuthToken ? "default" : "destructive"} className="text-xs">
                          {debugInfo.hasAuthToken ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Refresh Token:</span>
                        <Badge variant={debugInfo.hasRefreshToken ? "default" : "destructive"} className="text-xs">
                          {debugInfo.hasRefreshToken ? "✓" : "✗"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {user && (
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs font-medium mb-1">User Details:</div>
                    <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                      <div>ID: {user.id?.substring(0, 8)}...</div>
                      <div>Name: {user.full_name}</div>
                      <div>Active: {user.is_active ? "Yes" : "No"}</div>
                    </div>
                  </div>
                )}

                {!user && (
                  <div className="border-t pt-2 mt-2">
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <span className="text-red-800">No user data</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Actions */}
          {isExpanded && (
            <div className="border-t pt-2 mt-2">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/force-session'}
                  className="text-xs h-6"
                >
                  Force
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-xs h-6"
                >
                  Reload
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
