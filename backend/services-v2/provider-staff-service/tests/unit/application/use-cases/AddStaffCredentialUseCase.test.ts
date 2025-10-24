/**
 * AddStaffCredentialUseCase Unit Tests (v2 alignment)
 */

import {
  AddStaffCredentialRequest,
  AddStaffCredentialUseCase
} from '../../../../src/application/use-cases/AddStaffCredentialUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { createTestStaff } from '../../../helpers/mockFactories';

describe('AddStaffCredentialUseCase', () => {
  let repository: jest.Mocked<IProviderStaffRepository>;
  let logger: jest.Mocked<ILogger>;
  let useCase: AddStaffCredentialUseCase;

  const baseRequest: AddStaffCredentialRequest = {
    staffId: 'DOC-CARD-202501-001',
    credentialNumber: 'BYS-12345',
    credentialType: 'license',
    issuingAuthority: 'Bộ Y tế Việt Nam',
    issueDate: '2020-01-01',
    expiryDate: '2025-01-01',
    requestedBy: 'admin-001',
    requestedByRole: 'ADMIN'
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

    useCase = new AddStaffCredentialUseCase(repository, logger);
  });

  it('adds a credential when request is valid and staff is active', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      staffId: staff.id,
      credentialNumber: baseRequest.credentialNumber,
      credentialType: baseRequest.credentialType
    });
    expect(repository.update).toHaveBeenCalledWith(staff);
    expect(logger.info).toHaveBeenCalledWith(
      'HIPAA Audit: Staff credential added',
      expect.objectContaining({
        staffId: baseRequest.staffId,
        credentialType: baseRequest.credentialType
      })
    );
  });

  it('returns validation errors for invalid payload', async () => {
    const invalidRequest: AddStaffCredentialRequest = {
      ...baseRequest,
      credentialNumber: '',
      credentialType: 'unknown' as any,
      issuingAuthority: '',
      issueDate: ''
    };

    const result = await useCase.execute(invalidRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Số chứng chỉ không được để trống',
        'Loại chứng chỉ không hợp lệ (license, certificate, registration)',
        'Cơ quan cấp không được để trống',
        'Ngày cấp không được để trống'
      ])
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns failure when staff cannot be found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('STAFF_NOT_FOUND');
  });

  it('returns failure when staff is inactive', async () => {
    const inactiveStaff = createTestStaff({ staffId: baseRequest.staffId, status: 'inactive' });
    repository.findById.mockResolvedValue(inactiveStaff);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('STAFF_INACTIVE');
  });

  it('propagates repository errors through failure response', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.update.mockRejectedValue(new Error('Database error'));

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Database error');
    expect(result.errors).toContain('ADD_CREDENTIAL_FAILED');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to add staff credential',
      expect.objectContaining({
        staffId: baseRequest.staffId
      })
    );
  });
});
