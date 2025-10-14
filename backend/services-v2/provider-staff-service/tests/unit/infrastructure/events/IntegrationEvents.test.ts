/**
 * IntegrationEvents Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import {
  createStaffRegisteredEvent,
  createStaffUpdatedEvent,
  createDoctorAvailabilityChangedEvent,
  createStaffStatusChangedEvent,
  createStaffCredentialAddedEvent,
  createStaffDepartmentAssignedEvent
} from '../../../../src/infrastructure/events/IntegrationEvents';

describe('IntegrationEvents', () => {
  describe('createStaffRegisteredEvent', () => {
    it('should create valid StaffRegistered integration event', () => {
      const event = createStaffRegisteredEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Bác sĩ Nguyễn Văn Test',
        department: 'Khoa Nội',
        specialization: 'Tim mạch',
        licenseNumber: 'BYS-12345',
        registrationDate: '2025-01-10'
      });

      expect(event).toMatchObject({
        eventType: 'provider.staff.registered',
        aggregateId: 'STF-202501-001',
        aggregateType: 'Staff',
        serviceName: 'provider-staff-service'
      });

      expect(event.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Bác sĩ Nguyễn Văn Test',
        department: 'Khoa Nội',
        specialization: 'Tim mạch',
        licenseNumber: 'BYS-12345',
        registrationDate: '2025-01-10'
      });
    });

    it('should include correct metadata', () => {
      const event = createStaffRegisteredEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Test Doctor'
      });

      expect(event.metadata).toMatchObject({
        priority: 'normal',
        complianceLevel: 'hipaa',
        containsPHI: false,
        eventCategory: 'provider_staff',
        eventSubcategory: 'staff_registration',
        vietnameseDescription: 'Nhân viên y tế mới được đăng ký vào hệ thống'
      });
    });

    it('should generate unique event ID', () => {
      const event1 = createStaffRegisteredEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Test Doctor'
      });

      const event2 = createStaffRegisteredEvent({
        staffId: 'STF-202501-002',
        userId: 'user-456',
        staffType: 'nurse',
        fullName: 'Test Nurse'
      });

      expect(event1.eventId).toBeDefined();
      expect(event2.eventId).toBeDefined();
      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt timestamp', () => {
      const before = new Date();
      const event = createStaffRegisteredEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Test Doctor'
      });
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('createStaffUpdatedEvent', () => {
    it('should create valid StaffUpdated integration event', () => {
      const event = createStaffUpdatedEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        updatedFields: ['consultationFee', 'workSchedule'],
        consultationFee: 600000,
        workSchedule: { monday: { start: '08:00', end: '17:00' } },
        status: 'active'
      });

      expect(event).toMatchObject({
        eventType: 'provider.staff.updated',
        aggregateId: 'STF-202501-001',
        aggregateType: 'Staff',
        serviceName: 'provider-staff-service'
      });

      expect(event.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        updatedFields: ['consultationFee', 'workSchedule'],
        consultationFee: 600000
      });
    });

    it('should include metadata with normal priority', () => {
      const event = createStaffUpdatedEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        updatedFields: ['specialization']
      });

      expect(event.metadata).toMatchObject({
        priority: 'normal',
        complianceLevel: 'hipaa',
        containsPHI: false,
        eventCategory: 'provider_staff',
        eventSubcategory: 'staff_update',
        vietnameseDescription: 'Thông tin nhân viên y tế được cập nhật'
      });
    });
  });

  describe('createDoctorAvailabilityChangedEvent', () => {
    it('should create valid DoctorAvailabilityChanged integration event', () => {
      const event = createDoctorAvailabilityChangedEvent({
        staffId: 'STF-202501-001',
        isAcceptingNewPatients: false,
        reason: 'Đang nghỉ phép',
        effectiveDate: '2025-01-15'
      });

      expect(event).toMatchObject({
        eventType: 'provider.doctor.availability.changed',
        aggregateId: 'STF-202501-001',
        aggregateType: 'Staff',
        serviceName: 'provider-staff-service'
      });

      expect(event.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        isAcceptingNewPatients: false,
        reason: 'Đang nghỉ phép',
        effectiveDate: '2025-01-15'
      });
    });

    it('should include metadata with high priority', () => {
      const event = createDoctorAvailabilityChangedEvent({
        staffId: 'STF-202501-001',
        isAcceptingNewPatients: true
      });

      expect(event.metadata).toMatchObject({
        priority: 'high',
        complianceLevel: 'hipaa',
        containsPHI: false,
        eventCategory: 'provider_staff',
        eventSubcategory: 'availability_change',
        vietnameseDescription: 'Trạng thái nhận bệnh nhân của bác sĩ thay đổi'
      });
    });
  });

  describe('createStaffStatusChangedEvent', () => {
    it('should create valid StaffStatusChanged integration event', () => {
      const event = createStaffStatusChangedEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        previousStatus: 'active',
        newStatus: 'inactive',
        reason: 'Nghỉ việc',
        changedBy: 'admin-123'
      });

      expect(event).toMatchObject({
        eventType: 'provider.staff.status.changed',
        aggregateId: 'STF-202501-001',
        aggregateType: 'Staff',
        serviceName: 'provider-staff-service'
      });

      expect(event.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        previousStatus: 'active',
        newStatus: 'inactive',
        reason: 'Nghỉ việc',
        changedBy: 'admin-123'
      });
    });

    it('should include metadata with high priority', () => {
      const event = createStaffStatusChangedEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        previousStatus: 'active',
        newStatus: 'suspended'
      });

      expect(event.metadata.priority).toBe('high');
    });
  });

  describe('createStaffCredentialAddedEvent', () => {
    it('should create valid StaffCredentialAdded integration event', () => {
      const event = createStaffCredentialAddedEvent({
        staffId: 'STF-202501-001',
        credentialType: 'medical_license',
        credentialNumber: 'BYS-12345',
        issuedBy: 'Bộ Y tế',
        issuedDate: '2015-01-01',
        expiryDate: '2025-01-01'
      });

      expect(event).toMatchObject({
        eventType: 'provider.staff.credential.added',
        aggregateId: 'STF-202501-001',
        aggregateType: 'Staff',
        serviceName: 'provider-staff-service'
      });

      expect(event.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        credentialType: 'medical_license',
        credentialNumber: 'BYS-12345',
        issuedBy: 'Bộ Y tế',
        issuedDate: '2015-01-01',
        expiryDate: '2025-01-01'
      });
    });

    it('should include metadata with normal priority', () => {
      const event = createStaffCredentialAddedEvent({
        staffId: 'STF-202501-001',
        credentialType: 'certification',
        credentialNumber: 'CERT-123',
        issuedBy: 'Medical Board',
        issuedDate: '2020-01-01'
      });

      expect(event.metadata).toMatchObject({
        priority: 'normal',
        complianceLevel: 'hipaa',
        containsPHI: false,
        eventCategory: 'provider_staff',
        eventSubcategory: 'credential_management',
        vietnameseDescription: 'Chứng chỉ hành nghề mới được thêm vào'
      });
    });
  });

  describe('createStaffDepartmentAssignedEvent', () => {
    it('should create valid StaffDepartmentAssigned integration event', () => {
      const event = createStaffDepartmentAssignedEvent({
        staffId: 'STF-202501-001',
        departmentId: 'DEPT-001',
        departmentName: 'Khoa Tim mạch',
        role: 'Bác sĩ chính',
        assignedBy: 'admin-123'
      });

      expect(event).toMatchObject({
        eventType: 'provider.staff.department.assigned',
        aggregateId: 'STF-202501-001',
        aggregateType: 'Staff',
        serviceName: 'provider-staff-service'
      });

      expect(event.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        departmentId: 'DEPT-001',
        departmentName: 'Khoa Tim mạch',
        role: 'Bác sĩ chính',
        assignedBy: 'admin-123'
      });
    });

    it('should include metadata with normal priority', () => {
      const event = createStaffDepartmentAssignedEvent({
        staffId: 'STF-202501-001',
        departmentId: 'DEPT-001',
        departmentName: 'Khoa Nội',
        role: 'Bác sĩ',
        assignedBy: 'admin-123'
      });

      expect(event.metadata).toMatchObject({
        priority: 'normal',
        complianceLevel: 'hipaa',
        containsPHI: false,
        eventCategory: 'provider_staff',
        eventSubcategory: 'department_assignment',
        vietnameseDescription: 'Nhân viên được phân công vào khoa'
      });
    });
  });

  describe('Event structure validation', () => {
    it('all events should have required fields', () => {
      const events = [
        createStaffRegisteredEvent({ staffId: 'STF-001', userId: 'user-1', staffType: 'doctor', fullName: 'Test' }),
        createStaffUpdatedEvent({ staffId: 'STF-001', userId: 'user-1', updatedFields: [] }),
        createDoctorAvailabilityChangedEvent({ staffId: 'STF-001', isAcceptingNewPatients: true }),
        createStaffStatusChangedEvent({ staffId: 'STF-001', userId: 'user-1', previousStatus: 'active', newStatus: 'inactive' }),
        createStaffCredentialAddedEvent({ staffId: 'STF-001', credentialType: 'license', credentialNumber: '123', issuedBy: 'Test', issuedDate: '2020-01-01' }),
        createStaffDepartmentAssignedEvent({ staffId: 'STF-001', departmentId: 'DEPT-1', departmentName: 'Test', role: 'Doctor', assignedBy: 'admin' })
      ];

      events.forEach(event => {
        expect(event).toHaveProperty('eventId');
        expect(event).toHaveProperty('eventType');
        expect(event).toHaveProperty('aggregateId');
        expect(event).toHaveProperty('aggregateType');
        expect(event).toHaveProperty('occurredAt');
        expect(event).toHaveProperty('serviceName');
        expect(event).toHaveProperty('eventData');
        expect(event).toHaveProperty('metadata');
      });
    });

    it('all events should have HIPAA compliance metadata', () => {
      const events = [
        createStaffRegisteredEvent({ staffId: 'STF-001', userId: 'user-1', staffType: 'doctor', fullName: 'Test' }),
        createStaffUpdatedEvent({ staffId: 'STF-001', userId: 'user-1', updatedFields: [] }),
        createDoctorAvailabilityChangedEvent({ staffId: 'STF-001', isAcceptingNewPatients: true }),
        createStaffStatusChangedEvent({ staffId: 'STF-001', userId: 'user-1', previousStatus: 'active', newStatus: 'inactive' }),
        createStaffCredentialAddedEvent({ staffId: 'STF-001', credentialType: 'license', credentialNumber: '123', issuedBy: 'Test', issuedDate: '2020-01-01' }),
        createStaffDepartmentAssignedEvent({ staffId: 'STF-001', departmentId: 'DEPT-1', departmentName: 'Test', role: 'Doctor', assignedBy: 'admin' })
      ];

      events.forEach(event => {
        expect(event.metadata).toHaveProperty('complianceLevel', 'hipaa');
        expect(event.metadata).toHaveProperty('containsPHI');
        expect(event.metadata).toHaveProperty('vietnameseDescription');
      });
    });
  });
});

