/**
 * Console Logger Implementation - Shared Infrastructure
 * Standard console-based logger for all services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ILogger, LogMetadata } from './logger.interface';
export declare class ConsoleLogger implements ILogger {
    private serviceName;
    constructor(serviceName?: string);
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
}
//# sourceMappingURL=console-logger.d.ts.map