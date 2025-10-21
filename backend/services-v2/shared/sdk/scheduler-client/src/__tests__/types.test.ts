/**
 * Tests for types.ts
 */

import {
  validateScheduleType,
  SchedulerError,
  isErrorResponse,
  isScheduleResponse,
  isRunsResponse,
  CreateScheduleRequest
} from '../types';

describe('validateScheduleType', () => {
  describe('ONCE schedules', () => {
    it('should pass validation with valid ONCE schedule', () => {
      const request: CreateScheduleRequest = {
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      };
      
      expect(() => validateScheduleType(request)).not.toThrow();
    });
    
    it('should throw error when startAtUtc is missing', () => {
      const request: any = {
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      };
      
      expect(() => validateScheduleType(request)).toThrow(SchedulerError);
      expect(() => validateScheduleType(request)).toThrow('ONCE schedules require startAtUtc');
    });
    
    it('should throw error when cronExpr is present', () => {
      const request: any = {
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        cronExpr: '0 9 * * *',
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      };
      
      expect(() => validateScheduleType(request)).toThrow(SchedulerError);
      expect(() => validateScheduleType(request)).toThrow('ONCE schedules cannot have cronExpr');
    });
    
    it('should throw error when rrule is present', () => {
      const request: any = {
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        rrule: 'FREQ=DAILY',
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      };
      
      expect(() => validateScheduleType(request)).toThrow(SchedulerError);
      expect(() => validateScheduleType(request)).toThrow('ONCE schedules cannot have rrule');
    });
  });
  
  describe('CRON schedules', () => {
    it('should pass validation with valid CRON schedule', () => {
      const request: CreateScheduleRequest = {
        tenantId: 'hospital-1',
        ownerService: 'billing',
        scheduleType: 'CRON',
        cronExpr: '0 9 * * *',
        topicOrCommand: 'billing.report.daily',
        payloadJson: { reportType: 'daily' },
        dedupKey: 'billing:daily-report'
      };
      
      expect(() => validateScheduleType(request)).not.toThrow();
    });
    
    it('should throw error when cronExpr is missing', () => {
      const request: any = {
        tenantId: 'hospital-1',
        ownerService: 'billing',
        scheduleType: 'CRON',
        topicOrCommand: 'billing.report.daily',
        payloadJson: { reportType: 'daily' },
        dedupKey: 'billing:daily-report'
      };
      
      expect(() => validateScheduleType(request)).toThrow(SchedulerError);
      expect(() => validateScheduleType(request)).toThrow('CRON schedules require cronExpr');
    });
    
    it('should throw error when startAtUtc is present', () => {
      const request: any = {
        tenantId: 'hospital-1',
        ownerService: 'billing',
        scheduleType: 'CRON',
        cronExpr: '0 9 * * *',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'billing.report.daily',
        payloadJson: { reportType: 'daily' },
        dedupKey: 'billing:daily-report'
      };
      
      expect(() => validateScheduleType(request)).toThrow(SchedulerError);
      expect(() => validateScheduleType(request)).toThrow('CRON schedules cannot have startAtUtc');
    });
  });
  
  describe('RRULE schedules', () => {
    it('should pass validation with valid RRULE schedule (with startAtUtc)', () => {
      const request: CreateScheduleRequest = {
        tenantId: 'hospital-1',
        ownerService: 'notifications',
        scheduleType: 'RRULE',
        rrule: 'FREQ=DAILY;INTERVAL=1',
        startAtUtc: new Date('2025-10-22T09:00:00Z'),
        topicOrCommand: 'notifications.alert.send',
        payloadJson: { alertType: 'daily' },
        dedupKey: 'notifications:daily-alert'
      };
      
      expect(() => validateScheduleType(request)).not.toThrow();
    });
    
    it('should pass validation with valid RRULE schedule (without startAtUtc)', () => {
      const request: CreateScheduleRequest = {
        tenantId: 'hospital-1',
        ownerService: 'notifications',
        scheduleType: 'RRULE',
        rrule: 'FREQ=DAILY;INTERVAL=1',
        topicOrCommand: 'notifications.alert.send',
        payloadJson: { alertType: 'daily' },
        dedupKey: 'notifications:daily-alert'
      };
      
      expect(() => validateScheduleType(request)).not.toThrow();
    });
    
    it('should throw error when rrule is missing', () => {
      const request: any = {
        tenantId: 'hospital-1',
        ownerService: 'notifications',
        scheduleType: 'RRULE',
        topicOrCommand: 'notifications.alert.send',
        payloadJson: { alertType: 'daily' },
        dedupKey: 'notifications:daily-alert'
      };
      
      expect(() => validateScheduleType(request)).toThrow(SchedulerError);
      expect(() => validateScheduleType(request)).toThrow('RRULE schedules require rrule');
    });
    
    it('should throw error when cronExpr is present', () => {
      const request: any = {
        tenantId: 'hospital-1',
        ownerService: 'notifications',
        scheduleType: 'RRULE',
        rrule: 'FREQ=DAILY;INTERVAL=1',
        cronExpr: '0 9 * * *',
        topicOrCommand: 'notifications.alert.send',
        payloadJson: { alertType: 'daily' },
        dedupKey: 'notifications:daily-alert'
      };
      
      expect(() => validateScheduleType(request)).toThrow(SchedulerError);
      expect(() => validateScheduleType(request)).toThrow('RRULE schedules cannot have cronExpr');
    });
  });
  
  describe('Invalid scheduleType', () => {
    it('should throw error for invalid scheduleType', () => {
      const request: any = {
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'INVALID',
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      };
      
      expect(() => validateScheduleType(request)).toThrow(SchedulerError);
      expect(() => validateScheduleType(request)).toThrow('Invalid scheduleType: INVALID');
    });
  });
});

