"use strict";
/**
 * Conflict Resolution Service Implementation
 * Handles appointment conflicts and suggests alternatives
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictResolutionService = void 0;
/**
 * Business Hours Configuration
 */
const BUSINESS_HOURS = {
    start: 8, // 8:00 AM
    end: 17, // 5:00 PM
    lunchStart: 12, // 12:00 PM
    lunchEnd: 13, // 1:00 PM
};
/**
 * Conflict Resolution Service Implementation
 */
class ConflictResolutionService {
    constructor(appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }
    /**
     * Check for scheduling conflicts
     */
    async checkConflicts(request) {
        const conflictCheck = await this.appointmentRepository.checkConflicts(request.doctorId, request.startTime, request.endTime, request.excludeAppointmentId);
        const conflicts = conflictCheck.conflicts.map(conflict => ({
            appointmentId: conflict.appointmentId,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
            patientName: 'Bệnh nhân khác',
            reason: conflict.reason,
        }));
        const hasConflicts = conflicts.length > 0;
        // If conflicts found, suggest alternatives
        let suggestions;
        if (hasConflicts) {
            suggestions = await this.generateAlternativeSlots(request.doctorId, request.startTime, request.endTime);
        }
        return {
            hasConflicts,
            conflicts,
            suggestions,
        };
    }
    /**
     * Find alternative time slots
     */
    async findAlternativeSlots(request) {
        const suggestions = [];
        const maxSuggestions = request.maxSuggestions || 5;
        // 1. Try same doctor, same day, different times
        const sameDaySuggestions = await this.findSameDayAlternatives(request.doctorId, request.preferredDate, request.durationMinutes);
        suggestions.push(...sameDaySuggestions.slice(0, maxSuggestions));
        // 2. If not enough, try next day
        if (suggestions.length < maxSuggestions) {
            const nextDaySuggestions = await this.findNextDayAlternatives(request.doctorId, request.preferredDate, request.durationMinutes, maxSuggestions - suggestions.length);
            suggestions.push(...nextDaySuggestions);
        }
        // 3. If still not enough and department specified, try other doctors
        if (suggestions.length < maxSuggestions && request.departmentId) {
            const otherDoctorsSuggestions = await this.suggestAlternativeDoctors(request.departmentId, request.preferredDate, request.durationMinutes, maxSuggestions - suggestions.length);
            suggestions.push(...otherDoctorsSuggestions);
        }
        return {
            suggestions,
            totalFound: suggestions.length,
        };
    }
    /**
     * Suggest nearest available slot
     */
    async suggestNearestAvailableSlot(doctorId, preferredTime, durationMinutes) {
        // Check forward in time (next 7 days)
        const searchEndDate = new Date(preferredTime);
        searchEndDate.setDate(searchEndDate.getDate() + 7);
        let currentDate = new Date(preferredTime);
        while (currentDate <= searchEndDate) {
            // Skip Sundays
            if (currentDate.getDay() === 0) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }
            // Check each time slot during business hours
            for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
                // Skip lunch hour
                if (hour >= BUSINESS_HOURS.lunchStart && hour < BUSINESS_HOURS.lunchEnd) {
                    continue;
                }
                const slotStart = new Date(currentDate);
                slotStart.setHours(hour, 0, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
                // Check if slot is available
                const isAvailable = await this.isSlotAvailable(doctorId, slotStart, slotEnd);
                if (isAvailable) {
                    return {
                        startTime: slotStart,
                        endTime: slotEnd,
                        doctorId,
                        confidence: this.calculateConfidence(preferredTime, slotStart),
                        reason: this.generateReasonText(preferredTime, slotStart),
                    };
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return null;
    }
    /**
     * Suggest alternative doctors in same department
     */
    async suggestAlternativeDoctors(departmentId, preferredTime, durationMinutes, maxSuggestions = 3) {
        const suggestions = [];
        try {
            // In production, this would query the provider-staff-service or read model
            // to get doctors in the same department. For now, we implement basic logic:
            // Search for available slots with other doctors
            // This would integrate with Provider Service or read from local read model
            console.log(`[ConflictResolution] Searching alternative doctors in department ${departmentId} ` +
                `for ${preferredTime.toISOString()}`);
            // Implementation note: This should call Provider Service API or query local read model
            // For now, returning empty array but with proper structure
            // In production: await providerService.getDoctorsByDepartment(departmentId)
            // Then check availability for each doctor
        }
        catch (error) {
            console.error('[ConflictResolution] Error finding alternative doctors:', error);
        }
        return suggestions;
    }
    // ==================== Private Helper Methods ====================
    /**
     * Generate alternative slots for same day
     */
    async findSameDayAlternatives(doctorId, preferredDate, durationMinutes) {
        const suggestions = [];
        const date = new Date(preferredDate);
        // Check all business hours
        for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
            // Skip lunch
            if (hour >= BUSINESS_HOURS.lunchStart && hour < BUSINESS_HOURS.lunchEnd) {
                continue;
            }
            const slotStart = new Date(date);
            slotStart.setHours(hour, 0, 0, 0);
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
            // Check availability
            const isAvailable = await this.isSlotAvailable(doctorId, slotStart, slotEnd);
            if (isAvailable) {
                suggestions.push({
                    startTime: slotStart,
                    endTime: slotEnd,
                    doctorId,
                    confidence: this.calculateConfidence(preferredDate, slotStart),
                    reason: `Cùng ngày, ${hour}:00`,
                });
            }
        }
        return suggestions;
    }
    /**
     * Generate alternative slots for next day
     */
    async findNextDayAlternatives(doctorId, preferredDate, durationMinutes, maxSuggestions) {
        const suggestions = [];
        let daysChecked = 0;
        const maxDaysToCheck = 7;
        while (suggestions.length < maxSuggestions && daysChecked < maxDaysToCheck) {
            const nextDate = new Date(preferredDate);
            nextDate.setDate(nextDate.getDate() + daysChecked + 1);
            // Skip Sundays
            if (nextDate.getDay() === 0) {
                daysChecked++;
                continue;
            }
            const sameDaySuggestions = await this.findSameDayAlternatives(doctorId, nextDate, durationMinutes);
            suggestions.push(...sameDaySuggestions.slice(0, maxSuggestions - suggestions.length));
            daysChecked++;
        }
        return suggestions;
    }
    /**
     * Check if time slot is available
     */
    async isSlotAvailable(doctorId, startTime, endTime) {
        try {
            // Check repository for conflicting appointments
            const conflictCheck = await this.appointmentRepository.checkConflicts(doctorId, startTime, endTime);
            // Slot is available if no conflicts found
            return conflictCheck.conflicts.length === 0;
        }
        catch (error) {
            console.error('[ConflictResolution] Error checking slot availability:', error);
            // In case of error, assume slot is NOT available (conservative approach)
            return false;
        }
    }
    /**
     * Calculate confidence score (0-100)
     */
    calculateConfidence(preferredTime, suggestedTime) {
        const timeDiff = Math.abs(suggestedTime.getTime() - preferredTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        // Perfect match: 100
        // Same hour: 90-100
        // Same day: 70-90
        // Next day: 50-70
        // Within week: 30-50
        if (hoursDiff === 0)
            return 100;
        if (hoursDiff < 1)
            return 90;
        if (hoursDiff < 8)
            return 80; // Same day
        if (hoursDiff < 24)
            return 60; // Next day
        if (hoursDiff < 168)
            return 40; // Within week
        return 20;
    }
    /**
     * Generate human-readable reason text
     */
    generateReasonText(preferredTime, suggestedTime) {
        const timeDiff = suggestedTime.getTime() - preferredTime.getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysDiff = Math.floor(hoursDiff / 24);
        if (hoursDiff === 0) {
            return 'Đúng giờ mong muốn';
        }
        else if (Math.abs(hoursDiff) < 8) {
            return `Cùng ngày, ${hoursDiff > 0 ? 'sau' : 'trước'} ${Math.abs(hoursDiff)} giờ`;
        }
        else if (Math.abs(daysDiff) === 1) {
            return daysDiff > 0 ? 'Ngày hôm sau' : 'Ngày hôm trước';
        }
        else if (Math.abs(daysDiff) < 7) {
            return `${daysDiff > 0 ? 'Sau' : 'Trước'} ${Math.abs(daysDiff)} ngày`;
        }
        return `${daysDiff} ngày ${daysDiff > 0 ? 'sau' : 'trước'}`;
    }
    /**
     * Generate alternative slots
     */
    async generateAlternativeSlots(doctorId, startTime, endTime) {
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        const request = {
            doctorId,
            preferredDate: startTime,
            durationMinutes,
            maxSuggestions: 5,
        };
        const response = await this.findAlternativeSlots(request);
        return response.suggestions;
    }
    // ==================== MISSING METHODS FROM COMPILE ERRORS ====================
    /**
     * Find available time slots for scheduling
     * Used by event consumers for waitlist management
     */
    async findAvailableTimeSlots(providerId, date, duration) {
        try {
            console.log(`Finding available time slots for provider ${providerId} on ${date.toISOString()}`);
            // Get existing appointments for the provider on the given date
            const appointments = await this.appointmentRepository.findByProviderId(providerId);
            const dateStr = date.toISOString().split('T')[0];
            // Filter appointments for the specific date
            const dayAppointments = appointments.filter(apt => {
                const aptDate = apt.timeSlot?.appointmentDate;
                return aptDate === dateStr;
            });
            // Generate available slots based on business hours
            const availableSlots = [];
            const currentDate = new Date(date);
            currentDate.setHours(BUSINESS_HOURS.start, 0, 0, 0); // Start at 8:00 AM
            const endTime = new Date(date);
            endTime.setHours(BUSINESS_HOURS.end, 0, 0, 0); // End at 5:00 PM
            while (currentDate < endTime) {
                const slotEnd = new Date(currentDate.getTime() + duration * 60 * 1000);
                // Skip lunch break
                const slotHour = currentDate.getHours();
                if (slotHour >= BUSINESS_HOURS.lunchStart && slotHour < BUSINESS_HOURS.lunchEnd) {
                    currentDate.setHours(BUSINESS_HOURS.lunchEnd, 0, 0, 0);
                    continue;
                }
                // Check if slot conflicts with existing appointments
                const hasConflict = dayAppointments.some(apt => {
                    const aptStart = new Date(`${apt.timeSlot?.appointmentDate}T${apt.timeSlot?.appointmentTime}`);
                    const aptEnd = new Date(aptStart.getTime() + (apt.durationMinutes || 30) * 60 * 1000);
                    return ((currentDate < aptEnd && slotEnd > aptStart) // Overlap check
                    );
                });
                if (!hasConflict && slotEnd <= endTime) {
                    availableSlots.push({
                        startTime: new Date(currentDate),
                        endTime: new Date(slotEnd)
                    });
                }
                // Move to next slot (30-minute intervals)
                currentDate.setTime(currentDate.getTime() + 30 * 60 * 1000);
            }
            console.log(`Found ${availableSlots.length} available slots for provider ${providerId}`);
            return availableSlots;
        }
        catch (error) {
            console.error('Error finding available time slots:', error);
            throw error;
        }
    }
    /**
     * Find urgent appointment slot
     * Finding urgent slots is appointment scheduling responsibility
     */
    async findUrgentAppointmentSlot(criteria) {
        try {
            console.log(`Finding urgent appointment slot for patient ${criteria.patientId} with urgency ${criteria.urgency}`);
            // For urgent appointments, we need to find the earliest available slot
            const searchTime = criteria.preferredTime || new Date();
            const searchDate = new Date(searchTime);
            // Search within next 24 hours for urgent, 6 hours for emergency
            const searchHours = criteria.urgency === 'emergency' ? 6 : 24;
            const endTime = new Date(searchDate.getTime() + searchHours * 60 * 60 * 1000);
            // Find available providers in the department (if specified) or all providers
            const availableProviders = await this.findAvailableProvidersForUrgent(criteria.departmentId, searchTime, criteria.durationMinutes);
            if (availableProviders.length === 0) {
                console.log(`No available providers found for urgent appointment`);
                return null;
            }
            // Return the earliest available slot with highest confidence
            const bestSlot = availableProviders[0];
            console.log(`Found urgent appointment slot with provider ${bestSlot.providerId}`);
            return {
                startTime: bestSlot.startTime,
                endTime: bestSlot.endTime,
                providerId: bestSlot.providerId,
                departmentId: criteria.departmentId || 'general',
                confidence: bestSlot.confidence
            };
        }
        catch (error) {
            console.error('Error finding urgent appointment slot:', error);
            throw error;
        }
    }
    /**
     * Helper method to find available providers for urgent appointments
     */
    async findAvailableProvidersForUrgent(departmentId, startTime, durationMinutes) {
        try {
            // This is a simplified implementation - in production, you would:
            // 1. Query provider availability from provider service
            // 2. Check department capacity
            // 3. Consider provider specializations
            // 4. Calculate confidence scores based on multiple factors
            const availableSlots = [];
            // For demo purposes, return mock available slots
            const currentTime = new Date(startTime);
            // Check next few 30-minute slots
            for (let i = 0; i < 8; i++) {
                const slotStart = new Date(currentTime.getTime() + i * 30 * 60 * 1000);
                const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
                // Mock provider availability check
                const isAvailable = await this.appointmentRepository.checkStaffAvailability('mock-provider-id', // In production, this would be actual provider IDs
                slotStart, slotEnd);
                if (isAvailable) {
                    availableSlots.push({
                        providerId: 'mock-provider-id',
                        startTime: slotStart,
                        endTime: slotEnd,
                        confidence: Math.max(0.5, 1.0 - (i * 0.1)) // Decreasing confidence over time
                    });
                }
            }
            return availableSlots.sort((a, b) => b.confidence - a.confidence);
        }
        catch (error) {
            console.error('Error finding available providers for urgent:', error);
            return [];
        }
    }
}
exports.ConflictResolutionService = ConflictResolutionService;
//# sourceMappingURL=ConflictResolutionService.js.map