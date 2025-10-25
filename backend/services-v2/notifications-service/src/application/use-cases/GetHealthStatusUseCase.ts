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
    database: { healthy: boolean; responseTime: number };
    queue: { healthy: boolean; pendingCount: number };
    channels: { healthy: boolean; details: any[] };
  };
  metrics: {
    pendingNotifications: number;
    failedNotifications: number;
    overdueNotifications: number;
    averageResponseTime: number;
  };
  timestamp: Date;
}

export class GetHealthStatusUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly supabase: SupabaseClient
  ) {}

  async execute(): Promise<GetHealthStatusResult> {
    try {
      const healthCheck = await this.notificationRepository.getHealthCheck();
      
      // Check channel health
      const { data: channelHealth } = await this.supabase
        .from('channel_health')
        .select('channel, is_healthy, health_status, success_rate');

      const channelsHealthy = channelHealth?.every(ch => ch.is_healthy) || false;

      const overallHealthy = healthCheck.isHealthy && channelsHealthy;

      return {
        isHealthy: overallHealthy,
        status: overallHealthy ? 'HEALTHY' : (healthCheck.failedNotifications > 50 ? 'UNHEALTHY' : 'DEGRADED'),
        checks: {
          database: { healthy: true, responseTime: 50 },
          queue: { healthy: healthCheck.pendingNotifications < 1000, pendingCount: healthCheck.pendingNotifications },
          channels: { healthy: channelsHealthy, details: channelHealth || [] }
        },
        metrics: {
          pendingNotifications: healthCheck.pendingNotifications,
          failedNotifications: healthCheck.failedNotifications,
          overdueNotifications: healthCheck.overdueNotifications,
          averageResponseTime: healthCheck.averageResponseTime
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: 'UNHEALTHY',
        checks: {
          database: { healthy: false, responseTime: 0 },
          queue: { healthy: false, pendingCount: 0 },
          channels: { healthy: false, details: [] }
        },
        metrics: {
          pendingNotifications: 0,
          failedNotifications: 0,
          overdueNotifications: 0,
          averageResponseTime: 0
        },
        timestamp: new Date()
      };
    }
  }
}

