/**
 * Queue Aggregate Unit Tests
 * Tests queue domain business logic
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { Queue } from '../../../../src/domain/aggregates/Queue.aggregate';
import { QueuePriority, QueueStatus } from '../../../../src/domain/entities/QueueEntry.entity';
import { PatientJoinedQueueEvent } from '../../../../src/domain/events/PatientJoinedQueueEvent';
import { PatientCalledEvent } from '../../../../src/domain/events/PatientCalledEvent';
import { PatientLeftQueueEvent } from '../../../../src/domain/events/PatientLeftQueueEvent';

describe('Queue Aggregate', () => {
  let queue: Queue;
  const doctorId = 'doctor-1';
  const date = new Date('2025-12-01');

  beforeEach(() => {
    queue = Queue.create(doctorId, date, 15);
  });

  describe('create', () => {
    it('should create new queue for doctor', () => {
      const newQueue = Queue.create('doctor-2', new Date('2025-12-02'));

      expect(newQueue.doctorId).toBe('doctor-2');
      expect(newQueue.entries).toHaveLength(0);
      expect(newQueue.averageConsultationMinutes).toBe(15);
    });

    it('should create queue with custom consultation time', () => {
      const newQueue = Queue.create('doctor-2', date, 20);

      expect(newQueue.averageConsultationMinutes).toBe(20);
    });

    it('should generate unique queue ID', () => {
      const queue1 = Queue.create('doctor-1', new Date('2025-12-01'));
      const queue2 = Queue.create('doctor-1', new Date('2025-12-02'));

      expect(queue1.id).not.toBe(queue2.id);
    });
  });

  describe('addPatient', () => {
    it('should add patient to queue', () => {
      const entry = queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);

      expect(queue.entries).toHaveLength(1);
      expect(entry.patientId).toBe('patient-1');
      expect(entry.priority).toBe(QueuePriority.NORMAL);
      expect(entry.status).toBe(QueueStatus.WAITING);
    });

    it('should emit PatientJoinedQueueEvent', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);

      const events = queue.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PatientJoinedQueueEvent);
    });

    it('should prevent duplicate patient', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);

      expect(() => {
        queue.addPatient('patient-1', 'apt-2', QueuePriority.URGENT);
      }).toThrow('already in the queue');
    });

    it('should calculate queue number correctly', () => {
      const entry1 = queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      const entry2 = queue.addPatient('patient-2', 'apt-2', QueuePriority.NORMAL);
      const entry3 = queue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);

      expect(entry1.queueNumber).toBe(1);
      expect(entry2.queueNumber).toBe(2);
      expect(entry3.queueNumber).toBe(3);
    });

    it('should calculate estimated wait time', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      const entry2 = queue.addPatient('patient-2', 'apt-2', QueuePriority.NORMAL);

      expect(entry2.estimatedWaitMinutes).toBeGreaterThan(0);
    });
  });

  describe('Priority ordering', () => {
    it('should prioritize EMERGENCY over other priorities', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.EMERGENCY);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.URGENT);

      const nextPatient = queue.callNext('nurse-1');

      expect(nextPatient?.patientId).toBe('patient-2'); // EMERGENCY
    });

    it('should prioritize URGENT over NORMAL', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.URGENT);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.LOW);

      const nextPatient = queue.callNext('nurse-1');

      expect(nextPatient?.patientId).toBe('patient-2'); // URGENT
    });

    it('should follow FIFO for same priority', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.NORMAL);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);

      const nextPatient = queue.callNext('nurse-1');

      expect(nextPatient?.patientId).toBe('patient-1'); // First in
    });

    it('should maintain priority order: EMERGENCY > URGENT > NORMAL > LOW', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.LOW);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.NORMAL);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.EMERGENCY);
      queue.addPatient('patient-4', 'apt-4', QueuePriority.URGENT);

      const p1 = queue.callNext('nurse-1');
      const p2 = queue.callNext('nurse-1');
      const p3 = queue.callNext('nurse-1');
      const p4 = queue.callNext('nurse-1');

      expect(p1?.priority).toBe(QueuePriority.EMERGENCY);
      expect(p2?.priority).toBe(QueuePriority.URGENT);
      expect(p3?.priority).toBe(QueuePriority.NORMAL);
      expect(p4?.priority).toBe(QueuePriority.LOW);
    });
  });

  describe('callNext', () => {
    beforeEach(() => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.URGENT);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);
    });

    it('should call next waiting patient', () => {
      const nextPatient = queue.callNext('nurse-1');

      expect(nextPatient).toBeDefined();
      expect(nextPatient?.patientId).toBe('patient-2'); // URGENT first
      expect(nextPatient?.status).toBe(QueueStatus.CALLED);
    });

    it('should emit PatientCalledEvent', () => {
      queue.markEventsAsCommitted(); // Clear join events
      queue.callNext('nurse-1');

      const events = queue.getUncommittedEvents();
      const calledEvents = events.filter(e => e instanceof PatientCalledEvent);
      expect(calledEvents).toHaveLength(1);
    });

    it('should return null when no patients waiting', () => {
      const emptyQueue = Queue.create('doctor-2', new Date());

      const nextPatient = emptyQueue.callNext('nurse-1');

      expect(nextPatient).toBeNull();
    });

    it('should set called time', () => {
      const nextPatient = queue.callNext('nurse-1');

      expect(nextPatient?.calledTime).toBeDefined();
      expect(nextPatient?.calledTime).toBeInstanceOf(Date);
    });

    it('should skip already called patients', () => {
      queue.callNext('nurse-1'); // Call patient-2 (URGENT)
      const secondCall = queue.callNext('nurse-1'); // Should call patient-1 (NORMAL)

      expect(secondCall?.patientId).toBe('patient-1');
    });
  });

  describe('removePatient', () => {
    beforeEach(() => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.URGENT);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);
    });

    it('should remove patient from queue', () => {
      queue.removePatient('patient-2', 'Left voluntarily', 'patient-2');

      expect(queue.entries).toHaveLength(2);
      expect(queue.hasPatient('patient-2')).toBe(false);
    });

    it('should emit PatientLeftQueueEvent', () => {
      queue.markEventsAsCommitted();
      queue.removePatient('patient-2', 'Emergency elsewhere', 'patient-2');

      const events = queue.getUncommittedEvents();
      const leftEvents = events.filter(e => e instanceof PatientLeftQueueEvent);
      expect(leftEvents).toHaveLength(1);
    });

    it('should throw when patient not in queue', () => {
      expect(() => {
        queue.removePatient('patient-999', 'N/A', 'nurse-1');
      }).toThrow('not found in queue');
    });

    it('should reorder queue after removal', () => {
      const initialLength = queue.entries.length;

      queue.removePatient('patient-2', 'Left', 'patient-2');

      expect(queue.entries).toHaveLength(initialLength - 1);
    });

    it('should recalculate wait times after removal', () => {
      queue.addPatient('patient-4', 'apt-4', QueuePriority.NORMAL);
      const p4InitialWait = queue.getPatientPosition('patient-4')?.estimatedWaitMinutes;

      queue.removePatient('patient-1', 'Left', 'patient-1');
      queue.removePatient('patient-2', 'Left', 'patient-2');

      const p4FinalWait = queue.getPatientPosition('patient-4')?.estimatedWaitMinutes;

      expect(p4FinalWait).toBeLessThan(p4InitialWait!);
    });
  });

  describe('startService', () => {
    beforeEach(() => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.callNext('nurse-1');
    });

    it('should start service for called patient', () => {
      const entry = queue.startService('patient-1');

      expect(entry.status).toBe(QueueStatus.IN_PROGRESS);
      expect(entry.serviceStartedAt).toBeDefined();
    });

    it('should throw when patient not found', () => {
      expect(() => {
        queue.startService('patient-999');
      }).toThrow('not found in queue');
    });
  });

  describe('completeService', () => {
    beforeEach(() => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.callNext('nurse-1');
      queue.startService('patient-1');
    });

    it('should complete service for patient', () => {
      const entry = queue.completeService('patient-1');

      expect(entry.status).toBe(QueueStatus.COMPLETED);
      expect(entry.serviceCompletedAt).toBeDefined();
    });

    it('should recalculate wait times after completion', () => {
      queue.addPatient('patient-2', 'apt-2', QueuePriority.NORMAL);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);
      
      const p2InitialWait = queue.getPatientPosition('patient-2')?.estimatedWaitMinutes;
      const p3InitialWait = queue.getPatientPosition('patient-3')?.estimatedWaitMinutes;

      queue.completeService('patient-1');

      const p2FinalWait = queue.getPatientPosition('patient-2')?.estimatedWaitMinutes;
      const p3FinalWait = queue.getPatientPosition('patient-3')?.estimatedWaitMinutes;

      // After completing patient-1 (IN_PROGRESS), wait times are recalculated
      // patient-2 and patient-3 remain WAITING, so their relative positions don't change
      expect(p2FinalWait).toBe(p2InitialWait); // Still first in WAITING queue
      expect(p3FinalWait).toBe(p3InitialWait); // Still second in WAITING queue
      expect(p2FinalWait).toBe(0); // No one ahead
      expect(p3FinalWait).toBe(15); // patient-2 ahead (1 * 15 min)
    });
  });

  describe('getStatus', () => {
    beforeEach(() => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.URGENT);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);
      queue.callNext('nurse-1');
      queue.startService('patient-2');
    });

    it('should return queue statistics', () => {
      const status = queue.getStatus();

      expect(status.totalWaiting).toBeGreaterThan(0);
      expect(status.totalInProgress).toBe(1);
      expect(status.entries).toBeDefined();
    });

    it('should count patients by status', () => {
      queue.addPatient('patient-4', 'apt-4', QueuePriority.LOW);
      queue.callNext('nurse-1');

      const status = queue.getStatus();

      expect(status.totalWaiting).toBeGreaterThan(0);
      expect(status.totalCalled).toBeGreaterThan(0);
      expect(status.totalInProgress).toBeGreaterThan(0);
    });
  });

  describe('getPatientPosition', () => {
    beforeEach(() => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.URGENT);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);
    });

    it('should return patient position in queue', () => {
      const position = queue.getPatientPosition('patient-3');

      expect(position).toBeDefined();
      expect(position?.patientId).toBe('patient-3');
      expect(position?.position).toBeGreaterThan(0);
    });

    it('should calculate patients ahead', () => {
      const position = queue.getPatientPosition('patient-3');

      expect(position?.patientsAhead).toBeGreaterThanOrEqual(0);
    });

    it('should return null for non-existent patient', () => {
      const position = queue.getPatientPosition('patient-999');

      expect(position).toBeNull();
    });
  });

  describe('hasPatient', () => {
    beforeEach(() => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
    });

    it('should return true when patient in queue', () => {
      expect(queue.hasPatient('patient-1')).toBe(true);
    });

    it('should return false when patient not in queue', () => {
      expect(queue.hasPatient('patient-999')).toBe(false);
    });
  });

  describe('Wait time calculation', () => {
    it('should calculate wait time based on queue position', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.NORMAL);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);

      const p3Position = queue.getPatientPosition('patient-3');

      expect(p3Position?.estimatedWaitMinutes).toBeGreaterThan(0);
      // Should be approximately 2 * averageConsultationMinutes (2 patients ahead)
      expect(p3Position?.estimatedWaitMinutes).toBeGreaterThanOrEqual(30);
    });

    it('should account for priority in wait time', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.addPatient('patient-2', 'apt-2', QueuePriority.LOW);
      queue.addPatient('patient-3', 'apt-3', QueuePriority.URGENT);

      const urgentWait = queue.getPatientPosition('patient-3')?.estimatedWaitMinutes;
      const lowWait = queue.getPatientPosition('patient-2')?.estimatedWaitMinutes;

      // URGENT should have less wait than LOW
      expect(urgentWait!).toBeLessThan(lowWait!);
    });
  });

  describe('Domain events', () => {
    it('should emit events for queue operations', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.callNext('nurse-1');
      queue.removePatient('patient-1', 'Left', 'patient-1');

      const events = queue.getUncommittedEvents();

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e instanceof PatientJoinedQueueEvent)).toBe(true);
      expect(events.some(e => e instanceof PatientCalledEvent)).toBe(true);
      expect(events.some(e => e instanceof PatientLeftQueueEvent)).toBe(true);
    });

    it('should clear domain events after retrieval', () => {
      queue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      queue.getUncommittedEvents();

      queue.markEventsAsCommitted();

      expect(queue.getUncommittedEvents()).toHaveLength(0);
    });
  });
});


