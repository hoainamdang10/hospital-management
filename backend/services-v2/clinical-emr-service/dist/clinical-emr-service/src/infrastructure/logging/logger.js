"use strict";
/**
 * Logger implementation for Clinical EMR Service
 * Provides consistent logging across the service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class ConsoleLogger {
    constructor() {
        this.serviceName = 'clinical-emr-service';
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
exports.logger = new ConsoleLogger();
//# sourceMappingURL=logger.js.map