import winston from 'winston';
declare const logger: winston.Logger;
export declare const stream: {
    write: (message: string) => void;
};
export declare const logWithContext: (level: string, message: string, context?: any) => void;
export declare const logError: (error: Error, context?: any) => void;
export declare const logRequest: (req: any, res: any, responseTime: number) => void;
export declare const logEvent: (eventType: string, data?: any) => void;
export declare const logMetric: (metricName: string, value: number, tags?: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map