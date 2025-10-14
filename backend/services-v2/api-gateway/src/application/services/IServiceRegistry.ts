import { ServiceRoute } from '@domain/value-objects/ServiceRoute';

export interface IServiceRegistry {
  getRouteForPath(path: string): ServiceRoute | null;
  
  getAllRoutes(): ServiceRoute[];
  
  registerRoute(route: ServiceRoute): void;
  
  isHealthy(serviceName: string): Promise<boolean>;
}

