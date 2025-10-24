"use strict";
/**
 * Scheduling Service - Main Entry Point
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @port 3024
 * @schema scheduling_schema
 */
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
const container_1 = require("./infrastructure/di/container");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3024;
const SERVICE_NAME = 'scheduling-service';
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
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=main.js.map