import { apiClient } from "../api/client";

export interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "SUPERADMIN"
    | "ADMIN"
    | "DOCTOR"
    | "STAFF"
    | "PATIENT"
    | "RECEPTIONIST";
  status: "active" | "inactive" | "suspended";
  avatar?: string;
  phone?: string;
  department?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UserResponse {
  success: boolean;
  data?: User | User[];
  message?: string;
  error?: string;
}

export class UserServiceAPI {
  private static instance: UserServiceAPI;
  private baseUrl: string = "/identity-service/users";

  private constructor() {}

  public static getInstance(): UserServiceAPI {
    if (!UserServiceAPI.instance) {
      UserServiceAPI.instance = new UserServiceAPI();
    }
    return UserServiceAPI.instance;
  }

  async getAllUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<UserResponse> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append("role", params.role);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    const endpoint = query ? `${this.baseUrl}?${query}` : this.baseUrl;

    const response = await apiClient.get<User[]>(endpoint);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getCurrentUser(): Promise<UserResponse> {
    // Get current authenticated user profile
    const response = await apiClient.get<User>(`${this.baseUrl}/me`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getUserById(id: string): Promise<UserResponse> {
    const response = await apiClient.get<User>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createUser(
    user: Omit<User, "id" | "createdAt" | "lastLogin">
  ): Promise<UserResponse> {
    const response = await apiClient.post<User>(this.baseUrl, user);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateUser(id: string, user: Partial<User>): Promise<UserResponse> {
    // Fixed: Backend uses PATCH not PUT
    const response = await apiClient.patch<User>(`${this.baseUrl}/${id}`, user);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deleteUser(id: string): Promise<UserResponse> {
    const response = await apiClient.delete<User>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async updateUserStatus(
    id: string,
    status: "active" | "inactive" | "suspended"
  ): Promise<UserResponse> {
    const response = await apiClient.patch<User>(
      `${this.baseUrl}/${id}/status`,
      { status }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Change Password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<UserResponse> {
    const response = await apiClient.post<User>(
      `${this.baseUrl}/${userId}/change-password`,
      {
        currentPassword,
        newPassword,
      }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Lock/Unlock User
  async lockUser(userId: string, reason?: string): Promise<UserResponse> {
    const response = await apiClient.post<User>(
      `${this.baseUrl}/${userId}/lock`,
      { reason }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async unlockUser(userId: string): Promise<UserResponse> {
    const response = await apiClient.post<User>(
      `${this.baseUrl}/${userId}/unlock`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Assign Role
  async assignRole(userId: string, roleType: string): Promise<UserResponse> {
    const response = await apiClient.post<User>(
      `${this.baseUrl}/${userId}/assign-role`,
      { roleType }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Session Management
  async getUserSessions(userId: string): Promise<{
    success: boolean;
    data?: Array<{
      sessionId: string;
      ipAddress: string;
      userAgent: string;
      createdAt: string;
      lastActivity: string;
      isCurrent: boolean;
    }>;
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.get<
      Array<{
        sessionId: string;
        ipAddress: string;
        userAgent: string;
        createdAt: string;
        lastActivity: string;
        isCurrent: boolean;
      }>
    >(`${this.baseUrl}/${userId}/sessions`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deleteSession(
    userId: string,
    sessionId: string
  ): Promise<UserResponse> {
    const response = await apiClient.delete(
      `${this.baseUrl}/${userId}/sessions/${sessionId}`
    );
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async logoutAllSessions(userId: string): Promise<UserResponse> {
    const response = await apiClient.delete(
      `${this.baseUrl}/${userId}/sessions`
    );
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }
}

export const userServiceAPI = UserServiceAPI.getInstance();
