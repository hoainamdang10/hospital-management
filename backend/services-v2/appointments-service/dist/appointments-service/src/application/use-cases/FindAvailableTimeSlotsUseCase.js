"use strict";
/**
 * FindAvailableTimeSlots Use Case - Application Layer
 * V2 Clean Architecture + DDD Implementation
 *
 * Business Logic: Calculate available time slots for provider
 * Formula: Available Slots = Work Schedule Template - Booked Appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 *
 * Security Note (2025-10-23):
 * - Current RLS: Service role bypass + authenticated read access
 * - Data Classification: Operational data (non-PHI)
 *
 * Multi-Tenancy Support (Future Enhancement):
 * When implementing multi-tenancy, add:
 * 1. tenantId to FindAvailableTimeSlotsCommand
 * 2. Provider active status filter via IProviderService
 * 3. Tenant-level RLS policies in provider_schema and appointments_schema
 * 4. Filter bookedAppointments by tenant_id in repository
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindAvailableTimeSlotsUseCase = void 0;
const TimeSlot_vo_1 = require("../../domain/value-objects/TimeSlot.vo");
/**
 * FindAvailableTimeSlots Use Case
 *
 * Bounded Context: Scheduling Context (Appointments Service)
 * Responsibility: Calculate runtime availability based on work schedule template
 *
 * Flow:
 * 1. Get cached work schedule template from ProviderScheduleRepository
 * 2. Get booked appointments for the date from AppointmentRepository
 * 3. Calculate available slots = template - booked
 * 4. Return available time slots
 */
class FindAvailableTimeSlotsUseCase {
    constructor(providerScheduleRepository, appointmentRepository) {
        this.providerScheduleRepository = providerScheduleRepository;
        this.appointmentRepository = appointmentRepository;
    }
    /**
     * Execute use case
     *
     * @param command - Command with providerId, date, durationMinutes
     * @returns Array of available time slots
     * @throws Error if provider schedule not found
     */
    async execute(command) {
        const { providerId, date, durationMinutes } = command;
        // Validate inputs
        this.validateCommand(command);
        // 1. Get cached work schedule template
        const providerSchedule = await this.providerScheduleRepository.findByProviderId(providerId);
        if (!providerSchedule) {
            throw new Error(`Provider schedule not found for provider: ${providerId}`);
        }
        // 2. Check if provider works on this day
        const dayOfWeek = this.getDayOfWeek(date);
        if (!providerSchedule.isWorkingDay(dayOfWeek)) {
            // Provider doesn't work on this day
            return [];
        }
        // 3. Get booked appointments for the date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const bookedAppointments = await this.appointmentRepository.findByTimeSlot(providerId, startOfDay, endOfDay);
        // 4. Generate all possible time slots from work schedule
        const allPossibleSlots = this.generateTimeSlotsFromSchedule(date, providerSchedule.workingHours.start, providerSchedule.workingHours.end, durationMinutes);
        // 5. Filter out booked slots
        const availableSlots = this.filterAvailableSlots(allPossibleSlots, bookedAppointments.map(apt => ({
            startTime: apt.timeSlot.toDate(),
            endTime: new Date(apt.timeSlot.toDate().getTime() + apt.durationMinutes * 60000)
        })), durationMinutes);
        // 6. Convert to DTOs
        return availableSlots.map(slot => this.toDTO(slot, dayOfWeek));
    }
    /**
     * Validate command inputs
     */
    validateCommand(command) {
        if (!command.providerId || command.providerId.trim() === '') {
            throw new Error('Provider ID is required');
        }
        if (!command.date || !(command.date instanceof Date)) {
            throw new Error('Valid date is required');
        }
        if (isNaN(command.date.getTime())) {
            throw new Error('Invalid date');
        }
        if (!command.durationMinutes || command.durationMinutes <= 0) {
            throw new Error('Duration must be greater than 0');
        }
        if (command.durationMinutes > 480) {
            throw new Error('Duration cannot exceed 8 hours (480 minutes)');
        }
    }
    /**
     * Get day of week in lowercase (monday, tuesday, etc.)
     */
    getDayOfWeek(date) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    }
    /**
     * Generate all possible time slots from work schedule
     */
    generateTimeSlotsFromSchedule(date, startTime, // HH:MM format
    endTime, // HH:MM format
    durationMinutes) {
        const slots = [];
        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        // Create start datetime
        const currentSlot = new Date(date);
        currentSlot.setHours(startHour, startMinute, 0, 0);
        // Create end datetime
        const workDayEnd = new Date(date);
        workDayEnd.setHours(endHour, endMinute, 0, 0);
        // Generate slots
        while (currentSlot.getTime() + durationMinutes * 60000 <= workDayEnd.getTime()) {
            const slotStart = new Date(currentSlot);
            const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);
            slots.push({
                startTime: slotStart,
                endTime: slotEnd
            });
            // Move to next slot (increment by duration)
            currentSlot.setTime(currentSlot.getTime() + durationMinutes * 60000);
        }
        return slots;
    }
    /**
     * Filter out booked slots from all possible slots
     */
    filterAvailableSlots(allSlots, bookedSlots, durationMinutes) {
        return allSlots.filter(slot => {
            // Check if this slot conflicts with any booked appointment
            const hasConflict = bookedSlots.some(booked => {
                // Conflict if:
                // 1. Slot starts during booked appointment
                // 2. Slot ends during booked appointment
                // 3. Slot completely contains booked appointment
                return ((slot.startTime >= booked.startTime && slot.startTime < booked.endTime) ||
                    (slot.endTime > booked.startTime && slot.endTime <= booked.endTime) ||
                    (slot.startTime <= booked.startTime && slot.endTime >= booked.endTime));
            });
            return !hasConflict;
        });
    }
    /**
     * Convert time slot to DTO
     */
    toDTO(slot, dayOfWeek) {
        const timeSlot = TimeSlot_vo_1.TimeSlot.fromDate(slot.startTime);
        return {
            startTime: slot.startTime,
            endTime: slot.endTime,
            appointmentDate: timeSlot.appointmentDate,
            appointmentTime: timeSlot.appointmentTime,
            formattedTime: timeSlot.getFormattedTime(),
            dayOfWeek: this.getVietnameseDayName(dayOfWeek),
            isAvailable: true
        };
    }
    /**
     * Get Vietnamese day name
     */
    getVietnameseDayName(dayOfWeek) {
        const vietnameseDays = {
            'monday': 'Thứ Hai',
            'tuesday': 'Thứ Ba',
            'wednesday': 'Thứ Tư',
            'thursday': 'Thứ Năm',
            'friday': 'Thứ Sáu',
            'saturday': 'Thứ Bảy',
            'sunday': 'Chủ Nhật'
        };
        return vietnameseDays[dayOfWeek] || dayOfWeek;
    }
}
exports.FindAvailableTimeSlotsUseCase = FindAvailableTimeSlotsUseCase;
//# sourceMappingURL=FindAvailableTimeSlotsUseCase.js.map