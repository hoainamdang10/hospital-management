"use client";

import { supabaseClient } from "../supabase-client";

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// API Client class
export class ApiClient {
  private baseUrl: string;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
      "http://localhost:3100"
  ) {
    this.baseUrl = baseUrl;
    console.log("🔧 [ApiClient] Initialized with baseUrl:", this.baseUrl);
    console.log(
      "🔧 [ApiClient] NEXT_PUBLIC_API_GATEWAY_URL:",
      process.env.NEXT_PUBLIC_API_GATEWAY_URL
    );
  }

  // Get auth token from localStorage (Auth Service) or Supabase
  private async getAuthToken(): Promise<string | null> {
    // First try to get Auth Service token
    const authServiceToken =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    if (authServiceToken) {
      return authServiceToken;
    }

    // Fallback to Supabase token
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  }

  // Make HTTP request with timeout
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true,
    timeoutMs: number = 30000 // 30 seconds default timeout
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Accept-Language": this.getLanguagePreference(),
        ...options.headers,
      };

      // Only add auth token if required
      if (requireAuth) {
        const token = await this.getAuthToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Properly encode the URL to handle special characters in IDs
        const fullUrl = `${this.baseUrl}/api${endpoint}`;
        console.log("🌐 [ApiClient] Making request to:", fullUrl);

        const response = await fetch(fullUrl, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw error;
      }
    } catch (error) {
      console.error("API Request Error:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  // Handle response parsing
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (response.ok) {
        // Handle different response formats
        if (data.success !== undefined) {
          // Backend service response format
          return {
            success: data.success,
            data: data.data || data,
            meta: data.pagination || data.meta,
          };
        } else {
          // Direct data response
          return {
            success: true,
            data: data.data || data,
          };
        }
      } else {
        return {
          success: false,
          error: {
            message: data.error || data.message || "Request failed",
            code: data.code,
          },
        };
      }
    } catch (error) {
      console.error("Response parsing error:", error);
      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Response parsing error",
        },
      };
    }
  }

  // HTTP methods
  async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    let finalEndpoint = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, String(params[key]));
        }
      });

      if (searchParams.toString()) {
        finalEndpoint += `?${searchParams.toString()}`;
      }
    }

    return this.makeRequest<T>(finalEndpoint, {
      method: "GET",
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    requireAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
      requireAuth
    );
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "DELETE",
    });
  }

  // File upload method with timeout
  async uploadFile<T>(
    endpoint: string,
    file: File,
    timeoutMs: number = 60000
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();

      const formData = new FormData();
      formData.append("file", file);

      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.data || data,
        };
      } else {
        return {
          success: false,
          error: {
            message: data.error || data.message || "Upload failed",
            code: data.code,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Upload error",
        },
      };
    }
  }

  // Get language preference for Vietnamese/English support
  private getLanguagePreference(): string {
    if (typeof window !== "undefined") {
      return localStorage.getItem("language") || navigator.language || "vi-VN";
    }
    return "vi-VN";
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Helper functions
export const handleApiError = (response: ApiResponse<any>): string => {
  return response.error?.message || "An error occurred";
};

export const isApiSuccess = <T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { data: T } => {
  return response.success && response.data !== undefined;
};

export const getApiError = (response: ApiResponse<any>): string | null => {
  return response.error?.message || null;
};
