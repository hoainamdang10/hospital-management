"use strict";
/**
 * loggingMiddleware - Request Logging Middleware
 * Comprehensive logging middleware for notification service with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, HIPAA Compliance, Audit Logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.errorLoggingMiddleware = exports.auditLoggingMiddleware = exports.loggingMiddleware = void 0;
class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 10000; // Keep last 10k logs in memory
    }
    log(entry) {
        this.logs.push(entry);
        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        // Console logging with different levels
        if (entry.error) {
            console.error('🚨 [ERROR]', this.formatLogEntry(entry));
        }
        else if (entry.statusCode && entry.statusCode >= 400) {
            console.warn('⚠️ [WARN]', this.formatLogEntry(entry));
        }
        else if (entry.sensitiveDataAccessed) {
            console.info('🔒 [AUDIT]', this.formatLogEntry(entry));
        }
        else {
            console.log('📝 [INFO]', this.formatLogEntry(entry));
        }
        // In production, you would send logs to external logging service
        // this.sendToExternalLogger(entry);
    }
    formatLogEntry(entry) {
        const parts = [
            `${entry.method} ${entry.url}`,
            `Status: ${entry.statusCode || 'Pending'}`,
            `Time: ${entry.responseTime || 0}ms`,
            `User: ${entry.userId || 'Anonymous'}`,
            `Role: ${entry.userRole || 'Unknown'}`,
            `IP: ${entry.ip}`
        ];
        if (entry.healthcareContext) {
            const context = entry.healthcareContext;
            const contextParts = [];
            if (context.patientId)
                contextParts.push(`Patient: ${context.patientId}`);
            if (context.doctorId)
                contextParts.push(`Doctor: ${context.doctorId}`);
            if (context.appointmentId)
                contextParts.push(`Appointment: ${context.appointmentId}`);
            if (context.medicalRecordId)
                contextParts.push(`Record: ${context.medicalRecordId}`);
            if (context.action)
                contextParts.push(`Action: ${context.action}`);
            if (contextParts.length > 0) {
                parts.push(`Healthcare: [${contextParts.join(', ')}]`);
            }
        }
        if (entry.sensitiveDataAccessed) {
            parts.push('🔒 SENSITIVE_DATA');
        }
        if (entry.complianceFlags && entry.complianceFlags.length > 0) {
            parts.push(`Compliance: [${entry.complianceFlags.join(', ')}]`);
        }
        if (entry.error) {
            parts.push(`Error: ${entry.error}`);
        }
        return parts.join(' | ');
    }
    getRecentLogs(limit = 100) {
        return this.logs.slice(-limit);
    }
    getLogsByUser(userId, limit = 100) {
        return this.logs
            .filter(log => log.userId === userId)
            .slice(-limit);
    }
    getHealthcareLogs(context, limit = 100) {
        return this.logs
            .filter(log => {
            if (!log.healthcareContext)
                return false;
            if (context.patientId && log.healthcareContext.patientId !== context.patientId)
                return false;
            if (context.doctorId && log.healthcareContext.doctorId !== context.doctorId)
                return false;
            return true;
        })
            .slice(-limit);
    }
    getAuditLogs(limit = 100) {
        return this.logs
            .filter(log => log.sensitiveDataAccessed || (log.complianceFlags && log.complianceFlags.length > 0))
            .slice(-limit);
    }
}
const logger = new Logger();
exports.logger = logger;
const loggingMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    // Add request ID to headers for tracing
    req.headers['x-request-id'] = requestId;
    res.set('X-Request-ID', requestId);
    // Extract healthcare context from request
    const healthcareContext = extractHealthcareContext(req);
    // Determine if sensitive data might be accessed
    const sensitiveDataAccessed = checkSensitiveDataAccess(req);
    // Generate compliance flags
    const complianceFlags = generateComplianceFlags(req);
    // Create initial log entry
    const logEntry = {
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent') || 'Unknown',
        ip: req.ip || req.connection.remoteAddress || 'Unknown',
        userId: req.user?.id,
        userRole: req.user?.role,
        requestSize: getRequestSize(req),
        healthcareContext,
        sensitiveDataAccessed,
        complianceFlags
    };
    // Override res.end to capture response details
    const originalEnd = res.end;
    let responseBody = '';
    res.end = function (chunk, encoding, callback) {
        if (chunk) {
            responseBody += chunk;
        }
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        // Update log entry with response details
        logEntry.statusCode = res.statusCode;
        logEntry.responseTime = responseTime;
        logEntry.responseSize = Buffer.byteLength(responseBody, 'utf8');
        // Add error if response indicates failure
        if (res.statusCode >= 400) {
            try {
                const errorResponse = JSON.parse(responseBody);
                logEntry.error = errorResponse.error || errorResponse.message || 'Unknown error';
            }
            catch {
                logEntry.error = 'Response parsing failed';
            }
        }
        // Log the completed request
        logger.log(logEntry);
        // Call original end method
        originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.loggingMiddleware = loggingMiddleware;
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function extractHealthcareContext(req) {
    const context = {};
    // Extract from URL parameters
    if (req.params.patientId)
        context.patientId = req.params.patientId;
    if (req.params.doctorId)
        context.doctorId = req.params.doctorId;
    if (req.params.appointmentId)
        context.appointmentId = req.params.appointmentId;
    if (req.params.recordId)
        context.medicalRecordId = req.params.recordId;
    // Extract from request body
    if (req.body) {
        if (req.body.patientId)
            context.patientId = req.body.patientId;
        if (req.body.doctorId)
            context.doctorId = req.body.doctorId;
        if (req.body.appointmentId)
            context.appointmentId = req.body.appointmentId;
        if (req.body.medicalRecordId)
            context.medicalRecordId = req.body.medicalRecordId;
        if (req.body.healthcareContext) {
            Object.assign(context, req.body.healthcareContext);
        }
    }
    // Extract from query parameters
    if (req.query.patientId)
        context.patientId = req.query.patientId;
    if (req.query.doctorId)
        context.doctorId = req.query.doctorId;
    if (req.query.appointmentId)
        context.appointmentId = req.query.appointmentId;
    // Determine action based on method and path
    if (req.method === 'POST' && req.path.includes('/send')) {
        context.action = 'SEND_NOTIFICATION';
    }
    else if (req.method === 'POST' && req.path.includes('/schedule')) {
        context.action = 'SCHEDULE_NOTIFICATION';
    }
    else if (req.method === 'GET' && req.path.includes('/patient/')) {
        context.action = 'VIEW_PATIENT_NOTIFICATIONS';
    }
    else if (req.method === 'GET' && req.path.includes('/doctor/')) {
        context.action = 'VIEW_DOCTOR_NOTIFICATIONS';
    }
    else if (req.method === 'POST' && req.path.includes('/search')) {
        context.action = 'SEARCH_NOTIFICATIONS';
    }
    else if (req.method === 'PUT' && req.path.includes('/cancel')) {
        context.action = 'CANCEL_NOTIFICATION';
    }
    else if (req.method === 'PUT' && req.path.includes('/retry')) {
        context.action = 'RETRY_NOTIFICATION';
    }
    return Object.keys(context).length > 0 ? context : undefined;
}
function checkSensitiveDataAccess(req) {
    // Check if request involves sensitive healthcare data
    const sensitiveEndpoints = [
        '/patient/',
        '/medical-record/',
        '/test-results',
        '/medication-reminder'
    ];
    const involvesSensitiveData = sensitiveEndpoints.some(endpoint => req.path.includes(endpoint));
    // Check if request body contains sensitive data
    const sensitiveFields = [
        'patientId',
        'medicalRecordId',
        'testResults',
        'diagnosis',
        'medication',
        'symptoms'
    ];
    const containsSensitiveFields = req.body && sensitiveFields.some(field => req.body[field] || (req.body.templateData && req.body.templateData[field]));
    return involvesSensitiveData || containsSensitiveFields;
}
function generateComplianceFlags(req) {
    const flags = [];
    // HIPAA compliance flags
    if (checkSensitiveDataAccess(req)) {
        flags.push('HIPAA_PHI_ACCESS');
    }
    // Vietnamese healthcare compliance
    if (req.body?.templateData?.patientName || req.body?.patientId) {
        flags.push('VN_PATIENT_DATA');
    }
    // Audit trail requirements
    if (req.method !== 'GET') {
        flags.push('AUDIT_REQUIRED');
    }
    // Emergency notifications
    if (req.body?.priority === 'URGENT' || req.body?.templateType === 'EMERGENCY_ALERT') {
        flags.push('EMERGENCY_NOTIFICATION');
    }
    // Bulk operations
    if (req.path.includes('/bulk')) {
        flags.push('BULK_OPERATION');
    }
    // Administrative actions
    if (req.user?.role === 'ADMIN' && (req.method === 'DELETE' || req.path.includes('/admin'))) {
        flags.push('ADMIN_ACTION');
    }
    return flags;
}
function getRequestSize(req) {
    const contentLength = req.get('Content-Length');
    if (contentLength) {
        return parseInt(contentLength, 10);
    }
    // Estimate size from body if available
    if (req.body) {
        try {
            return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
        }
        catch {
            return 0;
        }
    }
    return 0;
}
/**
 * Healthcare audit logging middleware
 */
