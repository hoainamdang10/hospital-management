const loggerMock = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn()
};

jest.mock('@/infrastructure/logging/logger', () => ({
  logger: loggerMock
}));

import { setupDependencies, ServiceTokens } from '@/infrastructure/di/setup';
import ProviderStaffServiceApp from '@/main';

jest.mock('@/infrastructure/di/setup', () => {
  const actual = jest.requireActual('@/infrastructure/di/setup');
  return {
    ...actual,
    setupDependencies: jest.fn()
  };
});

jest.mock('@/infrastructure/events/RabbitMQEventPublisher', () => ({
  RabbitMQEventPublisher: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }))
}));

const mockHealthCheck = {
  checkHealth: jest.fn().mockResolvedValue({ overall: 'HEALTHY' })
};

jest.mock('@/infrastructure/monitoring/HealthChecks', () => ({
  ProviderStaffHealthCheck: jest.fn().mockImplementation(() => mockHealthCheck)
}));

jest.mock('@/presentation/routes', () => ({
  setupRoutes: jest.fn()
}));

describe('ProviderStaffServiceApp (smoke)', () => {
  const setupDependenciesMock = setupDependencies as jest.Mock;

  const buildContainer = () => {
    const eventBus = {
      subscribe: jest.fn().mockResolvedValue(undefined)
    };

    const useCaseStub = () => ({ execute: jest.fn() });

    const dependencyMap = new Map<any, any>([
      [ServiceTokens.EVENT_BUS, eventBus],
      [ServiceTokens.REVIEW_EVENT_HANDLER, { handleReviewCreated: jest.fn(), handleReviewUpdated: jest.fn(), handleReviewDeleted: jest.fn(), handleStaffRatingRecalculated: jest.fn() }],
      [ServiceTokens.BILLING_EVENT_HANDLER, { handlePaymentProcessed: jest.fn(), handleInvoiceGenerated: jest.fn(), handleConsultationFeeUpdated: jest.fn(), handlePaymentRefunded: jest.fn() }],
      [ServiceTokens.STAFF_COMMAND_HANDLERS, { handleCommand: jest.fn() }],
      [ServiceTokens.STAFF_QUERY_HANDLERS, { handleQuery: jest.fn() }]
    ]);

    const useCaseTokens = [
      ServiceTokens.REGISTER_STAFF_USE_CASE,
      ServiceTokens.GET_STAFF_PROFILE_USE_CASE,
      ServiceTokens.ASSIGN_STAFF_TO_DEPARTMENT_USE_CASE,
      ServiceTokens.ADD_STAFF_CREDENTIAL_USE_CASE,
      ServiceTokens.REMOVE_STAFF_CREDENTIAL_USE_CASE,
      ServiceTokens.RENEW_STAFF_CREDENTIAL_USE_CASE,
      ServiceTokens.GET_EXPIRING_CREDENTIALS_USE_CASE,
      ServiceTokens.ACTIVATE_STAFF_USE_CASE,
      ServiceTokens.SUSPEND_STAFF_USE_CASE,
      ServiceTokens.REACTIVATE_STAFF_USE_CASE,
      ServiceTokens.TERMINATE_STAFF_USE_CASE,
      ServiceTokens.UPDATE_EMPLOYMENT_STATUS_USE_CASE,
      ServiceTokens.UPDATE_STAFF_SCHEDULE_USE_CASE,
      ServiceTokens.GET_STAFF_SPECIALIZATIONS_USE_CASE,
      ServiceTokens.ADD_STAFF_SPECIALIZATION_USE_CASE,
      ServiceTokens.REMOVE_STAFF_SPECIALIZATION_USE_CASE
    ];

    useCaseTokens.forEach((token) => {
      dependencyMap.set(token, useCaseStub());
    });

    const resolve = jest.fn((token: any) => {
      if (!dependencyMap.has(token)) {
        return {};
      }
      return dependencyMap.get(token);
    });

    return {
      resolve,
      __eventBus: eventBus
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupDependenciesMock.mockReturnValue(buildContainer());
  });

  it('khởi tạo ứng dụng và đăng ký route thành công', async () => {
    const { setupRoutes } = require('@/presentation/routes');
    const app = new ProviderStaffServiceApp();

    await app.initialize();

    expect(setupDependenciesMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith('Routes setup complete');
    expect((setupRoutes as jest.Mock)).toHaveBeenCalled();
  });

});
