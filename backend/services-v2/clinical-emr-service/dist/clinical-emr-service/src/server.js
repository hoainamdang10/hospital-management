"use strict";
/**
 * Clinical EMR Service - Server Entry Point
 * Main server startup and configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Express.js, HIPAA
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const http_1 = require("http");
const app_1 = require("./app");
const container_1 = require("./infrastructure/di/container");
const types_1 = require("./infrastructure/di/types");
/**
 * Start the Clinical EMR Service server
 */
async function startServer() {
    try {
        console.log(' Starting Clinical EMR Service...');
        console.log(' Service: clinical-emr-service');
        console.log(' Version: 2.0.0');
        console.log('️  Architecture: Clean Architecture + DDD + CQRS + Event-Driven');
        console.log(' Purpose: Graduation Thesis - Hospital Management System');
        console.log('');
        // Initialize application
        const app = await (0, app_1.initializeApp)();
        const config = container_1.container.get(types_1.TYPES.Config);
        // Create HTTP server
        const server = (0, http_1.createServer)(app);
        // Configure server timeouts
        server.timeout = 30000; // 30 seconds
        server.keepAliveTimeout = 65000; // 65 seconds
        server.headersTimeout = 66000; // 66 seconds
        // Start listening
        server.listen(config.port, config.host, () => {
            console.log(' Clinical EMR Service started successfully!');
            console.log('');
            console.log(' Service Information:');
            console.log(`    Host: ${config.host}`);
            console.log(`    Port: ${config.port}`);
            console.log(`    Environment: ${config.environment}`);
            console.log(`    Schema: ${config.databaseSchema}`);
            console.log('');
            console.log(' Available Endpoints:');
            console.log(`    Health Check: http://${config.host}:${config.port}/health`);
            console.log(`    Readiness: http://${config.host}:${config.port}/ready`);
            console.log(`    Liveness: http://${config.host}:${config.port}/live`);
            console.log(`    API Info: http://${config.host}:${config.port}/api/v2/clinical-emr`);
            console.log(`    Medical Records: http://${config.host}:${config.port}/api/v2/clinical-emr/medical-records`);
            console.log('');
            console.log(' Core Features:');
            console.log('    Basic Medical Records CRUD');
            console.log('    Simple Vital Signs Tracking');
            console.log('    Patient Medical History');
            console.log('    Vietnamese Language Support');
            console.log('    HIPAA Compliance');
            console.log('    Role-based Access Control');
            console.log('    Audit Logging');
            console.log('');
            console.log('️  Architecture Patterns:');
            console.log('    Clean Architecture');
            console.log('    Domain-Driven Design (DDD)');
            console.log('    Command Query Responsibility Segregation (CQRS)');
            console.log('    Event-Driven Architecture');
            console.log('    Repository Pattern');
            console.log('    Dependency Injection');
            console.log('');
            console.log(' Security & Compliance:');
            console.log('    JWT Authentication');
            console.log('    Role-based Authorization');
            console.log('    Row Level Security (RLS)');
            console.log('    PHI Data Protection');
            console.log('    Audit Trail');
            console.log('    Rate Limiting');
            console.log('');
            console.log(' Service is ready to handle requests!');
        });
        // Handle server errors
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            const bind = typeof config.port === 'string'
                ? 'Pipe ' + config.port
                : 'Port ' + config.port;
            switch (error.code) {
                case 'EACCES':
                    console.error(` ${bind} requires elevated privileges`);
                    process.exit(1);
                case 'EADDRINUSE':
                    console.error(` ${bind} is already in use`);
                    process.exit(1);
                default:
                    throw error;
            }
        });
        // Graceful shutdown handlers
        const gracefulShutdown = async (signal) => {
            console.log(`\n Received ${signal}, starting graceful shutdown...`);
            try {
                // Stop accepting new connections
                server.close(async () => {
                    console.log(' HTTP server closed');
                    try {
                        // Cleanup container and dependencies
                        const { cleanupContainer } = await Promise.resolve().then(() => __importStar(require('./infrastructure/di/container')));
                        await cleanupContainer();
                        console.log(' Container cleanup completed');
                        console.log(' Graceful shutdown completed');
                        process.exit(0);
                    }
                    catch (cleanupError) {
                        console.error(' Error during cleanup:', cleanupError);
                        process.exit(1);
                    }
                });
                // Force shutdown after timeout
                setTimeout(() => {
                    console.error('⏰ Graceful shutdown timeout, forcing exit');
                    process.exit(1);
                }, 10000); // 10 seconds timeout
            }
            catch (error) {
                console.error(' Error during graceful shutdown:', error);
                process.exit(1);
            }
        };
        // Register shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error(' Uncaught Exception:', error);
            console.error('Stack:', error.stack);
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error(' Unhandled Rejection at:', promise);
            console.error('Reason:', reason);
            process.exit(1);
        });
        // Handle warnings
        process.on('warning', (warning) => {
            console.warn('️  Warning:', warning.name);
            console.warn('Message:', warning.message);
            console.warn('Stack:', warning.stack);
        });
    }
    catch (error) {
        console.error(' Failed to start Clinical EMR Service:', error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace available');
        process.exit(1);
    }
}
/**
 * Display startup banner
 */
function displayBanner() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    CLINICAL EMR SERVICE                      ║');
    console.log('║                         Version 2.0.0                       ║');
    console.log('║                                                              ║');
    console.log('║              Hospital Management System V2                   ║');
    console.log('║                   Graduation Thesis Project                  ║');
    console.log('║                                                              ║');
    console.log('║  Architecture: Clean Architecture + DDD + CQRS + Events     ║');
    console.log('║  Compliance: HIPAA + Vietnamese Healthcare Standards        ║');
    console.log('║  Language: Vietnamese + English Technical Terms             ║');
    console.log('║                                                              ║');
    console.log('║  Features: Medical Records, Vital Signs, Patient History    ║');
    console.log('║  Security: JWT Auth, RBAC, RLS, Audit Logging              ║');
    console.log('║                                                              ║');
    console.log('║                     Ready to serve!                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
}
/**
 * Main entry point
 */
if (require.main === module) {
    displayBanner();
    startServer().catch((error) => {
        console.error(' Fatal error during startup:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map