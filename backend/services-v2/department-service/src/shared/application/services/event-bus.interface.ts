import { HealthcareDomainEvent } from '../../domain/base/domain-event';

export interface IEventBus {
  connect(): Promise<void>;
  publish(event: HealthcareDomainEvent): Promise<void>;
  disconnect(): Promise<void>;
}
