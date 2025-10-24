"use strict";
/**
 * Appointments Service - Main Entry Point
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @port 3024
 * @schema appointments_schema
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const appointment_routes_1 = require("./presentation/routes/appointment.routes");
const appointmentQueryRoutes_1 = require("./presentation/routes/appointmentQueryRoutes");
const availability_routes_1 = require("./presentation/routes/availability.routes");
const container_1 = require("./infrastructure/di/container");
const IdempotencyMiddleware_1 = require("./presentation/middleware/IdempotencyMiddleware");
const RedisCacheService_1 = require("./infrastructure/cache/RedisCacheService");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3024;
const SERVICE_NAME = 'appointments-service';
// Initialize DI Container
console.log('[Main] Initializing DI Container...');
const container = (0, container_1.getContainer)();
console.log('[Main] DI Container initialized successfully');
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Connect Redis (best-effort)
RedisCacheService_1.redisCacheService.connect().catch(() => console.warn('[Main] Redis not connected, idempotency will be in fail-open mode'));
// Idempotency for write endpoints
app.use(IdempotencyMiddleware_1.idempotencyMiddleware);
// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        service: SERVICE_NAME,
        status: 'healthy',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        port: PORT,
        features: [
            'Appointment Scheduling',
            'Appointment Management',
            'Clean Architecture',
            'DDD',
            'CQRS',
            'CQRS Read Model',
            'Event-Driven Architecture'
        ]
    });
});
// API Routes
// V1 - Command routes (Write operations) + Legacy queries
app.use('/api/v1', (0, appointment_routes_1.createAppointmentRoutes)());
// V2 - Query routes (Read Model with denormalized data)
app.use('/api/v2', (0, appointmentQueryRoutes_1.createAppointmentQueryRoutes)());
// Availability routes (Provider schedule & available slots)
app.use('/api/appointments', (0, availability_routes_1.createAvailabilityRoutes)());
// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});
// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
    });
});
// Start server
const server = app.listen(PORT, async () => {
    console.log('='.repeat(60));
    console.log(`🏥 ${SERVICE_NAME.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log('='.repeat(60));
    console.log('📋 API V1 - Command Endpoints (Write Model):');
    console.log(`   POST   /api/v1/appointments - Schedule appointment`);
    console.log(`   POST   /api/v1/appointments/:id/confirm - Confirm appointment`);
    console.log(`   POST   /api/v1/appointments/:id/complete - Complete appointment`);
    console.log(`   POST   /api/v1/appointments/:id/cancel - Cancel appointment`);
    console.log(`   GET    /api/v1/appointments/:id - Get appointment (legacy)`);
    console.log(`   GET    /api/v1/appointments - List appointments (legacy)`);
    console.log('='.repeat(60));
    console.log('📊 API V2 - Query Endpoints (Read Model with Patient/Doctor Info):');
    console.log(`   GET    /api/v2/appointments/:id - Get appointment details`);
    console.log(`   GET    /api/v2/appointments - List appointments with filters`);
    console.log(`   GET    /api/v2/patients/:patientId/appointments - Patient appointments`);
    console.log(`   GET    /api/v2/doctors/:doctorId/appointments - Doctor appointments`);
    console.log('='.repeat(60));
    // Connect event subscriptions
    try {
        console.log('[Main] Connecting event subscriptions...');
        const eventSubscriptions = container.getEventSubscriptions();
        await eventSubscriptions.connect();
        console.log('[Main] ✅ Event subscriptions connected');
    }
    catch (error) {
        console.error('[Main] ⚠️ Failed to connect event subscriptions:', error);
        console.error('[Main] ⚠️ Service will continue without event subscriptions');
    }
    // Start Outbox Publisher Worker
    try {
        const { OutboxRepository } = await Promise.resolve().then(() => __importStar(require('./infrastructure/outbox/OutboxRepository')));
        const { OutboxPublisherWorker } = await Promise.resolve().then(() => __importStar(require('./infrastructure/outbox/OutboxPublisherWorker')));
        const { RemoteSchedulerAdapter } = await Promise.resolve().then(() => __importStar(require('@hospital/scheduler-client')));
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const outboxRepo = new OutboxRepository(supabaseUrl, supabaseKey);
        const schedulerURL = process.env.SCHEDULER_SERVICE_URL || 'http://localhost:3030';
        const schedulerApiKey = process.env.SCHEDULER_API_KEY;
        const scheduler = new RemoteSchedulerAdapter({ baseURL: schedulerURL, apiKey: schedulerApiKey, timeout: 5000, retries: 3 });
        const worker = new OutboxPublisherWorker(outboxRepo, scheduler, {
            intervalMs: Number(process.env.OUTBOX_POLL_INTERVAL_MS || 5000),
            batchSize: Number(process.env.OUTBOX_BATCH_SIZE || 50),
            baseDelayMs: Number(process.env.OUTBOX_BASE_DELAY_MS || 5000),
            maxDelayMs: Number(process.env.OUTBOX_MAX_DELAY_MS || 600000)
        });
        worker.start();
        app.outboxWorker = worker;
        console.log('[Main] ✅ Outbox publisher worker started');
    }
    catch (e) {
        console.error('[Main] ⚠️ Failed to start Outbox publisher worker:', e);
    }
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    // Disconnect event subscriptions
    try {
        const eventSubscriptions = container.getEventSubscriptions();
        await eventSubscriptions.disconnect();
        console.log('Event subscriptions disconnected');
    }
    catch (error) {
        console.error('Failed to disconnect event subscriptions:', error);
    }
    try {
        const worker = app.outboxWorker;
        if (worker)
            worker.stop();
    }
    catch { }
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    // Disconnect event subscriptions
    try {
        const eventSubscriptions = container.getEventSubscriptions();
        await eventSubscriptions.disconnect();
        console.log('Event subscriptions disconnected');
    }
    catch (error) {
        console.error('Failed to disconnect event subscriptions:', error);
    }
    try {
        const worker = app.outboxWorker;
        if (worker)
            worker.stop();
    }
    catch { }
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=main.js.map