import { createClient } from '@supabase/supabase-js';
import { SupabaseEventBus, IEventHandler } from '@infrastructure/messaging/SupabaseEventBus';
import { CircuitBreakerFactory } from '@infrastructure/resilience/CircuitBreaker';
import { createMockLogger, createMockDomainEvent } from '@tests/helpers/mockFactories';
import { DomainEvent } from '@shared/domain/base/domain-event';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('SupabaseEventBus', () => {
  const createClientMock = createClient as jest.Mock;

  let mockInsert: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockFrom: jest.Mock;
  let breakerExecuteMock: jest.Mock;
  let eventBus: SupabaseEventBus;
  let logger: ReturnType<typeof createMockLogger>;

  const createHandler = (canHandle = true): jest.Mocked<IEventHandler<DomainEvent>> => {
    return {
      handle: jest.fn().mockResolvedValue(undefined),
      canHandle: jest.fn().mockReturnValue(canHandle),
      getHandlerName: jest.fn().mockReturnValue('TestHandler')
    };
  };

  beforeEach(() => {
    mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom = jest.fn().mockReturnValue({
      insert: mockInsert,
      select: mockSelect
    });

    createClientMock.mockReturnValue({ from: mockFrom });

    breakerExecuteMock = jest.fn(async (operation: () => Promise<any>, fallback?: () => Promise<any>) => {
      try {
        return await operation();
      } catch (error) {
        if (fallback) {
          return await fallback();
        }
        throw error;
      }
    });

    jest.spyOn(CircuitBreakerFactory, 'getBreaker').mockReturnValue({
      execute: breakerExecuteMock
    } as any);

    logger = createMockLogger();
    eventBus = new SupabaseEventBus('https://example.supabase.co', 'service-role-key', logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('publish lưu event và gọi handler', async () => {
    const handler = createHandler();
    await eventBus.subscribe('provider.staff.registered', handler);

    const event = createMockDomainEvent('provider.staff.registered', {
      aggregateId: 'STF-001',
      timestamp: new Date().toISOString()
    }) as unknown as DomainEvent;

    await eventBus.publish(event);

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      event_id: event.eventId,
      event_type: event.eventType
    }));
    expect(handler.canHandle).toHaveBeenCalledWith(event);
    expect(handler.handle).toHaveBeenCalledWith(event);
    expect(logger.info).toHaveBeenCalledWith(
      'Domain event published successfully',
      expect.objectContaining({ eventType: event.eventType })
    );
  });

  it('publish vẫn gọi handler khi lưu Supabase lỗi và fallback circuit breaker kích hoạt', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'connection lost' } });

    const handler = createHandler();
    await eventBus.subscribe('provider.staff.registered', handler);

    const event = createMockDomainEvent('provider.staff.registered', {
      aggregateId: 'STF-002',
      timestamp: new Date().toISOString()
    }) as unknown as DomainEvent;

    await eventBus.publish(event);

    expect(logger.error).toHaveBeenCalledWith(
      'Circuit breaker fallback for storeEvent - event not stored',
      expect.objectContaining({
        eventId: event.eventId,
        eventType: event.eventType
      })
    );
    expect(handler.handle).toHaveBeenCalledWith(event);
  });

  it('publishAll lưu nhiều event và gọi handler cho từng event', async () => {
    const handler = createHandler();
    await eventBus.subscribe('provider.staff.updated', handler);

    const events = [
      createMockDomainEvent('provider.staff.updated', { aggregateId: 'STF-100' }),
      createMockDomainEvent('provider.staff.updated', { aggregateId: 'STF-101' })
    ].map(event => event as DomainEvent);

    await eventBus.publishAll(events);

    expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ event_id: events[0].eventId }),
      expect.objectContaining({ event_id: events[1].eventId })
    ]));
    expect(handler.handle).toHaveBeenCalledTimes(2);
  });

  it('getEventHistory trả về dữ liệu từ Supabase và cache bộ nhớ', async () => {
    const storedEvent = createMockDomainEvent('provider.staff.suspended', {
      aggregateId: 'STF-200',
      timestamp: new Date().toISOString()
    });

    mockOrder.mockResolvedValueOnce({
      data: [{
        event_id: storedEvent.eventId,
        event_type: storedEvent.eventType,
        aggregate_id: storedEvent.aggregateId,
        aggregate_type: storedEvent.aggregateType,
        occurred_at: new Date().toISOString(),
        event_data: JSON.stringify({
          ...storedEvent,
          timestamp: storedEvent.timestamp
        }),
        metadata: {}
      }],
      error: null
    });

    const resultsFirst = await eventBus.getEventHistory('STF-200');
    const resultsSecond = await eventBus.getEventHistory('STF-200');

    expect(resultsFirst).toHaveLength(1);
    expect(resultsFirst[0].eventId).toBe(storedEvent.eventId);
    expect(resultsSecond).toHaveLength(1);
    // Supabase select chỉ gọi lần đầu (lần sau lấy từ bộ nhớ)
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it('getEventHistory trả về mảng rỗng khi Supabase lỗi và fallback chạy', async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'read timeout' }
    });

    const result = await eventBus.getEventHistory('STF-404');

    expect(result).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(
      'Circuit breaker fallback for getEventHistory',
      expect.objectContaining({ aggregateId: 'STF-404' })
    );
  });

  it('unsubscribe loại bỏ handler khỏi danh sách', async () => {
    const handler = createHandler();
    await eventBus.subscribe('provider.staff.deactivated', handler);

    eventBus.unsubscribe('provider.staff.deactivated', handler);

    const event = createMockDomainEvent('provider.staff.deactivated', { aggregateId: 'STF-300' }) as DomainEvent;
    await eventBus.publish(event);

    expect(handler.handle).not.toHaveBeenCalled();
  });
});
