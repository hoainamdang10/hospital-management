import { ServiceRoute } from '@domain/value-objects/ServiceRoute';
import { IServiceRegistry } from '../services/IServiceRegistry';
import { ILogger } from '../services/ILogger';

export interface ProxyRequestInput {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  userId?: string;
  userEmail?: string;
  userRoles?: string[];
  userPermissions?: string[];
  requestId: string;
  ip: string;
}

export interface ProxyRequestOutput {
  success: boolean;
  route?: ServiceRoute;
  targetUrl?: string;
  error?: string;
}

export class ProxyRequestUseCase {
  constructor(
    private serviceRegistry: IServiceRegistry,
    private logger: ILogger
  ) {}

  async execute(input: ProxyRequestInput): Promise<ProxyRequestOutput> {
    try {
      const route = this.serviceRegistry.getRouteForPath(input.path);

      if (!route) {
        this.logger.warn('No route found for path', {
          requestId: input.requestId,
          path: input.path,
          method: input.method,
          ip: input.ip
        });

        return {
          success: false,
          error: `No service route found for path: ${input.path}`
        };
      }

      const isHealthy = await this.serviceRegistry.isHealthy(route.serviceName);
      if (!isHealthy) {
        this.logger.error('Target service is unhealthy', {
          requestId: input.requestId,
          path: input.path,
          serviceName: route.serviceName,
          targetUrl: route.baseUrl
        });

        return {
          success: false,
          error: `Service ${route.serviceName} is currently unavailable`
        };
      }

      const targetUrl = route.getTargetUrl(input.path);

      this.logger.info('Proxying request to service', {
        requestId: input.requestId,
        path: input.path,
        method: input.method,
        serviceName: route.serviceName,
        targetUrl,
        userId: input.userId,
        ip: input.ip
      });

      return {
        success: true,
        route,
        targetUrl
      };

    } catch (error) {
      this.logger.error('Proxy request error', {
        requestId: input.requestId,
        path: input.path,
        method: input.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: 'Internal proxy error'
      };
    }
  }
}

