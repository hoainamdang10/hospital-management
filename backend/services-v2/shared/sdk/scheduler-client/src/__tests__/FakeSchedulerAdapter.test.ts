/**
 * Tests for FakeSchedulerAdapter
 */

import { FakeSchedulerAdapter } from '../FakeSchedulerAdapter';
import { SchedulerError } from '../types';

describe('FakeSchedulerAdapter', () => {
  let scheduler: FakeSchedulerAdapter;
  
  beforeEach(() => {
    scheduler = new FakeSchedulerAdapter({ delay: 0 });
  });
  
  afterEach(() => {
    scheduler.reset();
  });
  
  describe('createOrUpdateByDedup', () => {
    it('should create new schedule', async () => {
      const schedule = await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });
      
      expect(schedule.scheduleId).toBeDefined();
      expect(schedule.tenantId).toBe('hospital-1');
      expect(schedule.ownerService).toBe('appointments');
      expect(schedule.scheduleType).toBe('ONCE');
      expect(schedule.status).toBe('ACTIVE');
      expect(schedule.dedupKey).toBe('appt-123:reminder-24h');
      expect(schedule.createdAtUtc).toBeDefined();
      expect(schedule.updatedAtUtc).toBeDefined();
    });
    
    it('should update existing schedule by dedupKey', async () => {
      // Create first schedule
      const schedule1 = await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });

      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));

      // Update with same dedupKey
      const schedule2 = await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-24T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123', updated: true },
        dedupKey: 'appt-123:reminder-24h'
      });

      // Should have same scheduleId
      expect(schedule2.scheduleId).toBe(schedule1.scheduleId);
      expect(schedule2.createdAtUtc).toBe(schedule1.createdAtUtc);
      expect(schedule2.updatedAtUtc).not.toBe(schedule1.updatedAtUtc);
    });
    
    it('should validate schedule type', async () => {
      await expect(
        scheduler.createOrUpdateByDedup({
          tenantId: 'hospital-1',
          ownerService: 'appointments',
          scheduleType: 'ONCE',
          topicOrCommand: 'appointments.appointment.reminder.24h',
          payloadJson: { appointmentId: 'appt-123' },
          dedupKey: 'appt-123:reminder-24h'
        } as any)
      ).rejects.toThrow(SchedulerError);
    });
    
    it('should simulate error when configured', async () => {
      const errorScheduler = new FakeSchedulerAdapter({
        simulateErrors: {
          createOrUpdateByDedup: 'VALIDATION_ERROR'
        }
      });
      
      await expect(
        errorScheduler.createOrUpdateByDedup({
          tenantId: 'hospital-1',
          ownerService: 'appointments',
          scheduleType: 'ONCE',
          startAtUtc: new Date('2025-10-23T09:00:00Z'),
          topicOrCommand: 'appointments.appointment.reminder.24h',
          payloadJson: { appointmentId: 'appt-123' },
          dedupKey: 'appt-123:reminder-24h'
        })
      ).rejects.toThrow('VALIDATION_ERROR');
    });
  });
  
  describe('cancelByOwner', () => {
    beforeEach(async () => {
      // Create test schedules
      await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        ownerResourceType: 'appointment',
        ownerResourceId: 'appt-123',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });
      
      await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        ownerResourceType: 'appointment',
        ownerResourceId: 'appt-123',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T07:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.2h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-2h'
      });
      
      await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        ownerResourceType: 'appointment',
        ownerResourceId: 'appt-456',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-456' },
        dedupKey: 'appt-456:reminder-24h'
      });
    });
    
    it('should cancel schedules by ownerResourceId', async () => {
      const result = await scheduler.cancelByOwner({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        ownerResourceType: 'appointment',
        ownerResourceId: 'appt-123'
      });
      
      expect(result.cancelledCount).toBe(2);
      expect(result.cancelledScheduleIds).toHaveLength(2);
    });
    
    it('should cancel all schedules for ownerService', async () => {
      const result = await scheduler.cancelByOwner({
        tenantId: 'hospital-1',
        ownerService: 'appointments'
      });
      
      expect(result.cancelledCount).toBe(3);
    });
    
    it('should not cancel schedules from different tenant', async () => {
      const result = await scheduler.cancelByOwner({
        tenantId: 'hospital-2',
        ownerService: 'appointments'
      });
      
      expect(result.cancelledCount).toBe(0);
    });
  });
  
  describe('getSchedule', () => {
    it('should get schedule by ID', async () => {
      const created = await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });
      
      const schedule = await scheduler.getSchedule(created.scheduleId);
      
      expect(schedule.scheduleId).toBe(created.scheduleId);
      expect(schedule.tenantId).toBe('hospital-1');
    });
    
    it('should throw NOT_FOUND for non-existent schedule', async () => {
      await expect(
        scheduler.getSchedule('550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow(SchedulerError);
    });
  });
  
  describe('runNow', () => {
    it('should trigger schedule to run immediately', async () => {
      const schedule = await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });
      
      const run = await scheduler.runNow(schedule.scheduleId);
      
      expect(run.runId).toBeDefined();
      expect(run.scheduleId).toBe(schedule.scheduleId);
      expect(run.status).toBe('DUE');
      expect(run.dueAtUtc).toBeDefined();
    });
    
    it('should throw NOT_FOUND for non-existent schedule', async () => {
      await expect(
        scheduler.runNow('550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow(SchedulerError);
    });
    
    it('should throw CONFLICT for non-ACTIVE schedule', async () => {
      const schedule = await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });
      
      // Cancel schedule
      await scheduler.cancelByOwner({
        tenantId: 'hospital-1',
        ownerService: 'appointments'
      });
      
      await expect(
        scheduler.runNow(schedule.scheduleId)
      ).rejects.toThrow(SchedulerError);
    });
  });
  
  describe('getScheduleRuns', () => {
    it('should get runs for schedule', async () => {
      const schedule = await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });
      
      // Trigger run
      await scheduler.runNow(schedule.scheduleId);
      
      const result = await scheduler.getScheduleRuns({
        scheduleId: schedule.scheduleId
      });
      
      expect(result.runs).toHaveLength(1);
      expect(result.runs[0].status).toBe('DUE');
      expect(result.pagination.hasMore).toBe(false);
    });
    
    it('should filter runs by status', async () => {
      const schedule = await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });
      
      await scheduler.runNow(schedule.scheduleId);
      
      const result = await scheduler.getScheduleRuns({
        scheduleId: schedule.scheduleId,
        status: 'DUE'
      });
      
      expect(result.runs).toHaveLength(1);
    });
    
    it('should throw NOT_FOUND for non-existent schedule', async () => {
      await expect(
        scheduler.getScheduleRuns({
          scheduleId: '550e8400-e29b-41d4-a716-446655440000'
        })
      ).rejects.toThrow(SchedulerError);
    });
  });
  
  describe('health', () => {
    it('should return healthy status', async () => {
      const health = await scheduler.health();
      
      expect(health.status).toBe('healthy');
      expect(health.service).toBe('scheduler-service');
      expect(health.version).toBe('1.0.1');
      expect(health.components?.database?.status).toBe('healthy');
      expect(health.components?.rabbitmq?.status).toBe('healthy');
      expect(health.components?.redis?.status).toBe('healthy');
    });
  });
  
  describe('reset', () => {
    it('should clear all data', async () => {
      await scheduler.createOrUpdateByDedup({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        scheduleType: 'ONCE',
        startAtUtc: new Date('2025-10-23T09:00:00Z'),
        topicOrCommand: 'appointments.appointment.reminder.24h',
        payloadJson: { appointmentId: 'appt-123' },
        dedupKey: 'appt-123:reminder-24h'
      });
      
      expect(scheduler.getAllSchedules()).toHaveLength(1);
      
      scheduler.reset();
      
      expect(scheduler.getAllSchedules()).toHaveLength(0);
    });
  });
});

