import { AppointmentScheduledSchedulerHandler } from '../../../../src/infrastructure/events/handlers/AppointmentSchedulerIntegrationHandler';

class FakeOutboxRepo {
  public enqueued: any[] = [];
  async enqueue(p: any) { this.enqueued.push(p); }
}

function makeDomainEvent(eventData: any): any {
  return { eventType: 'AppointmentScheduled', occurredOn: new Date(), eventData };
}

describe('AppointmentScheduledSchedulerHandler → Outbox', () => {
  it('enqueues SchedulerReminderCreate with dedup key per reminder window', async () => {
    const outbox = new FakeOutboxRepo();
    const handler = new AppointmentScheduledSchedulerHandler(outbox as any, 'tenant-x');

    const start = new Date(Date.now() + 48 * 3600 * 1000); // 48h from now
    const evt = makeDomainEvent({
      appointmentId: '2025-APT-000001-001',
      patientId: 'PAT-250101-001',
      providerId: 'CARD-DOC-250101-001',
      startTime: start,
      endTime: new Date(start.getTime() + 30 * 60000),
      reason: 'Checkup',
      appointmentType: 'CONSULTATION',
      priority: 'NORMAL',
      scheduledBy: 'user-1',
      urgencyLevel: 'routine'
    });

    await handler.handle(evt as any);

    // At least 1 reminder should be enqueued (24h window)
    expect(outbox.enqueued.length).toBeGreaterThan(0);
    const found = outbox.enqueued.find(x => x.dedupKey === '2025-APT-000001-001:reminder-24h');
    expect(found).toBeTruthy();
    expect(found.payload.ownerService).toBe('appointments');
    expect(found.payload.ownerResourceId).toBe('2025-APT-000001-001');
    expect(found.payload.topicOrCommand).toContain('appointments.appointment.reminder');
  });
});

