/**
 * PaymentPlanCompletedEvent - Domain Event
 * Published when a payment plan is completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/DomainEvent';

export interface PaymentPlanCompletedEventPayload {
  planId: string;
  patientId: string;
  totalAmount: number;
  timestamp: Date;
}

export class PaymentPlanCompletedEvent extends DomainEvent<PaymentPlanCompletedEventPayload> {
  constructor(payload: PaymentPlanCompletedEventPayload) {
    super('billing.payment-plan.completed', payload);
  }
}

