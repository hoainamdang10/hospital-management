import { RabbitMQEventPublisher } from "@/infrastructure/events/RabbitMQEventPublisher";
import { DomainEventMapper } from "@/infrastructure/events/DomainEventMapper";
import { IntegrationEventPayload } from "@/application/services/IEventPublisher";
import { DomainEvent, buildRoutingKey } from "@shared/domain/base/domain-event";

jest.mock("amqplib", () => ({
  connect: jest.fn(),
}));

const amqp = require("amqplib");

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
});

const buildPublisher = (logger = createLogger(), exchangeName?: string) => {
  const publisher = new RabbitMQEventPublisher(
    "amqp://user:pass@localhost:5672",
    logger,
    exchangeName,
  );
  return { publisher, logger };
};

describe("RabbitMQEventPublisher", () => {
  const originalExchange = process.env.RABBITMQ_EXCHANGE;

  const channelMock = {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockReturnValue(true),
    once: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const connectionMock = {
    createChannel: jest.fn().mockResolvedValue(channelMock),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (amqp.connect as jest.Mock).mockResolvedValue(connectionMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.RABBITMQ_EXCHANGE = originalExchange;
  });

  it("initialize kết nối và tạo exchange", async () => {
    const { publisher, logger } = buildPublisher();

    await publisher.initialize();

    expect(amqp.connect).toHaveBeenCalledWith(
      "amqp://user:pass@localhost:5672",
    );
    expect(connectionMock.createChannel).toHaveBeenCalled();
    expect(channelMock.assertExchange).toHaveBeenCalledWith(
      "hospital.events",
      "topic",
      {
        durable: true,
      },
    );
    expect(logger.info).toHaveBeenCalledWith(
      "RabbitMQ connection established",
      {
        exchange: "hospital.events",
      },
    );
  });

  it("publishIntegrationEvent gửi message với routing key đúng", async () => {
    const { publisher } = buildPublisher();
    await publisher.initialize();

    const event: IntegrationEventPayload = {
      eventType: "UserCreatedEvent",
      aggregateId: "USR-001",
      aggregateType: "User",
      occurredAt: new Date("2025-01-01T00:00:00Z"),
      payload: { userId: "USR-001" },
    };

    await publisher.publishIntegrationEvent(event);

    const expectedRoutingKey = buildRoutingKey(
      event.aggregateType,
      event.eventType,
    );

    expect(channelMock.publish).toHaveBeenCalledWith(
      "hospital.events",
      expectedRoutingKey,
      expect.any(Buffer),
      expect.objectContaining({
        contentType: "application/json",
        type: "UserCreatedEvent",
      }),
    );
  });

  it("publishIntegrationEvent bỏ qua khi chưa initialize", async () => {
    const { publisher, logger } = buildPublisher();

    await publisher.publishIntegrationEvent({
      eventType: "AnyEvent",
      aggregateId: "1",
      aggregateType: "User",
      occurredAt: new Date(),
      payload: {},
    });

    expect(logger.warn).toHaveBeenCalledWith(
      "RabbitMQ not connected, queueing event for later publish",
      {
        eventType: "AnyEvent",
      },
    );
    expect(channelMock.publish).not.toHaveBeenCalled();
  });

  it("đọc exchange từ biến môi trường khi không truyền tham số", async () => {
    process.env.RABBITMQ_EXCHANGE = "custom.exchange";
    const { publisher } = buildPublisher();

    await publisher.initialize();

    expect(channelMock.assertExchange).toHaveBeenCalledWith(
      "custom.exchange",
      "topic",
      {
        durable: true,
      },
    );
  });

  it("publishDomainEvents dùng DomainEventMapper để chuyển đổi", async () => {
    const { publisher } = buildPublisher();
    await publisher.initialize();

    const mapSpy = jest
      .spyOn(DomainEventMapper, "toRabbitMQEvents")
      .mockReturnValue([
        {
          eventType: "UserCreatedEvent",
          aggregateId: "USR-1",
          aggregateType: "User",
          occurredAt: new Date(),
          payload: {},
        },
      ]);

    class FakeEvent extends DomainEvent {
      constructor() {
        super("FakeEvent", "USR-1", "User", {});
      }
      getEventData(): any {
        return {};
      }
      containsPHI(): boolean {
        return false;
      }
      getPatientId(): string | null {
        return null;
      }
    }

    await publisher.publishDomainEvents([new FakeEvent()]);

    expect(mapSpy).toHaveBeenCalled();
    expect(channelMock.publish).toHaveBeenCalled();
  });

  it("close đóng channel và connection", async () => {
    const { publisher } = buildPublisher();
    await publisher.initialize();

    await publisher.close();

    expect(channelMock.close).toHaveBeenCalled();
    expect(connectionMock.close).toHaveBeenCalled();
  });
});
