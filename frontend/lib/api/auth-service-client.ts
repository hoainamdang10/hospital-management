/**
 * Auth Service Client - Integration via API Gateway
 * Updated to use API Gateway instead of direct service URLs
 */

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100';

export interface AuthServiceRegisterData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role: 'doctor' | 'patient' | 'admin';
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  // Doctor specific
  specialty?: string;
  license_number?: string;
  qualification?: string;
  department_id?: string;
  years_of_experience?: number;
  // Patient specific
  address?: {
    street?: string;
    district?: string;
    city?: string;
  };
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  blood_type?: string;
}

export interface AuthServiceLoginData {
  email: string;
  password: string;
}

export interface AuthServiceResponse<T = any> {
  success: boolean;
  data?: T;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
  token?: string;
  error?: string;
  message?: string;
  details?: any[];
}

class AuthServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_GATEWAY_URL;
  }

  /**
   * Check if Auth Service is available
   */
  async checkHealth(): Promise<{ available: boolean; status?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        const status = await response.json();
        return { available: true, status };
      }
      return { available: false };
    } catch (error) {
      console.error('Auth Service health check failed:', error);
      return { available: false };
    }
  }

  /**
   * Register new user via Auth Service
   */
  async register(userData: AuthServiceRegisterData): Promise<AuthServiceResponse> {
    try {
      console.log('🚀 [AuthServiceClient] Registering user:', userData.email);
      
      const response = await fetch(`${this.baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [AuthServiceClient] Registration failed:', result);
        return {
          success: false,
          error: result.error || 'Registration failed',
          details: result.details,
        };
      }

      console.log('✅ [AuthServiceClient] Registration successful');
      return {
        success: true,
        data: result,
        user: result.user,
      };

    } catch (error: any) {
      console.error('❌ [AuthServiceClient] Registration error:', error);
      return {
        success: false,
        error: error.message || 'Network error during registration',
      };
    }
  }

  /**
   * Login user via Auth Service
   */
  async login(credentials: AuthServiceLoginData): Promise<AuthServiceResponse> {
    try {
      console.log('🔐 [AuthServiceClient] Logging in user:', credentials.email);
      
      const response = await fetch(`${this.baseUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [AuthServiceClient] Login failed:', result);
        return {
          success: false,
          error: result.error || 'Login failed',
        };
      }

      console.log('✅ [AuthServiceClient] Login successful');
      return {
        success: true,
        data: result,
        user: result.user,
        token: result.access_token || result.session?.access_token, // Fix: đọc access_token
      };

    } catch (error: any) {
      console.error('❌ [AuthServiceClient] Login error:', error);
      return {
        success: false,
        error: error.message || 'Network error during login',
      };
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(token: string): Promise<AuthServiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to get user info',
        };
      }

      return {
        success: true,
        user: result.user,
      };

    } catch (error: any) {
      console.error('❌ [AuthServiceClient] Get user error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(token?: string): Promise<AuthServiceResponse> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/api/auth/signout`, {
        method: 'POST',
        headers,
      });

      const result = await response.json();

      return {
        success: response.ok,
        message: result.message || 'Logged out',
      };

    } catch (error: any) {
      console.error('❌ [AuthServiceClient] Logout error:', error);
      return {
        success: false,
        error: error.message || 'Network error during logout',
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthServiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      return {
        success: response.ok,
        message: result.message || 'Password reset email sent',
        error: response.ok ? undefined : result.error,
      };

    } catch (error: any) {
      console.error('❌ [AuthServiceClient] Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  /**
   * Check if email is available for registration
   */
  async checkEmailAvailability(email: string): Promise<AuthServiceResponse> {
    try {
      console.log('🔍 [AuthServiceClient] Checking email availability:', email);

      const response = await fetch(`${this.baseUrl}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      return {
        success: response.ok,
        data: {
          available: result.available,
          email: email,
        },
        message: result.message,
        error: response.ok ? undefined : result.error,
      };

    } catch (error: any) {
      console.error('❌ [AuthServiceClient] Email availability check error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }
}

// Export singleton instance
export const authServiceClient = new AuthServiceClient();

// Export helper functions
export const checkAuthServiceAvailability = () => authServiceClient.checkHealth();
export const registerWithAuthService = (userData: AuthServiceRegisterData) => authServiceClient.register(userData);
export const loginWithAuthService = (credentials: AuthServiceLoginData) => authServiceClient.login(credentials);
export const getCurrentUserFromAuthService = (token: string) => authServiceClient.getCurrentUser(token);
export const logoutFromAuthService = (token?: string) => authServiceClient.logout(token);
export const resetPasswordWithAuthService = (email: string) => authServiceClient.resetPassword(email);
export const checkEmailAvailabilityWithAuthService = (email: string) => authServiceClient.checkEmailAvailability(email);
