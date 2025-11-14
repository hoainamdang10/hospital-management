/**
 * Environment Configuration - Scheduler Service Event Consumers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
export interface SchedulerEventConsumerConfig {
    rabbitmqUrl: string;
    exchangeName: string;
    staffEventsQueue: string;
    staffEventsRoutingKeys: string[];
    staffEventsEnabled: boolean;
    staffEventsPrefetchCount: number;
    staffEventsRetryAttempts: number;
    staffEventsRetryDelayMs: number;
    systemEventsQueue: string;
    systemEventsRoutingKeys: string[];
    systemEventsEnabled: boolean;
    systemEventsPrefetchCount: number;
    systemEventsRetryAttempts: number;
    systemEventsRetryDelayMs: number;
    billingEventsQueue: string;
    billingEventsRoutingKeys: string[];
    billingEventsEnabled: boolean;
    billingEventsPrefetchCount: number;
    billingEventsRetryAttempts: number;
    billingEventsRetryDelayMs: number;
    departmentEventsQueue: string;
    departmentEventsRoutingKeys: string[];
    departmentEventsEnabled: boolean;
    departmentEventsPrefetchCount: number;
    departmentEventsRetryAttempts: number;
    departmentEventsRetryDelayMs: number;
}
export declare const schedulerEventConsumerConfig: SchedulerEventConsumerConfig;
export default schedulerEventConsumerConfig;
//# sourceMappingURL=event-consumers.env.d.ts.map