const auditLoggingMiddleware = (req, res, next) => {
    // Only audit sensitive operations
    if (!checkSensitiveDataAccess(req)) {
        return next();
    }
    const auditEntry = {
        timestamp: new Date().toISOString(),
        userId: req.user?.id || 'Anonymous',
        userRole: req.user?.role || 'Unknown',
        action: req.method + ' ' + req.path,
        ip: req.ip || 'Unknown',
        userAgent: req.get('User-Agent') || 'Unknown',
        healthcareContext: extractHealthcareContext(req),
        requestId: req.headers['x-request-id']
    };
    // In production, send to secure audit log storage
    console.log('🔒 [AUDIT]', JSON.stringify(auditEntry));
    next();
};
exports.auditLoggingMiddleware = auditLoggingMiddleware;
/**
 * Error logging middleware
 */
const errorLoggingMiddleware = (error, req, res, next) => {
    const errorEntry = {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent') || 'Unknown',
        ip: req.ip || 'Unknown',
        userId: req.user?.id,
        userRole: req.user?.role,
        statusCode: 500,
        requestSize: getRequestSize(req),
        error: error.message,
        healthcareContext: extractHealthcareContext(req),
        sensitiveDataAccessed: checkSensitiveDataAccess(req),
        complianceFlags: ['ERROR_OCCURRED', ...generateComplianceFlags(req)]
    };
    logger.log(errorEntry);
    // Don't expose internal errors to client
    res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi hệ thống',
        error: 'INTERNAL_SERVER_ERROR',
        requestId: errorEntry.requestId,
        timestamp: errorEntry.timestamp
    });
};
exports.errorLoggingMiddleware = errorLoggingMiddleware;
//# sourceMappingURL=loggingMiddleware.js.map