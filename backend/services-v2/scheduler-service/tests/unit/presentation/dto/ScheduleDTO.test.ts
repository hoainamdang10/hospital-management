import { createScheduleSchema, cancelScheduleSchema } from '../../../../src/presentation/dto/ScheduleDTO';

describe('ScheduleDTO', () => {
  describe('createScheduleSchema', () => {
    describe('valid ONCE schedule', () => {
      it('should validate valid ONCE schedule', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'appointments.reminder',
          payloadJson: { appointmentId: '123' },
          dedupKey: 'test-dedup-key'
        };

        const { error, value } = createScheduleSchema.validate(data);

        expect(error).toBeUndefined();
        expect(value.tenantId).toBe('test-tenant');
        expect(value.scheduleType).toBe('ONCE');
      });

      it('should apply default values', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'appointments.reminder',
          payloadJson: { appointmentId: '123' },
          dedupKey: 'test-dedup-key'
        };

        const { value } = createScheduleSchema.validate(data);

        expect(value.timezone).toBe('UTC');
        expect(value.jitterMs).toBe(0);
      });

      it('should validate with optional fields', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          ownerResourceType: 'appointment',
          ownerResourceId: 'appt-123',
          policyTag: 'reminder',
          scheduleType: 'ONCE',
          timezone: 'Asia/Ho_Chi_Minh',
          startAtUtc: '2025-12-31T23:59:59Z',
          endAtUtc: '2026-12-31T23:59:59Z',
          topicOrCommand: 'appointments.reminder',
          payloadJson: { appointmentId: '123' },
          maxRuns: 5,
          jitterMs: 5000,
          retryPolicy: {
            strategy: 'exp',
            maxAttempts: 3,
            baseMs: 1000,
            maxDelayMs: 60000
          },
          dedupKey: 'test-dedup-key',
          createdBy: 'user-123'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should validate retry policy strategies', () => {
        const strategies = ['exp', 'linear', 'fixed'];

        strategies.forEach(strategy => {
          const data = {
            tenantId: 'test-tenant',
            ownerService: 'scheduling-service',
            scheduleType: 'ONCE',
            startAtUtc: '2025-12-31T23:59:59Z',
            topicOrCommand: 'test.topic',
            payloadJson: {},
            dedupKey: 'test-key',
            retryPolicy: {
              strategy,
              maxAttempts: 3,
              baseMs: 1000
            }
          };

          const { error } = createScheduleSchema.validate(data);
          expect(error).toBeUndefined();
        });
      });
    });

    describe('required fields', () => {
      it('should reject missing tenantId', () => {
        const data = {
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('tenantId');
      });

      it('should reject missing ownerService', () => {
        const data = {
          tenantId: 'test-tenant',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('ownerService');
      });

      it('should reject missing scheduleType', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('scheduleType');
      });

      it('should reject missing startAtUtc for ONCE schedule', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('startAtUtc');
      });

      it('should reject missing topicOrCommand', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('topicOrCommand');
      });

      it('should reject missing payloadJson', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('payloadJson');
      });

      it('should reject missing dedupKey', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {}
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('dedupKey');
      });
    });

    describe('MVP restrictions', () => {
      it('should reject CRON schedule type', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'CRON',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('MVP only supports ONCE schedules');
      });

      it('should reject RRULE schedule type', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'RRULE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('MVP only supports ONCE schedules');
      });

      it('should reject cronExpr field', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          cronExpr: '0 9 * * *',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('ONCE schedules cannot have cronExpr');
      });

      it('should reject rrule field', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          rrule: 'FREQ=DAILY;COUNT=10',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.message).toContain('ONCE schedules cannot have rrule');
      });
    });

    describe('validation rules', () => {
      it('should reject invalid ISO date', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: 'invalid-date',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key'
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should reject negative jitterMs', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key',
          jitterMs: -1000
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should reject jitterMs > 60000', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key',
          jitterMs: 70000
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should reject maxRuns < 1', () => {
        const data = {
          tenantId: 'test-tenant',
          ownerService: 'scheduling-service',
          scheduleType: 'ONCE',
          startAtUtc: '2025-12-31T23:59:59Z',
          topicOrCommand: 'test.topic',
          payloadJson: {},
          dedupKey: 'test-key',
          maxRuns: 0
        };

        const { error } = createScheduleSchema.validate(data);

        expect(error).toBeDefined();
      });
    });
  });

  describe('cancelScheduleSchema', () => {
    it('should validate valid cancel request', () => {
      const data = {
        tenantId: 'test-tenant',
        ownerService: 'scheduling-service'
      };

      const { error } = cancelScheduleSchema.validate(data);

      expect(error).toBeUndefined();
    });

    it('should validate with optional fields', () => {
      const data = {
        tenantId: 'test-tenant',
        ownerService: 'scheduling-service',
        ownerResourceType: 'appointment',
        ownerResourceId: 'appt-123',
        policyTag: 'reminder',
        reason: 'Appointment cancelled'
      };

      const { error } = cancelScheduleSchema.validate(data);

      expect(error).toBeUndefined();
    });

    it('should reject missing tenantId', () => {
      const data = {
        ownerService: 'scheduling-service'
      };

      const { error } = cancelScheduleSchema.validate(data);

      expect(error).toBeDefined();
      expect(error?.message).toContain('tenantId');
    });

    it('should reject missing ownerService', () => {
      const data = {
        tenantId: 'test-tenant'
      };

      const { error } = cancelScheduleSchema.validate(data);

      expect(error).toBeDefined();
      expect(error?.message).toContain('ownerService');
    });
  });
});

