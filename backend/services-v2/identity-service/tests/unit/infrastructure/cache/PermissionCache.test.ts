import { PermissionCache } from '../../../../src/infrastructure/cache/PermissionCache';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { ILogger } from '../../../../src/application/services/ILogger';
import type { RedisClientType } from 'redis';

interface MockRedisClient extends Partial<RedisClientType> {
  connect: jest.Mock;
  quit: jest.Mock;
  subscribe: jest.Mock;
  publish: jest.Mock;
  get: jest.Mock;
  setEx: jest.Mock;
  del: jest.Mock;
  keys: jest.Mock;
}

const createMockClient = (): MockRedisClient => ({
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  setEx: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(0),
  keys: jest.fn().mockResolvedValue([])
});

const asRedisClient = (client: MockRedisClient): RedisClientType =>
  client as unknown as RedisClientType;

const createMockLogger = (): jest.Mocked<ILogger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any);

describe('PermissionCache', () => {
  it('does not subscribe before connect is called', () => {
    const cacheClient = createMockClient();
    const pubSubClient = createMockClient();
    const logger = createMockLogger();

    new PermissionCache('redis://test', logger, {
      cacheClient: asRedisClient(cacheClient),
      pubSubClient: asRedisClient(pubSubClient)
    });

    expect(pubSubClient.subscribe).not.toHaveBeenCalled();
  });

  it('subscribes to channels after connect and only once', async () => {
    const cacheClient = createMockClient();
    const pubSubClient = createMockClient();
    const logger = createMockLogger();

    const cache = new PermissionCache('redis://test', logger, {
      cacheClient: asRedisClient(cacheClient),
      pubSubClient: asRedisClient(pubSubClient)
    });

    await cache.connect();
    await cache.connect(); // Second call should be a no-op

    expect(cacheClient.connect).toHaveBeenCalledTimes(1);
    expect(pubSubClient.connect).toHaveBeenCalledTimes(1);
    expect(pubSubClient.subscribe).toHaveBeenNthCalledWith(
      1,
      'permission:invalidate',
      expect.any(Function)
    );
    expect(pubSubClient.subscribe).toHaveBeenNthCalledWith(
      2,
      'permission:invalidate:role',
      expect.any(Function)
    );
  });

  it('handles invalidate calls even when not connected yet', async () => {
    const cacheClient = createMockClient();
    const pubSubClient = createMockClient();
    const logger = createMockLogger();

    const cache = new PermissionCache('redis://test', logger, {
      cacheClient: asRedisClient(cacheClient),
      pubSubClient: asRedisClient(pubSubClient)
    });
    const userId = UserId.generate();

    await expect(cache.invalidate(userId)).resolves.toBeUndefined();
    expect(cacheClient.del).toHaveBeenCalled();
  });
});
