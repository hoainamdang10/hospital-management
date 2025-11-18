/**
 * HTTP Provider Service - Infrastructure Layer
 * Calls Provider/Staff Service API to fetch provider data and schedules
 *
 * Simple, pragmatic approach for MVP scope:
 * - Direct HTTP call to provider-staff-service
 * - No event-driven complexity
 * - Easy to explain and maintain
 *
 * Future enhancement: Can replace with event-driven read model without changing use cases
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices
 */
import { ProviderSchedule } from '../../domain/value-objects/ProviderSchedule.vo';
export interface WorkScheduleDTO {
    workingDays: string[];
    workingHours: {
        start: string;
        end: string;
    };
    timeZone: string;
    isFlexible: boolean;
}
export interface StaffDTO {
    id: string;
    userId: string;
    staffType: string;
    personalInfo: {
        fullName: string;
        email: string;
        phoneNumber: string;
    };
    workSchedule: WorkScheduleDTO;
    employmentInfo: {
        status: string;
        isActive: boolean;
    };
}
export declare class HttpProviderService {
    private httpClient;
    constructor(providerServiceUrl: string);
    /**
     * Get provider's work schedule from Provider/Staff Service
     *
     * @param providerId - Staff ID (e.g., LABO-DOC-202502-007)
     * @returns ProviderSchedule or null if not found
     */
    getWorkSchedule(providerId: string): Promise<ProviderSchedule | null>;
    /**
     * Get provider details by ID
     */
    getProvider(providerId: string): Promise<StaffDTO | null>;
}
//# sourceMappingURL=HttpProviderService.d.ts.map