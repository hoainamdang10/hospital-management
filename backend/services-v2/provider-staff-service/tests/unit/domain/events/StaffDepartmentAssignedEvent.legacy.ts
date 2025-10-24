/**
 * StaffDepartmentAssignedEvent Tests
 * @version 2.0.0
 */

import { StaffDepartmentAssignedEvent } from '../../../../src/domain/events/StaffDepartmentAssignedEvent';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';
import { DepartmentAssignment } from '../../../../src/domain/entities/DepartmentAssignment';

describe('StaffDepartmentAssignedEvent', () => {
  let staffId: StaffId;
  let departmentAssignment: DepartmentAssignment;

  beforeEach(() => {
    staffId = StaffId.create('DOC-CARD-202410-001');
    
    departmentAssignment = DepartmentAssignment.create({
      departmentId: 'dept-card-001',
      departmentCode: 'CARD',
      departmentNameEn: 'Cardiology Department',
      departmentNameVi: 'Khoa Tim mạch',
      isPrimary: true,
      startDate: new Date('2024-01-01'),
      role: 'Bác sĩ điều trị',
      isActive: true
    });
  });

  describe('creation', () => {
    it('should create event with valid data', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event).toBeInstanceOf(StaffDepartmentAssignedEvent);
      expect(event.eventType).toBe('StaffDepartmentAssigned');
      expect(event.aggregateType).toBe('ProviderStaff');
      expect(event.eventVersion).toBe(1);
    });

    it('should include staff ID in event', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event.staffId.value).toBe('DOC-CARD-202410-001');
      expect(event.aggregateId).toBe('DOC-CARD-202410-001');
    });

    it('should include department assignment details', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event.assignment).toBe(departmentAssignment);
      expect(event.assignment.departmentNameVi).toBe('Khoa Tim mạch');
      expect(event.assignment.isPrimary).toBe(true);
    });

    it('should include correlation ID when provided', () => {
      const correlationId = 'corr-123';
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment,
        correlationId
      );

      expect(event.correlationId).toBe(correlationId);
    });

    it('should include causation ID when provided', () => {
      const correlationId = 'corr-123';
      const causationId = 'cause-456';
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment,
        correlationId,
        causationId
      );

      expect(event.causationId).toBe(causationId);
    });

    it('should include user ID when provided', () => {
      const userId = 'user-admin-001';
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment,
        undefined,
        undefined,
        userId
      );

      expect(event.userId).toBe(userId);
    });
  });

  describe('getEventData', () => {
    it('should return event data with all required fields', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      const eventData = event.getEventData();

      expect(eventData).toHaveProperty('staffId');
      expect(eventData).toHaveProperty('assignment');
      expect(eventData).toHaveProperty('occurredAt');
      expect(eventData.staffId).toBe('DOC-CARD-202410-001');
    });

    it('should serialize assignment to persistence format', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      const eventData = event.getEventData();

      expect(eventData.assignment).toHaveProperty('id');
      expect(eventData.assignment).toHaveProperty('departmentId');
      expect(eventData.assignment).toHaveProperty('departmentNameEn');
      expect(eventData.assignment).toHaveProperty('departmentNameVi');
      expect(eventData.assignment).toHaveProperty('isPrimary');
      expect(eventData.assignment).toHaveProperty('startDate');
      expect(eventData.assignment).toHaveProperty('role');
    });

    it('should include ISO formatted timestamp', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      const eventData = event.getEventData();

      expect(eventData.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('containsPHI', () => {
    it('should return false as department assignment is not PHI', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null as event is not patient-related', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event.getPatientId()).toBeNull();
    });
  });

  describe('event metadata', () => {
    it('should have correct event type', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event.eventType).toBe('StaffDepartmentAssigned');
    });

    it('should have correct aggregate type', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event.aggregateType).toBe('ProviderStaff');
    });

    it('should have version number', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event.eventVersion).toBe(1);
    });

    it('should have event ID', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      const json = event.toJSON();
      expect(json.eventId).toBeDefined();
      expect(typeof json.eventId).toBe('string');
    });

    it('should have occurred at timestamp', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      const json = event.toJSON();
      expect(json.occurredAt).toBeDefined();
      expect(new Date(json.occurredAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Vietnamese healthcare context', () => {
    it('should handle Vietnamese department names', () => {
      const vietnameseDept = DepartmentAssignment.create({
        departmentId: 'dept-ortho-001',
        departmentCode: 'ORTHO',
        departmentNameEn: 'Orthopedic Department',
        departmentNameVi: 'Khoa Chấn thương Chỉnh hình',
        isPrimary: false,
        startDate: new Date('2024-01-01'),
        role: 'Phó khoa',
        isActive: true
      });

      const event = new StaffDepartmentAssignedEvent(
        staffId,
        vietnameseDept
      );

      const eventData = event.getEventData();
      expect(eventData.assignment.departmentNameVi).toBe('Khoa Chấn thương Chỉnh hình');
    });

    it('should handle Vietnamese role names', () => {
      const vietnameseRole = DepartmentAssignment.create({
        departmentId: 'dept-pedi-001',
        departmentCode: 'PEDI',
        departmentNameEn: 'Pediatrics Department',
        departmentNameVi: 'Khoa Nhi',
        isPrimary: true,
        startDate: new Date('2024-01-01'),
        role: 'Trưởng khoa',
        isActive: true
      });

      const event = new StaffDepartmentAssignedEvent(
        staffId,
        vietnameseRole
      );

      const eventData = event.getEventData();
      expect(eventData.assignment.role).toBe('Trưởng khoa');
    });
  });

  describe('assignment scenarios', () => {
    it('should handle primary department assignment', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      expect(event.assignment.isPrimary).toBe(true);
    });

    it('should handle secondary department assignment', () => {
      const secondaryDept = DepartmentAssignment.create({
        departmentId: 'dept-er-001',
        departmentCode: 'ER',
        departmentNameEn: 'Emergency Room',
        departmentNameVi: 'Khoa Cấp cứu',
        isPrimary: false,
        startDate: new Date('2024-01-01'),
        role: 'Bác sĩ hỗ trợ',
        isActive: true
      });

      const event = new StaffDepartmentAssignedEvent(
        staffId,
        secondaryDept
      );

      expect(event.assignment.isPrimary).toBe(false);
    });

    it('should include assignment start date', () => {
      const event = new StaffDepartmentAssignedEvent(
        staffId,
        departmentAssignment
      );

      const eventData = event.getEventData();
      expect(eventData.assignment.startDate).toBeDefined();
    });
  });
});
