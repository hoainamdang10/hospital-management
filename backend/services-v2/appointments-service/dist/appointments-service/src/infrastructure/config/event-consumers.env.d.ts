/**
 * Environment Configuration - Appointment Service Event Consumers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
export interface AppointmentEventConsumerConfig {
    rabbitmqUrl: string;
    exchangeName: string;
    staffEventsQueue: string;
    staffEventsRoutingKeys: string[];
    staffEventsEnabled: boolean;
    staffEventsPrefetchCount: number;
    staffEventsRetryAttempts: number;
    staffEventsRetryDelayMs: number;
    departmentEventsQueue: string;
    departmentEventsRoutingKeys: string[];
    departmentEventsEnabled: boolean;
    departmentEventsPrefetchCount: number;
    departmentEventsRetryAttempts: number;
    departmentEventsRetryDelayMs: number;
    clinicalEMREventsQueue: string;
    clinicalEMREventsRoutingKeys: string[];
    clinicalEMREventsEnabled: boolean;
    clinicalEMREventsPrefetchCount: number;
    clinicalEMREventsRetryAttempts: number;
    clinicalEMREventsRetryDelayMs: number;
    billingEventsQueue: string;
    billingEventsRoutingKeys: string[];
    billingEventsEnabled: boolean;
    billingEventsPrefetchCount: number;
    billingEventsRetryAttempts: number;
    billingEventsRetryDelayMs: number;
}
export declare const appointmentEventConsumerConfig: AppointmentEventConsumerConfig;
export default appointmentEventConsumerConfig;
//# sourceMappingURL=event-consumers.env.d.ts.map