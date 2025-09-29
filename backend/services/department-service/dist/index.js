"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_config_1 = require("./config/database.config");
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const specialty_routes_1 = __importDefault(require("./routes/specialty.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const validation_middleware_1 = require("@hospital/shared/dist/middleware/validation.middleware");
const versioning_middleware_1 = require("@hospital/shared/dist/middleware/versioning.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
const SERVICE_NAME = 'Hospital Department Service';
const SERVICE_VERSION = '1.0.0';
response_helpers_1.ResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(response_helpers_1.addRequestId);
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(validation_middleware_1.sanitizeInput);
app.use((0, versioning_middleware_1.createVersioningMiddleware)());
app.use((0, versioning_middleware_1.responseTransformMiddleware)());
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await (0, database_config_1.testConnection)();
        const status = dbConnected ? 'healthy' : 'unhealthy';
        const statusCode = dbConnected ? 200 : 503;
        const healthCheck = response_helpers_1.ResponseHelper.healthCheck(status, {
            database: {
                status: dbConnected ? 'healthy' : 'unhealthy',
                responseTime: 50
            }
        }, {
            department_management: true,
            specialty_management: true,
            room_management: true,
            hierarchy_support: true,
            statistics: true
        });
        res.status(statusCode).json(healthCheck);
    }
    catch (error) {
        logger_1.default.error('Health check error:', error);
        const errorHealthCheck = response_helpers_1.ResponseHelper.healthCheck('unhealthy', {
            database: {
                status: 'unhealthy',
                error: error.message
            }
        });
        res.status(503).json(errorHealthCheck);
    }
});
app.use('/api/departments', department_routes_1.default);
app.use('/api/specialties', specialty_routes_1.default);
app.use('/api/rooms', room_routes_1.default);
app.get('/', (req, res) => {
    res.json({
        service: 'Hospital Department Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            departments: '/api/departments',
            specialties: '/api/specialties',
            rooms: '/api/rooms',
        },
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        service: 'Hospital Department Service',
        timestamp: new Date().toISOString(),
    });
});
app.use(response_helpers_1.globalErrorHandler);
const startServer = async () => {
    try {
        const dbConnected = await (0, database_config_1.testConnection)();
        if (!dbConnected) {
            logger_1.default.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }
        app.listen(PORT, () => {
            logger_1.default.info(`🏥 Department Service started successfully`, {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
            });
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map