describe('Type guards', () => {
  describe('isErrorResponse', () => {
    it('should return true for valid ErrorResponse', () => {
      const obj = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request'
        }
      };
      
      expect(isErrorResponse(obj)).toBe(true);
    });
    
    it('should return false for non-ErrorResponse', () => {
      expect(isErrorResponse({})).toBe(false);
      expect(isErrorResponse({ scheduleId: '123' })).toBe(false);
      expect(isErrorResponse(null)).toBe(false);
      expect(isErrorResponse(undefined)).toBe(false);
    });
  });
  
  describe('isScheduleResponse', () => {
    it('should return true for valid ScheduleResponse', () => {
      const obj = {
        scheduleId: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: 'hospital-1',
        status: 'ACTIVE'
      };
      
      expect(isScheduleResponse(obj)).toBe(true);
    });
    
    it('should return false for non-ScheduleResponse', () => {
      expect(isScheduleResponse({})).toBe(false);
      expect(isScheduleResponse({ error: {} })).toBe(false);
      expect(isScheduleResponse(null)).toBe(false);
    });
  });
  
  describe('isRunsResponse', () => {
    it('should return true for valid RunsResponse', () => {
      const obj = {
        runs: [],
        pagination: {
          nextCursor: null,
          hasMore: false
        }
      };
      
      expect(isRunsResponse(obj)).toBe(true);
    });
    
    it('should return false for non-RunsResponse', () => {
      expect(isRunsResponse({})).toBe(false);
      expect(isRunsResponse({ runs: [] })).toBe(false);
      expect(isRunsResponse({ pagination: {} })).toBe(false);
      expect(isRunsResponse(null)).toBe(false);
    });
  });
});

describe('SchedulerError', () => {
  it('should create error with all properties', () => {
    const error = new SchedulerError(
      'VALIDATION_ERROR',
      'Invalid request',
      { field: 'startAtUtc' },
      '550e8400-e29b-41d4-a716-446655440000'
    );
    
    expect(error.name).toBe('SchedulerError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid request');
    expect(error.details).toEqual({ field: 'startAtUtc' });
    expect(error.traceId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
  
  it('should create error without optional properties', () => {
    const error = new SchedulerError('INTERNAL_ERROR', 'Server error');
    
    expect(error.name).toBe('SchedulerError');
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toBe('Server error');
    expect(error.details).toBeUndefined();
    expect(error.traceId).toBeUndefined();
  });
});

