/**
 * RegisterUserUseCase - Unit Tests
 *
 * Cover tất cả kịch bản đăng ký người dùng:
 * - Happy path
 * - Validation
 * - Business rules (email trùng)
 * - Error handling & circuit breaker
 */

import { RegisterUserUseCase, RegisterUserRequest } from '../../../../src/application/use-cases/RegisterUserUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { IPermissionRepository } from '../../../../src/domain/repositories/IPermissionRepository';
import { Email } from '../../../../src/domain/value-objects/Email';
import { createMockUser } from '../../../helpers/user-test-helper';
import { CircuitBreakerFactory } from '../../../../src/infrastructure/resilience/CircuitBreaker';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPermissionRepository: jest.Mocked<IPermissionRepository>;
  let mockLogger: any;
  let circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case-test');

  const validRequest: RegisterUserRequest = {
    email: 'test@example.com',
    password: 'SecurePass123!',
    fullName: 'Nguyễn Văn Test',
    roleType: 'patient',
    phoneNumber: '0912345678',
    citizenId: '001234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    address: '123 Test Street, HCM'
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      count: jest.fn(),
      createAuthUser: jest.fn()
    } as unknown as jest.Mocked<IUserRepository>;

    mockPermissionRepository = {
      getAllRoles: jest.fn().mockResolvedValue(['admin', 'doctor', 'nurse', 'receptionist', 'patient'])
    } as unknown as jest.Mocked<IPermissionRepository>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case-test');
    circuitBreaker.reset();

    useCase = new RegisterUserUseCase(
      mockUserRepository,
      mockPermissionRepository,
      mockLogger,
      circuitBreaker
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    CircuitBreakerFactory.getBreaker('register-user-use-case-test').reset();
  });

  describe('Happy Path', () => {
    it('should register user with full data', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const createdUser = createMockUser({ userId: 'user-123', email: validRequest.email });
      mockUserRepository.createAuthUser.mockResolvedValue(createdUser);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(createdUser.id);
      expect(result.email).toBe(createdUser.email.value);
      expect(result.requiresEmailVerification).toBe(true);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(Email.create(validRequest.email));
      expect(mockUserRepository.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: validRequest.email, password: validRequest.password })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User registration completed successfully',
        expect.objectContaining({ userId: createdUser.id, email: validRequest.email })
      );
    });

    it('should register user with minimal fields', async () => {
      const minimalRequest: RegisterUserRequest = {
        email: 'minimal@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
        roleType: 'patient'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createAuthUser.mockResolvedValue(
        createMockUser({ userId: 'user-456', email: minimalRequest.email })
      );

      const result = await useCase.execute(minimalRequest);

      expect(result.success).toBe(true);
      expect(mockUserRepository.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: minimalRequest.email, fullName: minimalRequest.fullName })
      );
    });
  });

  describe('Validation', () => {
    const invalidRequests: Array<{ label: string; request: Partial<RegisterUserRequest>; message: string }> = [
      { label: 'invalid email', request: { ...validRequest, email: 'invalid-email' }, message: 'Email không hợp lệ' },
      { label: 'short password', request: { ...validRequest, password: '1234567' }, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
      { label: 'short name', request: { ...validRequest, fullName: 'A' }, message: 'Họ tên phải có ít nhất 2 ký tự' },
      { label: 'invalid role', request: { ...validRequest, roleType: 'invalid' }, message: 'Vai trò không hợp lệ' },
      { label: 'invalid phone', request: { ...validRequest, phoneNumber: 'abc' }, message: 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)' },
      { label: 'invalid citizenId', request: { ...validRequest, citizenId: 'abc' }, message: 'Số CMND/CCCD không hợp lệ (phải có 9-12 chữ số)' }
    ];

    it.each(invalidRequests)('should reject $label', async ({ request, message }) => {
      const result = await useCase.execute(request as RegisterUserRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toContain(message); // Use toContain instead of toBe for detailed error messages
      expect(mockUserRepository.createAuthUser).not.toHaveBeenCalled();
    });
  });

  describe('Business rules', () => {
    it('should reject duplicate email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(createMockUser({ email: validRequest.email }));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_ALREADY_EXISTS');
      expect(mockLogger.warn).toHaveBeenCalledWith('User already exists', { email: validRequest.email });
      expect(mockUserRepository.createAuthUser).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createAuthUser.mockRejectedValue(new Error('Database failure'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('REGISTRATION_FAILED');
      expect(result.message).toBe('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin và thử lại.');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'User registration failed',
        expect.objectContaining({ email: validRequest.email, error: 'Database failure' })
      );
    });
  });

  describe('Circuit breaker', () => {
    it('should return SERVICE_UNAVAILABLE when circuit open', async () => {
      jest.spyOn(useCase as any, 'executeImpl').mockRejectedValue(new Error('DB down'));

      for (let i = 0; i < 5; i++) {
        await useCase.execute(validRequest);
      }

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
      expect(mockLogger.error).toHaveBeenCalledWith('Circuit breaker open for RegisterUserUseCase');
    });
  });

  describe('Logging', () => {
    it('should log registration start', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createAuthUser.mockResolvedValue(createMockUser());

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting user registration',
        expect.objectContaining({ email: validRequest.email, roleType: validRequest.roleType })
      );
    });
  });
});
