import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { departmentsService, Department } from '@/lib/api/departments.service';
import type { AxiosError } from 'axios';

export const departmentKeys = {
    all: ['departments'] as const,
    list: () => [...departmentKeys.all, 'list'] as const,
};

export function useDepartments(
    options?: Omit<UseQueryOptions<Department[], AxiosError>, 'queryKey' | 'queryFn'>
) {
    return useQuery<Department[], AxiosError>({
        queryKey: departmentKeys.list(),
        queryFn: () => departmentsService.getDepartments(),
        staleTime: 60000 * 60, // 1 hour
        ...options,
    });
}
