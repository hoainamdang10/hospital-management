# Fix Event Consumers - Scheduler Service

## Lỗi cần fix:

### 1. CreateScheduleRequest không có field `id`
- Remove tất cả `id:` fields trong `createScheduleUseCase.execute()`
- Scheduler Service tự generate ID

### 2. CancelScheduleUseCase.execute() signature
```typescript
// SAI:
await this.cancelScheduleUseCase.execute(scheduleId);

// ĐÚNG:
await this.cancelScheduleUseCase.execute({
  tenantId: 'hospital-1',
  ownerService: 'billing-service',
  ownerResourceId: invoiceId,
  policyTag: 'payment-reminder',
  reason: 'Payment completed'
});
```

### 3. UpdateScheduleUseCase.execute() signature
```typescript
// SAI:
await this.updateScheduleUseCase.execute(scheduleId, { payloadJson: {...} });

// ĐÚNG:
await this.updateScheduleUseCase.execute({
  scheduleId: scheduleId,
  payloadJson: {...}
});
```

### 4. SupabaseScheduleRepository không có findByOwnerServiceAndTopic()
```typescript
// SAI:
const schedules = await this.scheduleRepository.findByOwnerServiceAndTopic(
  'billing-service',
  'billing.payment.reminder'
);

// ĐÚNG:
const tenantId = TenantId.create('hospital-1');
const schedules = await this.scheduleRepository.findByOwner(
  tenantId,
  'billing-service',
  'invoice',
  invoiceId,
  'payment-reminder'
);
```

### 5. Logger error format
```typescript
// SAI:
this.logger.error('Message', {
  error: error.message  // ❌ 'error' không phải property của Error type
});

// ĐÚNG:
this.logger.error('Message', {
  errorMessage: error.message  // ✅ Đổi tên field
});
```

## Files cần fix:
1. BillingEventConsumer.ts
2. DepartmentEventConsumer.ts
3. StaffEventConsumer.ts
4. SystemEventConsumer.ts
