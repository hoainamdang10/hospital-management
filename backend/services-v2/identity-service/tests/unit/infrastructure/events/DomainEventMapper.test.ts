import { DomainEventMapper } from '@/infrastructure/events/DomainEventMapper';
import { UserCreatedEvent } from '@/domain/events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '@/domain/events/UserAuthenticatedEvent';
import { StaffInvitationCreatedEvent } from '@/domain/events/StaffInvitationCreatedEvent';
import { UserId } from '@/domain/value-objects/UserId';
import { Email } from '@/domain/value-objects/Email';
import { HealthcareRole } from '@/domain/entities/HealthcareRole';
import { DomainEvent } from '@shared/domain/base/domain-event';

const buildUserId = () => UserId.create('USR-202501-001');
const buildEmail = () => Email.create('doctor@example.com');
const buildRole = () => HealthcareRole.fromRoleType('DOCTOR');

describe('DomainEventMapper', () => {
  it('map UserCreatedEvent sang payload RabbitMQ đúng định dạng', () => {
    const event = new UserCreatedEvent(buildUserId(), buildEmail(), buildRole());

    const result = DomainEventMapper.toRabbitMQEvent(event);

    expect(result.eventType).toBe('UserCreatedEvent');
    expect(result.aggregateType).toBe('User');
    expect(result.payload).toEqual({
      userId: 'USR-202501-001',
      email: 'doctor@example.com',
      role: 'DOCTOR'
    });
  });

  it('map UserAuthenticatedEvent bao gồm ip, userAgent và timestamp', () => {
    const timestamp = new Date('2025-01-01T10:00:00Z');
    const event = new UserAuthenticatedEvent(buildUserId(), '127.0.0.1', 'jest-agent', timestamp);

    const result = DomainEventMapper.toRabbitMQEvent(event);

    expect(result.eventType).toBe('UserAuthenticatedEvent');
    expect(result.payload).toEqual({
      userId: 'USR-202501-001',
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
      timestamp
    });
  });

  it('giữ aggregateType StaffInvitation khi map StaffInvitationCreatedEvent', () => {
    const invitationEvent = new StaffInvitationCreatedEvent(
      'email@example.com',
      'DOCTOR',
      'admin-1',
      'INVITE-123',
      new Date('2025-01-01T00:00:00Z')
    );

    const result = DomainEventMapper.toRabbitMQEvent(invitationEvent);

    expect(result.aggregateType).toBe('StaffInvitation');
    expect(result.payload).toMatchObject({
      email: 'email@example.com',
      role: 'DOCTOR',
      invitationToken: 'INVITE-123'
    });
  });

  it('fallback payload mặc định cho domain event không hỗ trợ', () => {
    class UnknownEvent extends DomainEvent {
      constructor() {
        super('UnknownEvent', 'AGG-1', 'User', {}, 1);
      }

      getEventData(): any {
        return { foo: 'bar' };
      }

      containsPHI(): boolean {
        return false;
      }

      getPatientId(): string | null {
        return null;
      }
    }

    const result = DomainEventMapper.toRabbitMQEvent(new UnknownEvent());

    expect(result.payload).toBeInstanceOf(UnknownEvent);
  });

  it('map nhiều domain event với toRabbitMQEvents', () => {
    const events = [
      new UserCreatedEvent(buildUserId(), buildEmail(), buildRole()),
      new UserAuthenticatedEvent(buildUserId(), '10.0.0.1', 'agent', new Date())
    ];

    const results = DomainEventMapper.toRabbitMQEvents(events);

    expect(results).toHaveLength(2);
    expect(results[0].eventType).toBe('UserCreatedEvent');
    expect(results[1].eventType).toBe('UserAuthenticatedEvent');
  });
});
