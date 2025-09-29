import { Request, Response, NextFunction } from 'express';
/**
 * Create connection pool health check endpoint
 */
export declare function createConnectionPoolHealthCheck(serviceName: string): (req: Request, res: Response) => Promise<void>;
/**
 * Create connection pool metrics endpoint
 */
export declare function createConnectionPoolMetrics(serviceName: string): (req: Request, res: Response) => Promise<void>;
/**
 * Create connection pool stress test endpoint
 */
export declare function createConnectionPoolStressTest(serviceName: string): (req: Request, res: Response) => Promise<void>;
/**
 * Connection pool monitoring middleware
 */
export declare function connectionPoolMonitoring(serviceName: string): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=connection-pool-health.d.ts.map