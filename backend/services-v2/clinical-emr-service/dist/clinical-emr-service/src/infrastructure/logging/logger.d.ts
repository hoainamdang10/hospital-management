/**
 * Logger implementation for Clinical EMR Service
 * Provides consistent logging across the service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
export interface LogMetadata {
    [key: string]: any;
}
export interface ILogger {
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
}
export declare const logger: ILogger;
//# sourceMappingURL=logger.d.ts.map