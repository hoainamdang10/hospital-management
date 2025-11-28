import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { doctorsService, Doctor } from '@/lib/api/doctors.service';
import type { AxiosError } from 'axios';

export const doctorKeys = {
    all: ['doctors'] as const,
    featured: () => [...doctorKeys.all, 'featured'] as const,
};

export function useFeaturedDoctors(
    options?: Omit<UseQueryOptions<Doctor[], AxiosError>, 'queryKey' | 'queryFn'>
) {
    return useQuery<Doctor[], AxiosError>({
        queryKey: doctorKeys.featured(),
        queryFn: () => doctorsService.getFeaturedDoctors(),
        staleTime: 60000 * 5, // 5 minutes
        ...options,
    });
}
