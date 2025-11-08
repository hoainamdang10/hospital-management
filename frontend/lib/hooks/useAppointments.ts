import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { appointmentsService } from '@/lib/api/appointments.service';
import { toast } from 'sonner';
import type {
  ScheduleAppointmentRequest,
  ScheduleAppointmentResponse,
  AppointmentReadModel,
  ListAppointmentsResponse,
  ListAppointmentsParams,
  CancelAppointmentRequest,
  SuccessResponse,
} from '@/lib/types/appointments';
import type { AxiosError } from 'axios';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (params?: ListAppointmentsParams) => [...appointmentKeys.lists(), params] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch list of appointments
 */
export function useAppointments(
  params?: ListAppointmentsParams,
  options?: Omit<
    UseQueryOptions<ListAppointmentsResponse, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<ListAppointmentsResponse, AxiosError>({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentsService.list(params),
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch appointment by ID
 */
export function useAppointment(
  id: string,
  options?: Omit<UseQueryOptions<AppointmentReadModel, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AppointmentReadModel, AxiosError>({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentsService.getById(id),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to schedule a new appointment
 */
export function useScheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation<ScheduleAppointmentResponse, AxiosError, ScheduleAppointmentRequest>({
    mutationFn: (data) => appointmentsService.schedule(data),
    onSuccess: (data) => {
      toast.success('Đặt lịch thành công!', {
        description: `Mã lịch hẹn: ${data.appointmentId}`,
        duration: 5000,
      });
      // Invalidate and refetch appointments list
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
    onError: (error) => {
      const errorMessage =
        (error.response?.data as any)?.message || 'Đặt lịch thất bại. Vui lòng thử lại.';
      toast.error('Đặt lịch thất bại', {
        description: errorMessage,
        duration: 5000,
      });
    },
  });
}

/**
 * Hook to confirm an appointment
 */
export function useConfirmAppointment() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (id) => appointmentsService.confirm(id),
    onSuccess: (_, id) => {
      toast.success('Xác nhận lịch hẹn thành công!');
      // Invalidate specific appointment and list
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
    onError: (error) => {
      const errorMessage =
        (error.response?.data as any)?.message || 'Xác nhận thất bại. Vui lòng thử lại.';
      toast.error('Xác nhận thất bại', {
        description: errorMessage,
      });
    },
  });
}

/**
 * Hook to cancel an appointment
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse,
    AxiosError,
    { id: string; data: CancelAppointmentRequest }
  >({
    mutationFn: ({ id, data }) => appointmentsService.cancel(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Đã hủy lịch hẹn thành công');
      // Invalidate specific appointment and list
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
    onError: (error) => {
      const errorMessage =
        (error.response?.data as any)?.message || 'Hủy lịch thất bại. Vui lòng thử lại.';
      toast.error('Hủy lịch thất bại', {
        description: errorMessage,
      });
    },
  });
}

/**
 * Hook to reschedule an appointment
 */
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse,
    AxiosError,
    { id: string; data: { appointmentDate: string; appointmentTime: string; reason?: string } }
  >({
    mutationFn: ({ id, data }) => appointmentsService.reschedule(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Đổi lịch hẹn thành công!');
      // Invalidate specific appointment and list
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
    onError: (error) => {
      const errorMessage =
        (error.response?.data as any)?.message || 'Đổi lịch thất bại. Vui lòng thử lại.';
      toast.error('Đổi lịch thất bại', {
        description: errorMessage,
      });
    },
  });
}
