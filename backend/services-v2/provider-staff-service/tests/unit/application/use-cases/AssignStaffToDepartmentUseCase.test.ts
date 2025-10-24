/**
 * AssignStaffToDepartmentUseCase Unit Tests (v2 alignment)
 */

import {
  AssignStaffToDepartmentRequest,
  AssignStaffToDepartmentUseCase
} from '../../../../src/application/use-cases/AssignStaffToDepartmentUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { IAuditService } from '../../../../src/application/interfaces/IAuditService';
import { createTestStaff } from '../../../helpers/mockFactories';

describe('AssignStaffToDepartmentUseCase', () => {
  let repository: jest.Mocked<IProviderStaffRepository>;
  let logger: jest.Mocked<ILogger>;
  let auditService: jest.Mocked<IAuditService>;
  let useCase: AssignStaffToDepartmentUseCase;

  const baseRequest: AssignStaffToDepartmentRequest = {
    staffId: 'DOC-CARD-202501-001',
    departmentId: 'f10ee789-ddec-4592-8d03-1161a3c3f4ed',
    departmentName: 'Khoa Tim mạch',
    role: 'Bác sĩ chính',
    isPrimary: true,
    assignedBy: 'admin-001',
    assignedByRole: 'ADMIN'
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      update: jest.fn()
    } as unknown as jest.Mocked<IProviderStaffRepository>;

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<ILogger>;

    auditService = {
      logAction: jest.fn()
    } as any;

    useCase = new AssignStaffToDepartmentUseCase(repository, logger, auditService);
  });

  it('assigns staff to department when request is valid', async () => {
    const staff = createTestStaff({
      staffId: baseRequest.staffId,
      department: 'Khoa Tim mạch'
    });
    const assignSpy = jest.spyOn(staff, 'assignToDepartment');

    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.data?.staffId).toBe('aggregate-staff-test');
    expect(assignSpy).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith(staff);
    expect(auditService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ASSIGN_STAFF_TO_DEPARTMENT',
        entityId: 'aggregate-staff-test'
      })
    );
  });

  it('returns validation errors when mandatory fields are missing', async () => {
    const invalidRequest: AssignStaffToDepartmentRequest = {
      ...baseRequest,
      departmentName: '',
      role: '',
      assignedByRole: 'DOCTOR'
    };

    const result = await useCase.execute(invalidRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Tên khoa/phòng ban không được để trống',
        'Vai trò trong khoa/phòng ban không được để trống',
        'Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền phân công nhân viên'
      ])
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns failure when staff cannot be found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('STAFF_NOT_FOUND');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('prevents assignment when staff is inactive', async () => {
    const inactiveStaff = createTestStaff({
      staffId: baseRequest.staffId,
      status: 'inactive'
    });
    repository.findById.mockResolvedValue(inactiveStaff);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('STAFF_INACTIVE');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('logs and returns failure when repository update throws', async () => {
    const staff = createTestStaff({
      staffId: baseRequest.staffId
    });
    repository.findById.mockResolvedValue(staff);
    repository.update.mockRejectedValue(new Error('db-error'));

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('db-error');
    expect(logger.error).toHaveBeenCalledWith(
      'Error assigning staff to department',
      expect.objectContaining({
        departmentId: baseRequest.departmentId
      })
    );
  });
});
