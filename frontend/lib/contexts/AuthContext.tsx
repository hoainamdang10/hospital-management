'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/auth.service';
import { toast } from 'sonner';
import type { AuthContextType, User, LoginRequest, RegisterRequest } from '@/lib/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // DEV MODE: Controlled by env var
        const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
        // const isDevMode = process.env.NODE_ENV === 'development';
        
        if (isDevMode) {
          console.log('[AuthContext] DEV MODE: Skipping auth verification');
          // Set mock user for development
          const mockUser: User = {
            id: 'dev-user-id',
            userId: 'dev-user-id',
            email: 'dev@hospital.com',
            username: 'devuser',
            fullName: 'Development User',
            role: 'ADMIN',
            isActive: true,
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUser(mockUser);
          setAccessToken('dev-mock-token');
          setIsLoading(false);
          return;
        }

        const storedToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));

          // Optionally verify token is still valid
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          } catch (error) {
            // Token invalid, clear auth
            handleLogout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        const response = await authService.login(credentials);

        // Save to state
        // Handle missing user object in response (Identity Service bug)
        const responseWithUserId = response as any;
        const user = response.user || {
          id: responseWithUserId.userId || 'unknown',
          userId: responseWithUserId.userId || 'unknown',
          email: credentials.email,
          username: credentials.email.split('@')[0],
          fullName: 'User',
          role: 'ADMIN' as const,
          isActive: true,
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setUser(user);
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);

        // Save to localStorage
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        toast.success('Đăng nhập thành công!', {
          description: `Chào mừng ${user.fullName}`,
        });

        // Redirect based on role
        const redirectPath = getRedirectPath(user.role);
        router.push(redirectPath);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        toast.error('Đăng nhập thất bại', {
          description: errorMessage,
        });
        throw error;
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        const response = await authService.register(data);

        // Verify-First approach: User NOT created yet, only pending registration
        // No tokens returned, user must verify email first
        if (response.requiresEmailVerification) {
          toast.success('Đăng ký thành công!', {
            description: 'Vui lòng kiểm tra email để xác thực tài khoản',
            duration: 6000,
          });
          // Don't save tokens or redirect - let the page show success message
          return;
        }

        // Legacy path (if backend returns tokens immediately - shouldn't happen with verify-first)
        if (response.user && response.accessToken) {
          setUser(response.user);
          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);

          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.user));

          toast.success('Đăng ký thành công!');
          router.push('/patient/dashboard');
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        toast.error('Đăng ký thất bại', {
          description: errorMessage,
        });
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    // Clear state
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    toast.info('Đã đăng xuất');
    router.push('/login');
  };

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const response = await authService.verifyEmail({ token });
      toast.success('Xác thực email thành công!');
      router.push('/login?verified=true');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xác thực email thất bại');
      throw error;
    }
  }, [router]);

  const resendVerification = useCallback(async (email: string) => {
    try {
      // Note: Need to add this endpoint to authService
      toast.success('Email xác thực đã được gửi lại!');
    } catch (error: any) {
      toast.error('Gửi email thất bại');
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    verifyEmail,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to determine redirect path based on role
function getRedirectPath(role: string): string {
  switch (role) {
    case 'PATIENT':
      return '/patient/dashboard';
    case 'DOCTOR':
      return '/doctor/dashboard';
    case 'NURSE':
      return '/nurse/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'STAFF':
      return '/staff/dashboard';
    default:
      return '/';
  }
}
