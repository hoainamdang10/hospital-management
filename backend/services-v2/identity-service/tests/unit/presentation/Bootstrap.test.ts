import type { RequestHandler } from 'express';

jest.mock('yamljs', () => ({
  load: jest.fn(() => ({})),
}));

jest.mock('swagger-ui-express', () => ({
  serve: jest.fn(),
  setup: jest.fn(() => jest.fn()),
}));

jest.mock('@infrastructure/monitoring/PrometheusMetrics', () => ({
  prometheusMetrics: {
    getMetrics: jest.fn().mockResolvedValue('# HELP identity_service 1'),
  },
}));

const bootstrapMocks = (() => {
  const loadConfig = jest.fn();
  const validateConfig = jest.fn();
  const createLogger = jest.fn();
  const buildContainer = jest.fn();
  const buildExpressApp = jest.fn();
  const registerErrorHandlers = jest.fn();
  const startServer = jest.fn();
  const setupGracefulShutdown = jest.fn();
  const createCleanupFunction = jest.fn();
  const createMetricsAuth = jest.fn();

  return {
    loadConfig,
    validateConfig,
    createLogger,
    buildContainer,
    buildExpressApp,
    registerErrorHandlers,
    startServer,
    setupGracefulShutdown,
    createCleanupFunction,
    createMetricsAuth,
  };
})();

jest.mock('@/bootstrap', () => ({
  __esModule: true,
  ...bootstrapMocks,
  ValidationMode: {
    STRICT: 'STRICT',
    DEVELOPMENT: 'DEVELOPMENT',
  },
}));

jest.mock('@/presentation/routes', () => ({
  registerRoutes: jest.fn(),
}));

const bootstrapModule = require('@/bootstrap');
const routesModule = require('@/presentation/routes');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const { prometheusMetrics } = require('@infrastructure/monitoring/PrometheusMetrics');

describe('bootstrap()', () => {
  let bootstrap: () => Promise<void>;
  let defaultExport: unknown;

  let loggerMock: any;
  let appMock: { get: jest.Mock; use: jest.Mock };
  let containerMock: any;
  let cleanupMock: jest.Mock;
  let serverMock: any;
  let metricsAuthMock: RequestHandler;

  beforeAll(() => {
    // Require main module once after mocks are registered
    const mainModule = require('@/main');
    bootstrap = mainModule.bootstrap;
    defaultExport = mainModule.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    appMock = {
      get: jest.fn(),
      use: jest.fn(),
    };

    cleanupMock = jest.fn();
    serverMock = { close: jest.fn() };
    metricsAuthMock = jest.fn((_req, _res, next) => next && next());

    containerMock = {
      cache: {},
      getRouteDependencies: jest.fn().mockReturnValue({}),
      startEventConsumers: jest.fn().mockResolvedValue(undefined),
      stopEventConsumers: jest.fn().mockResolvedValue(undefined),
      cleanup: jest.fn().mockResolvedValue(undefined),
    };

    bootstrapModule.loadConfig.mockReturnValue({
      nodeEnv: 'test',
      port: 4000,
    });

    bootstrapModule.validateConfig.mockImplementation(() => undefined);
    bootstrapModule.createLogger.mockReturnValue(loggerMock);
    bootstrapModule.buildContainer.mockResolvedValue(containerMock);
    bootstrapModule.buildExpressApp.mockReturnValue(appMock);
    bootstrapModule.createCleanupFunction.mockReturnValue(cleanupMock);
    bootstrapModule.startServer.mockResolvedValue(serverMock);
    bootstrapModule.setupGracefulShutdown.mockImplementation(() => undefined);
    bootstrapModule.createMetricsAuth.mockReturnValue(metricsAuthMock);
    bootstrapModule.registerErrorHandlers.mockImplementation(() => undefined);

    routesModule.registerRoutes.mockImplementation(() => undefined);
    prometheusMetrics.getMetrics.mockResolvedValue('# metrics\n');
    (swaggerUi.setup as jest.Mock).mockReturnValue(jest.fn());
    (yaml.load as jest.Mock).mockReturnValue({});
  });

  it('should export bootstrap as default', () => {
    expect(typeof bootstrap).toBe('function');
    expect(defaultExport).toBe(bootstrap);
  });

  it('should orchestrate service startup successfully', async () => {
    await expect(bootstrap()).resolves.not.toThrow();

    expect(bootstrapModule.loadConfig).toHaveBeenCalled();
    expect(bootstrapModule.validateConfig).toHaveBeenCalled();
    expect(bootstrapModule.buildContainer).toHaveBeenCalled();
    expect(bootstrapModule.buildExpressApp).toHaveBeenCalledWith(expect.any(Object), loggerMock, containerMock.cache);
    expect(routesModule.registerRoutes).toHaveBeenCalledWith(appMock, expect.any(Object));

    expect(appMock.get).toHaveBeenCalledWith('/metrics', metricsAuthMock, expect.any(Function));
    expect(appMock.use).toHaveBeenCalledWith('/api-docs', metricsAuthMock, swaggerUi.serve, expect.any(Function));

    expect(bootstrapModule.startServer).toHaveBeenCalled();
    expect(bootstrapModule.createCleanupFunction).toHaveBeenCalled();
    expect(bootstrapModule.setupGracefulShutdown).toHaveBeenCalledWith(serverMock, cleanupMock, loggerMock);
    expect(prometheusMetrics.getMetrics).not.toHaveBeenCalled(); // Only called at request time
  });

  it('should propagate startup errors and log them', async () => {
    const failure = new Error('container failure');
    bootstrapModule.buildContainer.mockRejectedValueOnce(failure);

    await expect(bootstrap()).rejects.toThrow('container failure');
    expect(loggerMock.error).toHaveBeenCalledWith('Failed to start Identity Service', { error: failure });
  });
});

