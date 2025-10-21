export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
export interface LogContext {
    correlationId?: string;
    tenantId?: string;
    scheduleId?: string;
    runId?: string;
    workerId?: string;
    userId?: string;
    [key: string]: any;
}
export declare class Logger {
    private static instance;
    private logger;
    private defaultContext;
    private constructor();
    static getInstance(): Logger;
    setDefaultContext(context: LogContext): void;
    generateCorrelationId(): string;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    private log;
    logWorkerPoll(workerId: string, duration: number, runsAcquired: number, context?: LogContext): void;
    logWorkerRunStart(workerId: string, runId: string, scheduleId: string, context?: LogContext): void;
    logWorkerRunComplete(workerId: string, runId: string, scheduleId: string, duration: number, status: string, context?: LogContext): void;
    logWorkerRunFailed(workerId: string, runId: string, scheduleId: string, error: Error, context?: LogContext): void;
    logApiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void;
    logApiError(method: string, path: string, error: Error, context?: LogContext): void;
    logDatabaseQuery(operation: string, table: string, duration: number, context?: LogContext): void;
    logDatabaseError(operation: string, table: string, error: Error, context?: LogContext): void;
    logCleanupOperation(operationType: string, deletedCount: number, duration: number, context?: LogContext): void;
    logMaterialization(schedulesProcessed: number, runsCreated: number, duration: number, context?: LogContext): void;
}
//# sourceMappingURL=Logger.d.ts.map