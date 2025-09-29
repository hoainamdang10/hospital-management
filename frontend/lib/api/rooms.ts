import { apiClient } from './client';
import { Room, RoomForm, ApiResponse, FilterOptions } from '../types';

// Rooms API endpoints
export const roomsApi = {
  // Get all rooms
  getAll: async (filters?: FilterOptions): Promise<ApiResponse<Room[]>> => {
    return apiClient.get<Room[]>('/rooms', filters);
  },

  // Get room by ID
  getById: async (id: string): Promise<ApiResponse<Room>> => {
    return apiClient.get<Room>(`/rooms/${id}`);
  },

  // Create new room
  create: async (roomData: RoomForm): Promise<ApiResponse<Room>> => {
    return apiClient.post<Room>('/rooms', roomData);
  },

  // Update room
  update: async (id: string, roomData: Partial<RoomForm>): Promise<ApiResponse<Room>> => {
    return apiClient.put<Room>(`/rooms/${id}`, roomData);
  },

  // Delete room
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/rooms/${id}`);
  },
};
