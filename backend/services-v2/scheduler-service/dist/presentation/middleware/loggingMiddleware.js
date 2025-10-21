"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMiddleware = loggingMiddleware;
const Logger_1 = require("../../infrastructure/observability/Logger");
const logger = Logger_1.Logger.getInstance();
function loggingMiddleware(req, res, next) {
    const correlationId = req.correlationId || logger.generateCorrelationId();
    const startTime = Date.now();
    // Set correlation ID in logger context
    logger.setDefaultContext({ correlationId });
    // Log incoming request
    logger.debug('Incoming request', {
        correlationId,
        method: req.method,
        path: req.path,
        query: req.query,
        headers: {
            'user-agent': req.get('user-agent'),
            'content-type': req.get('content-type')
        },
        ip: req.ip
    });
    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        // Log response
        logger.debug('Outgoing response', {
            correlationId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            responseSize: data ? Buffer.byteLength(JSON.stringify(data)) : 0
        });
        return originalSend.call(this, data);
    };
    next();
}
//# sourceMappingURL=loggingMiddleware.js.map