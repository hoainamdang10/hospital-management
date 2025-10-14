"use strict";
/**
 * Logger Module
 * Centralized logging for the Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    debug: (message, meta) => {
        console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    info: (message, meta) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    error: (message, meta) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    fatal: (message, meta) => {
        console.error(`[FATAL] ${new Date().toISOString()} - ${message}`, meta || '');
    }
};
//# sourceMappingURL=Logger.js.map