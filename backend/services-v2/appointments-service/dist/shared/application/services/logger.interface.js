"use strict";
/**
 * Logger Interface
 * Standard logging interface for all services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = void 0;
/**
 * Console Logger Implementation
 * Simple logger for development/testing
 */
class ConsoleLogger {
    constructor(serviceName = 'service') {
        this.serviceName = serviceName;
    }
    debug(message, meta = {}) {
        console.log(`[DEBUG] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    }
    info(message, meta = {}) {
        console.log(`[INFO] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    }
    warn(message, meta = {}) {
        console.warn(`[WARN] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    }
    error(message, meta = {}) {
        console.error(`[ERROR] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    }
    fatal(message, meta = {}) {
        console.error(`[FATAL] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=logger.interface.js.map