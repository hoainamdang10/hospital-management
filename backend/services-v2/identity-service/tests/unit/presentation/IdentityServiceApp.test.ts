const mainModule = jest.requireActual('@/main');
const IdentityServiceApp = mainModule.default;

jest.mock('@/main', () => {
  const originalModule = jest.requireActual('@/main');
  return {
    __esModule: true,
    ...originalModule,
    configureApp: jest.fn(),
    setupRoutes: jest.fn(),
    setupMetrics: jest.fn(),
    setupGracefulShutdown: jest.fn(),
    setupPendingRegistrationCleanup: jest.fn(),
    setupEventConsumer: jest.fn(),
    setupEventPublisher: jest.fn(),
    setupIntegrationReporting: jest.fn()
  };
});

describe('IdentityServiceApp smoke', () => {
  it('khởi tạo ứng dụng và chạy quy trình initialize', async () => {
    const app = new IdentityServiceApp();
    await app['initialize']();

    const mockedModule = require('@/main');
    expect(mockedModule.configureApp).toHaveBeenCalledTimes(1);
    expect(mockedModule.setupRoutes).toHaveBeenCalledTimes(1);
  });
});

