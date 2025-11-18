'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/auth.service';
import { patientsService } from '@/lib/api/patients.service';
import { toast } from 'sonner';
import type { AuthContextType, User, LoginRequest, RegisterRequest } from '@/lib/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

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
          setIsLoading(false);
          return;
        }

        // Fetch user from session cookie
        // Session cookie automatically sent with request
        try {
          const response = await authService.getCurrentUser();

          if (response.success && response.user) {
            let user = response.user;

            // Fetch patientId if user is a PATIENT (same logic as login)
            console.log('[AuthContext] Init - Check if need to fetch patientId', {
              role: user.role,
              roleUpperCase: user.role?.toUpperCase(),
              isPatient: user.role?.toUpperCase() === 'PATIENT'
            });

            if (user.role?.toUpperCase() === 'PATIENT') {
              try {
                console.log('[AuthContext] Init - Fetching patientId for PATIENT role...', {
                  userId: user.userId
                });
                const patientResponse = await patientsService.getByUserId(user.userId);

                console.log('[AuthContext] Init - Patient API response:', patientResponse);

                if (patientResponse.success && patientResponse.data?.patientId) {
                  user = {
                    ...user,
                    patientId: patientResponse.data.patientId,
                  };
                  console.log('[AuthContext] Init - PatientId fetched successfully', {
                    patientId: patientResponse.data.patientId
                  });
                } else {
                  console.warn('[AuthContext] Init - Patient record not found for user', {
                    response: patientResponse
                  });
                }
              } catch (error) {
                console.error('[AuthContext] Init - Failed to fetch patientId:', error);
                // Don't block init if patient fetch fails
              }
            } else {
              console.log('[AuthContext] Init - Skipping patientId fetch - not a PATIENT role');
            }

            setUser(user);

            console.log('[AuthContext] Init - User data loaded', {
              userId: user.userId,
              fullName: user.fullName,
              role: user.role,
              patientId: user.patientId
            });
          }
        } catch (error: any) {
          // 401 or network error - no active session
          console.log('[AuthContext] Init - No active session');
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
      console.log('[AuthContext] Login started', { email: credentials.email });
      setIsLoginLoading(true);
      try {
        // Step 1: Authenticate user (sets session cookie)
        const loginResponse = await authService.login(credentials);
        
        if (!loginResponse.success) {
          throw new Error('Login failed');
        }

        // Step 2: Fetch full user data from /auth/me (uses session cookie)
        console.log('[AuthContext] Login successful, fetching user data...');
        const userResponse = await authService.getCurrentUser();
        
        if (!userResponse.success || !userResponse.user) {
          throw new Error('Failed to fetch user data');
        }

        let user = userResponse.user;

        // Step 3: Fetch patientId if user is a PATIENT (case-insensitive)
        console.log('[AuthContext] Step 3 - Check if need to fetch patientId', {
          role: user.role,
          roleUpperCase: user.role?.toUpperCase(),
          isPatient: user.role?.toUpperCase() === 'PATIENT'
        });
        
        if (user.role?.toUpperCase() === 'PATIENT') {
          try {
            console.log('[AuthContext] Fetching patientId for PATIENT role...', {
              userId: user.userId
            });
            const patientResponse = await patientsService.getByUserId(user.userId);
            
            console.log('[AuthContext] Patient API response:', patientResponse);
            
            if (patientResponse.success && patientResponse.data?.patientId) {
              user = {
                ...user,
                patientId: patientResponse.data.patientId,
              };
              console.log('[AuthContext] PatientId fetched successfully', {
                patientId: patientResponse.data.patientId
              });
            } else {
              console.warn('[AuthContext] Patient record not found for user', {
                response: patientResponse
              });
            }
          } catch (error) {
            console.error('[AuthContext] Failed to fetch patientId:', error);
            // Don't block login if patient fetch fails
          }
        } else {
          console.log('[AuthContext] Skipping patientId fetch - not a PATIENT role');
        }

        setUser(user);

        console.log('[AuthContext] User data fetched', {
          userId: user.userId,
          fullName: user.fullName,
          role: user.role,
          patientId: user.patientId
        });

        toast.success('Đăng nhập thành công!', {
          description: `Chào mừng ${user.fullName}`,
        });

        // Redirect based on role
        const redirectPath = getRedirectPath(user.role);
        console.log('[AuthContext] Redirecting to dashboard...', {
          role: user.role,
          redirectPath
        });
        
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          router.push(redirectPath);
        }, 100);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        toast.error('Đăng nhập thất bại', {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsLoginLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsRegisterLoading(true);
      try {
        // Normalize role to uppercase for backend compatibility
        // Backend accepts: ADMIN, DOCTOR, NURSE, PATIENT, RECEPTIONIST
        const normalizedRole = data.role?.toUpperCase() || 'PATIENT';
        const registerData = {
          ...data,
          role: normalizedRole as any,
        };
        
        const response = await authService.register(registerData);
        
        console.log('Register response:', response);

        // Verify-First approach: User NOT created yet, only pending registration
        // Always redirect to verify-email if we have pendingRegistrationId or no tokens
        if (response.pendingRegistrationId || !response.accessToken) {
          toast.success('Đăng ký thành công!', {
            description: 'Vui lòng kiểm tra email để xác thực tài khoản',
            duration: 6000,
          });
          // Redirect to verify-email page with email in query
          router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }

        // Legacy path (if backend returns tokens immediately - shouldn't happen with verify-first)
        if (response.user) {
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));

          // Session cookie set by backend (legacy path)
          // Note: Session-based auth doesn't need local token storage
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Save to cookies
          document.cookie = `accessToken=${response.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
          if (response.refreshToken) {
            document.cookie = `refreshToken=${response.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}`;
          }

          toast.success('Đăng ký thành công!');
          router.push('/patient/dashboard');
        }
        
        // If we reach here without redirecting, something went wrong
        console.warn('Register completed but no redirect triggered. Response:', response);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        toast.error('Đăng ký thất bại', {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsRegisterLoading(false);
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
    setUser(null);
    
    // Session cookie is cleared by backend on logout
    // No localStorage to clear (session-based auth)
    
    toast.info('Đã đăng xuất');
    router.push('/auth/login');
  };

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    // User data will be re-fetched from /auth/me on next page load
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const response = await authService.verifyEmail({ token });
      toast.success('Xác thực email thành công!');
      router.push('/auth/login?verified=true');
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
    isLoading,
    isLoginLoading,
    isRegisterLoading,
    isAuthenticated: user !== null,
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
  // Normalize role to uppercase for comparison
  const normalizedRole = role.toUpperCase();
  
  switch (normalizedRole) {
    case 'PATIENT':
      return '/patient/dashboard';
    case 'DOCTOR':
      return '/doctor/dashboard';
    case 'NURSE':
      return '/nurse/dashboard';
    case 'ADMIN':
    case 'RECEPTIONIST':
      return '/admin/dashboard';
    case 'STAFF':
      return '/staff/dashboard';
    default:
      return '/';
  }
}
