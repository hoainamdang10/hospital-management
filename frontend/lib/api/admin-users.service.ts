import apiClient from './axios';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  roleType: string;
  roles: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ListAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface ListAdminUsersResult {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

/**
 * Fetch admins from Identity Service
 */
export async function listAdminUsers(
  params: ListAdminUsersParams = {}
): Promise<ListAdminUsersResult> {
  const query: Record<string, any> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    roleType: 'ADMIN',
  };

  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    query.search = trimmedSearch;
  }

  if (params.status === 'active') {
    query.isActive = true;
  } else if (params.status === 'inactive') {
    query.isActive = false;
  }

  const response = await apiClient.get('/v1/users', { params: query });
  const payload = response.data || {};

  return {
    users: payload.users ?? [],
    pagination: payload.pagination ?? {
      page: query.page,
      limit: query.limit,
      total: payload.users?.length ?? 0,
      totalPages: 1,
    },
    message: payload.message,
  };
}
