/**
 * Shared Logger for V2 Services
 * Provides consistent logging across all services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
export interface LogMetadata {
    [key: string]: any;
}
declare class ConsoleLogger {
    private serviceName;
    constructor(serviceName?: string);
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
}
declare const logger: ConsoleLogger;
export default logger;
//# sourceMappingURL=logger.d.ts.map