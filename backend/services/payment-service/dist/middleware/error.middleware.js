"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const shared_1 = require("@hospital/shared");
const errorHandler = (error, req, res, next) => {
    shared_1.logger.error('Unhandled error in payment service', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
    });
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    switch (error.name) {
        case 'ValidationError':
            statusCode = 400;
            message = 'Validation failed';
            break;
        case 'CastError':
            statusCode = 400;
            message = 'Invalid data format';
            break;
        case 'JsonWebTokenError':
            statusCode = 401;
            message = 'Invalid access token';
            break;
        case 'TokenExpiredError':
            statusCode = 401;
            message = 'Access token has expired';
            break;
        case 'MongoError':
        case 'PostgresError':
            statusCode = 500;
            message = 'Database error';
            break;
        default:
            if (error.message.includes('PayOS')) {
                statusCode = 502;
                message = 'Payment gateway error';
            }
            break;
    }
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal server error';
    }
    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : undefined,
        timestamp: new Date().toISOString(),
        path: req.path
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map