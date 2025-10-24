import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { Specialization } from '../../../../src/domain/entities/Specialization';
import { DepartmentAssignment } from '../../../../src/domain/entities/DepartmentAssignment';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';

const buildPersonalInfo = () =>
  PersonalInfo.create({
    fullName: 'Bác sĩ Nguyễn Văn A',
    dateOfBirth: new Date('1985-01-01'),
    gender: 'male',
    nationalId: '012345678901',
    nationality: 'Vietnam',
    phoneNumber: '0901234567',
    email: 'doctor@example.com',
    address: {
      street: '123 Đường ABC',
      ward: 'Phường 1',
      district: 'Quận 1',
      city: 'Hồ Chí Minh',
      province: 'Hồ Chí Minh',
      country: 'Vietnam'
    }
  });

const buildProfessionalInfo = () =>
  ProfessionalInfo.create({
    title: 'Bác sĩ',
    department: 'Khoa Tim mạch',
    position: 'Trưởng khoa',
    education: ['Đại học Y Hà Nội'],
    languages: ['Vietnamese', 'English']
  });

const buildWorkSchedule = () =>
  WorkSchedule.create({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: { start: '08:00', end: '17:00' },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  });

const buildSpecializations = () => [
  Specialization.create({
    code: 'CARD',
    name: 'Tim mạch',
    description: 'Chuyên khoa tim mạch',
    isActive: true
  })
];

describe('ProviderStaff Aggregate', () => {
  const baseProps = {
    userId: 'user-123',
    staffType: 'doctor' as const,
    licenseNumber: 'BYS-12345',
    employmentType: 'full_time' as const,
    hireDate: new Date('2020-01-01'),
    yearsOfExperience: 10,
    vietnameseHealthcareLicense: 'VN-MOH-123456',
    mohRegistrationNumber: 'MOH-REG-2024-001'
  };

  function createDoctor() {
    return ProviderStaff.create(
      baseProps.userId,
      baseProps.staffType,
      buildPersonalInfo(),
      buildProfessionalInfo(),
      buildWorkSchedule(),
      baseProps.licenseNumber,
      baseProps.employmentType,
      baseProps.hireDate,
      baseProps.yearsOfExperience,
      buildSpecializations(),
      baseProps.vietnameseHealthcareLicense,
      baseProps.mohRegistrationNumber
    );
  }

  it('creates a compliant doctor and emits StaffRegistered event', () => {
    const staff = createDoctor();

    expect(staff.staffType).toBe('doctor');
    expect(staff.isActive).toBe(true);
    expect(staff.staffIdValue).toMatch(/^(DOC|NUR|TEC|PHA|THE|ADM|REC)-[A-Z]{3,5}-\d{6}-\d{3}$/);
    expect(staff.isVietnameseHealthcareCompliant()).toBe(true);

    const events = staff.getUncommittedEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].eventType).toBe('StaffRegistered');
  });

  it('emits StaffStatusChanged event when suspended', () => {
    const staff = createDoctor();
    staff.markEventsAsCommitted();

    staff.suspend('Đi công tác dài hạn', 'admin-001');

    expect(staff.status).toBe('suspended');
    expect(staff.isActive).toBe(false);

    const events = staff.getUncommittedEvents();
    expect(events.some(event => event.eventType === 'StaffStatusChanged')).toBe(true);
  });

  it('replaces department assignment and emits StaffDepartmentAssigned event', () => {
    const staff = createDoctor();
    staff.markEventsAsCommitted();

    const firstAssignment = DepartmentAssignment.create({
      departmentId: 'f10ee789-ddec-4592-8d03-1161a3c3f4ed',
      departmentCode: 'CARD',
      departmentNameEn: 'Cardiology',
      departmentNameVi: 'Tim mạch',
      role: 'Bác sĩ chính',
      isPrimary: true,
      startDate: new Date('2024-01-01'),
      isActive: true
    });

    const secondAssignment = DepartmentAssignment.create({
      departmentId: 'f10ee789-ddec-4592-8d03-1161a3c3f4ed',
      departmentCode: 'CARD',
      departmentNameEn: 'Cardiology',
      departmentNameVi: 'Tim mạch',
      role: 'Trưởng khoa',
      isPrimary: true,
      startDate: new Date('2024-06-01'),
      isActive: true
    });

    staff.assignToDepartment(firstAssignment);
    staff.markEventsAsCommitted();

    staff.assignToDepartment(secondAssignment);

    const assignments = staff.getCurrentDepartmentAssignments();
    expect(assignments).toHaveLength(1);
    expect(assignments[0].role).toBe('Trưởng khoa');

    const events = staff.getUncommittedEvents();
    expect(events.some(event => event.eventType === 'StaffDepartmentAssigned')).toBe(true);
    expect((events.find(event => event.eventType === 'StaffDepartmentAssigned')?.aggregateId))
      .toBe(StaffId.fromString(staff.staffIdValue).value);
  });
});
