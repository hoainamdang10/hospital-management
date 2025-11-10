export interface RabbitMQRetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    connectionName?: string;
}
export type LoggerLike = {
    info?: (message: string, meta?: Record<string, unknown>) => void;
    warn?: (message: string, meta?: Record<string, unknown>) => void;
    error?: (message: string, meta?: Record<string, unknown>) => void;
};
/**
 * Helper to execute a RabbitMQ connection function with retry logic.
 */
export declare function connectRabbitMQWithRetry<T>(connectFn: () => Promise<T>, logger?: LoggerLike, options?: RabbitMQRetryOptions): Promise<T>;
//# sourceMappingURL=rabbitmq-connection.d.ts.map