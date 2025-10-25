"use strict";
/**
 * Shared Logger for V2 Services
 * Provides consistent logging across all services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
class ConsoleLogger {
    constructor(serviceName = 'hospital-service') {
        this.serviceName = serviceName;
    }
    info(message, metadata) {
        console.log(`[${this.serviceName}] INFO:`, message, metadata || '');
    }
    warn(message, metadata) {
        console.warn(`[${this.serviceName}] WARN:`, message, metadata || '');
    }
    error(message, metadata) {
        console.error(`[${this.serviceName}] ERROR:`, message, metadata || '');
    }
    debug(message, metadata) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[${this.serviceName}] DEBUG:`, message, metadata || '');
        }
    }
}
const logger = new ConsoleLogger();
exports.default = logger;
//# sourceMappingURL=logger.js.map