"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpProviderService = void 0;
const axios_1 = __importDefault(require("axios"));
const ProviderSchedule_vo_1 = require("../../domain/value-objects/ProviderSchedule.vo");
class HttpProviderService {
    constructor(providerServiceUrl, serviceToken) {
        this.serviceToken = serviceToken;
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        // Service-to-service auth header if configured
        if (serviceToken) {
            defaultHeaders.Authorization = `Bearer ${serviceToken}`;
        }
        this.httpClient = axios_1.default.create({
            baseURL: providerServiceUrl,
            timeout: 5000, // 5 second timeout
            headers: defaultHeaders,
        });
    }
    /**
     * Get provider's work schedule from Provider/Staff Service
     *
     * @param providerId - Staff ID (e.g., LABO-DOC-202502-007)
     * @returns ProviderSchedule or null if not found
     */
    async getWorkSchedule(providerId) {
        try {
            console.log('[HttpProviderService] Fetching work schedule', {
                providerId,
            });
            const response = await this.httpClient.get(`/api/v1/staff/${providerId}`);
            if (!response.data.success || !response.data.data) {
                console.warn('[HttpProviderService] Provider not found', {
                    providerId,
                });
                return null;
            }
            const staff = response.data.data;
            // Check if staff is active and is a doctor
            if (!staff.employmentInfo?.isActive || staff.employmentInfo?.status !== 'active') {
                console.warn('[HttpProviderService] Provider is not active', {
                    providerId,
                    status: staff.employmentInfo?.status,
                    isActive: staff.employmentInfo?.isActive,
                });
                return null;
            }
            // Map work schedule to ProviderSchedule domain object
            const schedule = staff.workSchedule;
            // If dailySchedules exist, we need to handle them differently
            // ProviderSchedule doesn't directly support dailySchedules, but we can:
            // 1. Use dailySchedules to create multiple WorkingHours entries
            // 2. Or convert to workingHours array format
            let workingHoursToUse;
            if (schedule.dailySchedules && schedule.dailySchedules.length > 0) {
                // Convert dailySchedules to array of working hours (one per day)
                // But ProviderSchedule expects unified workingHours, so merge them
                // For now, we'll use the first dailySchedule as default and log the rest
                console.log('[HttpProviderService] dailySchedules detected', {
                    providerId,
                    dailySchedules: schedule.dailySchedules,
                });
                // Create array of working hours from dailySchedules
                workingHoursToUse = schedule.dailySchedules.map(ds => ({
                    start: ds.start,
                    end: ds.end
                }));
                // Store dailySchedules for later use (we'll access it directly from staff DTO)
                schedule._dailySchedules = schedule.dailySchedules;
            }
            else {
                workingHoursToUse = {
                    start: schedule.workingHours.start,
                    end: schedule.workingHours.end,
                };
            }
            const providerSchedule = ProviderSchedule_vo_1.ProviderSchedule.create({
                providerId, // Use staffId from parameter (e.g., LABO-DOC-202502-007)
                workingDays: schedule.workingDays,
                workingHours: workingHoursToUse,
                timeZone: schedule.timeZone || 'Asia/Ho_Chi_Minh',
                isFlexible: schedule.isFlexible,
                effectiveDate: new Date(), // Current date
            });
            // Attach dailySchedules to the schedule object for use case access
            if (schedule.dailySchedules) {
                providerSchedule.dailySchedules = schedule.dailySchedules;
            }
            console.log('[HttpProviderService] Work schedule fetched successfully', {
                providerId,
                workingDays: schedule.workingDays,
                workingHours: schedule.workingHours,
                hasDailySchedules: !!schedule.dailySchedules,
                dailySchedulesCount: schedule.dailySchedules?.length || 0,
            });
            return providerSchedule;
        }
        catch (error) {
            console.error('[HttpProviderService] Failed to fetch work schedule', {
                providerId,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            // Return null instead of throwing to allow graceful degradation
            return null;
        }
    }
    /**
     * Get provider details by ID
     */
    async getProvider(providerId) {
        try {
            const response = await this.httpClient.get(`/api/v1/staff/${providerId}`);
            if (!response.data.success || !response.data.data) {
                return null;
            }
            return response.data.data;
        }
        catch (error) {
            console.error('[HttpProviderService] Failed to fetch provider', {
                providerId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
}
exports.HttpProviderService = HttpProviderService;
//# sourceMappingURL=HttpProviderService.js.map