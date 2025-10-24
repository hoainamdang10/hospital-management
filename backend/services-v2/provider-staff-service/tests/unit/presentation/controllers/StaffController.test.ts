import { StaffController } from '@presentation/controllers/StaffController';
import { ResponseHelper, NotFoundError } from '@presentation/middleware/ErrorHandlingMiddleware';
import { createMockLogger } from '@tests/helpers/mockFactories';

const createUseCaseMock = () => ({ execute: jest.fn() });

const buildController = () => {
  const logger = createMockLogger();
  const registerStaffUseCase = createUseCaseMock();
  const getStaffProfileUseCase = createUseCaseMock();
  const assignStaffToDepartmentUseCase = createUseCaseMock();
  const staffCommandHandlers = {} as any;
  const staffQueryHandlers = {} as any;
  const addStaffCredentialUseCase = createUseCaseMock();
  const removeStaffCredentialUseCase = createUseCaseMock();
  const renewStaffCredentialUseCase = createUseCaseMock();
  const getExpiringCredentialsUseCase = createUseCaseMock();
  const activateStaffUseCase = createUseCaseMock();
  const suspendStaffUseCase = createUseCaseMock();
  const reactivateStaffUseCase = createUseCaseMock();
  const terminateStaffUseCase = createUseCaseMock();
  const updateEmploymentStatusUseCase = createUseCaseMock();
  const updateStaffScheduleUseCase = createUseCaseMock();
  const getStaffSpecializationsUseCase = createUseCaseMock();
  const addStaffSpecializationUseCase = createUseCaseMock();
  const removeStaffSpecializationUseCase = createUseCaseMock();

  const controller = new StaffController(
    logger,
    registerStaffUseCase as any,
    getStaffProfileUseCase as any,
    assignStaffToDepartmentUseCase as any,
    staffCommandHandlers,
    staffQueryHandlers,
    addStaffCredentialUseCase as any,
    removeStaffCredentialUseCase as any,
    renewStaffCredentialUseCase as any,
    getExpiringCredentialsUseCase as any,
    activateStaffUseCase as any,
    suspendStaffUseCase as any,
    reactivateStaffUseCase as any,
    terminateStaffUseCase as any,
    updateEmploymentStatusUseCase as any,
    updateStaffScheduleUseCase as any,
    getStaffSpecializationsUseCase as any,
    addStaffSpecializationUseCase as any,
    removeStaffSpecializationUseCase as any
  );

  return {
    controller,
    logger,
    registerStaffUseCase,
    getStaffProfileUseCase
  };
};

const createRequest = (overrides: any = {}) => ({
  body: overrides.body || {},
  params: overrides.params || {},
  headers: overrides.headers || {},
  ip: overrides.ip || '127.0.0.1',
  get: jest.fn().mockReturnValue('jest-test-agent'),
  user: overrides.user || { id: 'user-test', role: 'admin', roles: ['admin'] }
});

const createResponse = () =>
  ({} as any);

describe('StaffController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registerStaff trả về 201 khi use case thành công', async () => {
    const { controller, registerStaffUseCase } = buildController();
    registerStaffUseCase.execute.mockResolvedValue({
      success: true,
      staffId: 'STF-001',
      message: 'Đăng ký thành công',
      data: { staff: { staffId: 'STF-001' } }
    });

    const createdSpy = jest.spyOn(ResponseHelper, 'created').mockImplementation(() => undefined);

    const req = createRequest({
      body: {
        userId: 'user-001',
        staffType: 'doctor'
      },
      headers: {
        'x-session-id': 'session-1'
      },
      user: { id: 'admin-1', role: 'admin', roles: ['admin'] }
    });
    const res = createResponse();

    await controller.registerStaff(req as any, res);

    expect(registerStaffUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
        requestedBy: 'admin-1',
        requestMetadata: expect.objectContaining({
          ipAddress: '127.0.0.1',
          userAgent: 'jest-test-agent',
          sessionId: 'session-1'
        })
      })
    );
    expect(createdSpy).toHaveBeenCalledWith(
      res,
      { staff: { staffId: 'STF-001' } },
      'Đăng ký thành công'
    );
  });

  it('registerStaff trả về badRequest khi use case thất bại', async () => {
    const { controller, registerStaffUseCase, logger } = buildController();
    registerStaffUseCase.execute.mockResolvedValue({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: ['Lỗi'],
      data: undefined
    });

    const badRequestSpy = jest.spyOn(ResponseHelper, 'badRequest').mockImplementation(() => undefined as any);

    const req = createRequest({
      body: { userId: 'user-002', staffType: 'nurse' }
    });
    const res = createResponse();

    await controller.registerStaff(req as any, res);

    expect(badRequestSpy).toHaveBeenCalledWith(res, 'Dữ liệu không hợp lệ', ['Lỗi']);
    expect(logger.warn).toHaveBeenCalledWith(
      'Staff registration validation failed',
      expect.objectContaining({ message: 'Dữ liệu không hợp lệ' })
    );
  });

  it('getStaffById trả về dữ liệu khi tìm thấy', async () => {
    const { controller, getStaffProfileUseCase } = buildController();
    getStaffProfileUseCase.execute.mockResolvedValue({
      success: true,
      data: { staff: { staffId: 'STF-123', fullName: 'Bác sĩ Test' } }
    });

    const successSpy = jest.spyOn(ResponseHelper, 'success').mockImplementation(() => undefined);

    const req = createRequest({
      params: { staffId: 'STF-123' },
      user: { id: 'admin-1', role: 'admin', roles: ['admin'] }
    });
    const res = createResponse();

    await controller.getStaffById(req as any, res);

    expect(getStaffProfileUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        staffId: 'STF-123',
        requestedBy: 'admin-1',
        requestedByRole: 'admin',
        includeFullSchedule: true,
        includeSensitiveInfo: true
      })
    );
    expect(successSpy).toHaveBeenCalledWith(
      res,
      { staffId: 'STF-123', fullName: 'Bác sĩ Test' }
    );
  });

  it('getStaffById ném NotFoundError khi không tìm thấy', async () => {
    const { controller, getStaffProfileUseCase } = buildController();
    getStaffProfileUseCase.execute.mockResolvedValue({
      success: false
    });

    const req = createRequest({
      params: { staffId: 'STF-999' }
    });
    const res = createResponse();

    await expect(controller.getStaffById(req as any, res)).rejects.toBeInstanceOf(NotFoundError);
  });
});
