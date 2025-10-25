/**
 * GetHealthStatusUseCase - Query Use Case
 * Get service health status
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Health Monitoring
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { SupabaseClient } from '@supabase/supabase-js';
export interface GetHealthStatusResult {
    isHealthy: boolean;
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    checks: {
        database: {
            healthy: boolean;
            responseTime: number;
        };
        queue: {
            healthy: boolean;
            pendingCount: number;
        };
        channels: {
            healthy: boolean;
            details: any[];
        };
    };
    metrics: {
        pendingNotifications: number;
        failedNotifications: number;
        overdueNotifications: number;
        averageResponseTime: number;
    };
    timestamp: Date;
}
export declare class GetHealthStatusUseCase {
    private readonly notificationRepository;
    private readonly supabase;
    constructor(notificationRepository: INotificationRepository, supabase: SupabaseClient);
    execute(): Promise<GetHealthStatusResult>;
}
//# sourceMappingURL=GetHealthStatusUseCase.d.ts.map