import apiClient from './axios';

export interface AccountActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function deactivateAccount(payload: {
  userId: string;
  reason: string;
  terminateSessions?: boolean;
}): Promise<AccountActionResponse> {
  const response = await apiClient.post<AccountActionResponse>('/admin/accounts/deactivate', {
    ...payload,
  });
  return response.data;
}

export async function reactivateAccount(payload: {
  userId: string;
  reason?: string;
}): Promise<AccountActionResponse> {
  const response = await apiClient.post<AccountActionResponse>(
    '/admin/accounts/reactivate',
    payload
  );
  return response.data;
}

export async function unlockAccount(payload: {
  userId: string;
  reason: string;
}): Promise<AccountActionResponse> {
  const response = await apiClient.post<AccountActionResponse>('/admin/accounts/unlock', payload);
  return response.data;
}

export async function deleteAccount(payload: {
  userId: string;
  reason: string;
  force?: boolean;
}): Promise<AccountActionResponse> {
  const response = await apiClient.delete<AccountActionResponse>(
    `/admin/accounts/${payload.userId}`,
    {
      data: {
        reason: payload.reason,
        force: payload.force ?? false,
      },
    }
  );
  return response.data;
}
