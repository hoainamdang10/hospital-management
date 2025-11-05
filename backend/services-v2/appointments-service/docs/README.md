# Appointments Service Documentation

## 📚 Documentation Index

This directory contains comprehensive documentation for the Appointments Service.

### Architecture & Design

- **[REMINDER_ARCHITECTURE.md](./REMINDER_ARCHITECTURE.md)** - Complete reminder system architecture
  - Auto-scheduling system (Preferred)
  - Manual CRUD API (Alternative)
  - Coexistence and decision matrix

### Implementation Guides

- **[REMINDER_IMPLEMENTATION_GUIDE.md](./REMINDER_IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation guide
  - Quick decision guide
  - Common scenarios and solutions
  - Common mistakes to avoid
  - Implementation steps

### Lessons Learned

- **[LESSONS_LEARNED.md](./LESSONS_LEARNED.md)** - Lessons from reminder implementation
  - What went wrong and why
  - What we should have done
  - Checklist for future development
  - Best practices going forward

---

## 🎯 Quick Start

### For Developers

**Q: I need to implement reminder functionality**
→ Read [REMINDER_IMPLEMENTATION_GUIDE.md](./REMINDER_IMPLEMENTATION_GUIDE.md) first

**Q: I want to understand the architecture**
→ Read [REMINDER_ARCHITECTURE.md](./REMINDER_ARCHITECTURE.md)

**Q: I want to avoid common mistakes**
→ Read [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)

### For Architects

**Q: Why are there two reminder systems?**
→ See [REMINDER_ARCHITECTURE.md - Coexistence](./REMINDER_ARCHITECTURE.md#-coexistence)

**Q: Which system should we use?**
→ See [REMINDER_ARCHITECTURE.md - Decision Matrix](./REMINDER_ARCHITECTURE.md#-decision-matrix)

**Q: What are the trade-offs?**
→ See [REMINDER_ARCHITECTURE.md - Advantages](./REMINDER_ARCHITECTURE.md#advantages)

---

## ⚠️ Important Notes

### Reminder Systems

Appointments Service has **TWO** reminder systems:

1. **Auto-Scheduling** (Preferred) ✅
   - Event-driven, automatic
   - Production-ready
   - Handles 99% of use cases
   - **Use this by default**

2. **Manual CRUD API** (Alternative) ⚠️
   - Manual management
   - Optional feature
   - Special cases only
   - **Only use if auto-scheduling cannot handle your use case**

### Before You Start

**ALWAYS check these before implementing:**

1. ✅ Database schema via Supabase MCP
2. ✅ Existing code via codebase-retrieval
3. ✅ Event handlers in `src/infrastructure/events/handlers/`
4. ✅ Service integrations in `src/infrastructure/adapters/`
5. ✅ Configuration files in `src/config/`

**See [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) for detailed checklist**

---

## 📖 Documentation Structure

```
docs/
├── README.md                           # This file - Documentation index
├── REMINDER_ARCHITECTURE.md            # Architecture overview
├── REMINDER_IMPLEMENTATION_GUIDE.md    # Implementation guide
└── LESSONS_LEARNED.md                  # Lessons learned
```

---

## 🔗 Related Documentation

### Service Documentation

- [../README.md](../README.md) - Appointments Service overview
- [../../README.md](../../README.md) - Services V2 overview
- [../../../AGENTS.md](../../../AGENTS.md) - Agent guidelines

### Code Documentation

- [../src/infrastructure/events/handlers/AppointmentSchedulerIntegrationHandler.ts](../src/infrastructure/events/handlers/AppointmentSchedulerIntegrationHandler.ts) - Auto-scheduling implementation
- [../src/infrastructure/adapters/RemoteSchedulerAdapter.ts](../src/infrastructure/adapters/RemoteSchedulerAdapter.ts) - Scheduler Service client
- [../src/infrastructure/outbox/OutboxPublisherWorker.ts](../src/infrastructure/outbox/OutboxPublisherWorker.ts) - Outbox pattern
- [../src/config/reminder-policy.json](../src/config/reminder-policy.json) - Reminder policy

### External Services

- Scheduler Service: `http://scheduler-service:3030`
- Notifications Service: `http://notifications-service:3031`

---

## 🚀 Quick Reference

### Auto-Scheduling (Recommended)

```typescript
// No code needed! Just create appointment
await createAppointmentUseCase.execute({
  patientId: 'patient-123',
  doctorId: 'doctor-456',
  appointmentDate: '2025-01-15',
  appointmentTime: '14:30:00',
  priority: 'ROUTINE' // Determines reminder windows
});

// Reminders are automatically created based on priority
// ROUTINE: 24h + 2h reminders
// URGENT: 2h + 30min reminders
// EMERGENCY: No reminders (immediate)
```

### Manual CRUD API (Special Cases)

```bash
# Create manual reminder
POST /api/v1/appointments/:appointmentId/reminders
{
  "reminderType": "CUSTOM",
  "reminderChannel": "SMS",
  "sendBeforeMinutes": 60
}

# Get manual reminders
GET /api/v1/appointments/:appointmentId/reminders

# Update manual reminder
PUT /api/v1/appointments/reminders/:reminderId

# Delete manual reminder
DELETE /api/v1/appointments/reminders/:reminderId
```

### Reminder Policy Configuration

```json
// src/config/reminder-policy.json
{
  "default": {
    "ROUTINE": [
      { "window": "24h", "channels": ["EMAIL", "PUSH"] },
      { "window": "2h", "channels": ["PUSH"] }
    ],
    "URGENT": [
      { "window": "2h", "channels": ["SMS", "PUSH"] },
      { "window": "30min", "channels": ["SMS", "PUSH"] }
    ]
  }
}
```

---

## 📞 Support

For questions or issues:

1. Check documentation in this directory
2. Review code comments in implementation files
3. Check [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) for common issues
4. Consult with team lead or architect

---

**Last Updated:** 2025-01-11
**Status:** Documentation complete and up-to-date

