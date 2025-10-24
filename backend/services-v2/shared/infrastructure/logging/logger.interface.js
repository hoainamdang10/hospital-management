"use strict";
/**
 * Logger Interface
 * Hospital Management System V2
 *
 * Standard logging interface for all services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = void 0;
/**
 * Console Logger Implementation
 * Simple logger that outputs to console
 */
class ConsoleLogger {
    constructor(serviceName = 'Unknown') {
        this.serviceName = serviceName;
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    fatal(message, meta) {
        this.log('fatal', message, meta);
    }
    log(level, message, meta) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${this.serviceName}] [${level.toUpperCase()}] ${message}`;
        const consoleMethod = level === 'fatal' || level === 'error' ? 'error' :
            level === 'warn' ? 'warn' :
                level === 'debug' ? 'debug' : 'log';
        if (meta && Object.keys(meta).length > 0) {
            console[consoleMethod](logMessage, meta);
        }
        else {
            console[consoleMethod](logMessage);
        }
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=logger.interface.js.map