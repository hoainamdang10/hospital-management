"use client"

import React from 'react'
import { useAuth } from '@/lib/auth/auth-wrapper'

/**
 * Authentication Debugger Component
 * Provides utilities to debug and fix authentication issues
 */
export function AuthDebugger() {
  const { user, loading, error, clearAuthData } = useAuth()

  const handleClearAuth = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu xác thực? Bạn sẽ cần đăng nhập lại.')) {
      clearAuthData()
      window.location.reload()
    }
  }

  const handleCheckLocalStorage = () => {
    const authToken = localStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const userData = localStorage.getItem('user_data')
    
    console.log('🔍 [AuthDebugger] LocalStorage Data:', {
      authToken: authToken ? `${authToken.substring(0, 20)}...` : 'null',
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null',
      userData: userData ? JSON.parse(userData) : 'null'
    })
    
    alert('Kiểm tra console để xem dữ liệu authentication')
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Auth Debugger</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-medium">Status:</span>{' '}
          <span className={loading ? 'text-yellow-600' : user ? 'text-green-600' : 'text-red-600'}>
            {loading ? 'Loading...' : user ? 'Authenticated' : 'Not authenticated'}
          </span>
        </div>
        
        {user && (
          <div>
            <span className="font-medium">User:</span> {user.email} ({user.role})
          </div>
        )}
        
        {error && (
          <div>
            <span className="font-medium text-red-600">Error:</span> {error}
          </div>
        )}
      </div>
      
      <div className="mt-3 space-y-2">
        <button
          onClick={handleCheckLocalStorage}
          className="w-full text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Check LocalStorage
        </button>
        
        <button
          onClick={handleClearAuth}
          className="w-full text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Clear Auth Data
        </button>
      </div>
    </div>
  )
}

/**
 * Hook to manually clear authentication data
 */
export function useAuthDebugger() {
  const { clearAuthData } = useAuth()
  
  const clearAuthAndReload = () => {
    clearAuthData()
    window.location.reload()
  }
  
  const checkAuthState = () => {
    const authToken = localStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const userData = localStorage.getItem('user_data')
    
    return {
      hasAuthToken: !!authToken,
      hasRefreshToken: !!refreshToken,
      hasUserData: !!userData,
      authToken: authToken ? `${authToken.substring(0, 20)}...` : null,
      userData: userData ? JSON.parse(userData) : null
    }
  }
  
  return {
    clearAuthAndReload,
    checkAuthState,
    clearAuthData
  }
}
