'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  User, 
  Clock, 
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  user?: any;
}

interface AuthenticationStatusProps {
  authState: AuthState;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  isLoading?: boolean;
}

export function AuthenticationStatus({ 
  authState, 
  onLogin, 
  onLogout, 
  isLoading = false 
}: AuthenticationStatusProps) {
  const getTokenInfo = () => {
    if (!authState.token) return null;
    
    try {
      // Decode JWT token (basic decode, not verification)
      const payload = JSON.parse(atob(authState.token.split('.')[1]));
      return {
        exp: payload.exp ? new Date(payload.exp * 1000) : null,
        iat: payload.iat ? new Date(payload.iat * 1000) : null,
        role: payload.role || 'unknown'
      };
    } catch (error) {
      return null;
    }
  };

  const tokenInfo = getTokenInfo();
  const isTokenExpired = tokenInfo?.exp ? tokenInfo.exp < new Date() : false;

  return (
    <Card className={`${authState.isAuthenticated ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className={`h-5 w-5 ${authState.isAuthenticated ? 'text-green-600' : 'text-gray-400'}`} />
          Authentication Status
          {authState.isAuthenticated && (
            <Badge className="bg-green-100 text-green-800 ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Authenticated
            </Badge>
          )}
          {!authState.isAuthenticated && (
            <Badge variant="outline" className="ml-auto">
              <XCircle className="h-3 w-3 mr-1" />
              Not Authenticated
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {authState.isAuthenticated && authState.user ? (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <User className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">{authState.user.full_name || authState.user.email}</p>
                <p className="text-sm text-gray-600">{authState.user.email}</p>
              </div>
              <Badge variant="outline">
                {authState.user.role?.toUpperCase() || 'USER'}
              </Badge>
            </div>

            {/* Token Info */}
            {tokenInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Key className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Token Information:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <div>
                      <p className="font-medium">Issued</p>
                      <p className="text-gray-600">
                        {tokenInfo.iat ? tokenInfo.iat.toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${
                    isTokenExpired ? 'bg-red-50 border-red-200' : 'bg-white'
                  }`}>
                    {isTokenExpired ? (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">Expires</p>
                      <p className={isTokenExpired ? 'text-red-600' : 'text-gray-600'}>
                        {tokenInfo.exp ? tokenInfo.exp.toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {isTokenExpired && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    ⚠️ Token has expired. Please login again.
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                disabled={isLoading}
              >
                Logout
              </Button>
              {isTokenExpired && (
                <Button
                  size="sm"
                  onClick={onLogin}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Re-authenticate
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-4">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">
                Not authenticated. Login to test protected endpoints.
              </p>
              <Button
                onClick={onLogin}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Login Test User
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">Test Credentials:</p>
              <p>Email: admin@hospital.com</p>
              <p>Password: Admin123</p>
              <p>Role: Admin (full access)</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AuthenticationStatus;
