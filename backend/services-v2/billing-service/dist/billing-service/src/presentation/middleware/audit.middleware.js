"use strict";
/**
 * Audit Middleware - Presentation Layer
 * HIPAA-compliant audit logging for sensitive operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards, Security Audit
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = void 0;
exports.createAuditMiddleware = createAuditMiddleware;
exports.hipaaAuditMiddleware = hipaaAuditMiddleware;
/**
 * Sensitive operations that require audit logging
 */
const SENSITIVE_OPERATIONS = [
    '/invoices',
    '/payments',
    '/insurance',
    '/claims',
    '/refunds',
    '/reports'
];
/**
 * Check if request is for sensitive operation
 */
function isSensitiveOperation(path) {
    return SENSITIVE_OPERATIONS.some(op => path.includes(op));
}
/**
 * Extract healthcare context from request
 */
function extractHealthcareContext(req) {
    const context = {};
    // Extract from params
    if (req.params.patientId)
        context.patientId = req.params.patientId;
    if (req.params.invoiceId)
        context.invoiceId = req.params.invoiceId;
    if (req.params.paymentId)
        context.paymentId = req.params.paymentId;
    if (req.params.claimId)
        context.claimId = req.params.claimId;
    // Extract from body
    if (req.body?.patientId)
        context.patientId = req.body.patientId;
    if (req.body?.invoiceId)
        context.invoiceId = req.body.invoiceId;
    if (req.body?.paymentId)
        context.paymentId = req.body.paymentId;
    if (req.body?.claimId)
        context.claimId = req.body.claimId;
    // Determine access type
    switch (req.method) {
        case 'GET':
            context.accessType = 'read';
            break;
        case 'POST':
            context.accessType = 'write';
            break;
        case 'PUT':
        case 'PATCH':
            context.accessType = 'update';
            break;
        case 'DELETE':
            context.accessType = 'delete';
            break;
    }
    // Determine data classification
    if (req.path.includes('/patient') || req.path.includes('/insurance')) {
        context.dataClassification = 'PHI'; // Protected Health Information
    }
    else if (req.path.includes('/payment') || req.path.includes('/invoice')) {
        context.dataClassification = 'Financial';
    }
    else {
        context.dataClassification = 'Public';
    }
    return context;
}
/**
 * Determine action from request
 */
function determineAction(req) {
    const method = req.method;
    const path = req.path;
    if (path.includes('/invoice')) {
        if (method === 'POST')
            return 'CREATE_INVOICE';
        if (method === 'GET')
            return 'VIEW_INVOICE';
        if (method === 'PUT' || method === 'PATCH')
            return 'UPDATE_INVOICE';
        if (method === 'DELETE')
            return 'DELETE_INVOICE';
    }
    if (path.includes('/payment')) {
        if (method === 'POST')
            return 'PROCESS_PAYMENT';
        if (method === 'GET')
            return 'VIEW_PAYMENT';
    }
    if (path.includes('/insurance') || path.includes('/claim')) {
        if (method === 'POST')
            return 'SUBMIT_CLAIM';
        if (method === 'GET')
            return 'VIEW_CLAIM';
        if (method === 'PUT' || method === 'PATCH')
            return 'UPDATE_CLAIM';
    }
    if (path.includes('/refund')) {
        return 'PROCESS_REFUND';
    }
    if (path.includes('/report')) {
        return 'GENERATE_REPORT';
    }
    return `${method}_${path.split('/').pop()?.toUpperCase() || 'UNKNOWN'}`;
}
/**
 * Extract resource from request
 */
function extractResource(req) {
    const pathParts = req.path.split('/').filter(p => p);
    return pathParts[pathParts.length - 1] || 'unknown';
}
/**
 * Audit middleware factory
 */
function createAuditMiddleware(logger) {
    return (req, res, next) => {
        // Skip audit for non-sensitive operations
        if (!isSensitiveOperation(req.path)) {
            return next();
        }
        // Skip audit for health checks
        if (req.path === '/health' || req.path === '/ready') {
            return next();
        }
        // Create audit log entry
        const auditEntry = {
            timestamp: new Date().toISOString(),
            userId: req.user?.id || 'anonymous',
            userRole: req.user?.role || 'unknown',
            action: determineAction(req),
            resource: extractResource(req),
            resourceId: req.params.id || req.params.invoiceId || req.params.paymentId,
            method: req.method,
            path: req.path,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown',
            requestId: req.headers['x-request-id'] || 'unknown',
            correlationId: req.headers['x-correlation-id'] || 'unknown',
            healthcareContext: extractHealthcareContext(req)
        };
        // Attach to request for later use
        req.auditLog = auditEntry;
        // Log on response finish
        res.on('finish', () => {
            auditEntry.statusCode = res.statusCode;
            auditEntry.success = res.statusCode >= 200 && res.statusCode < 300;
            // Log audit entry
            if (logger) {
                logger.info('Audit Log', auditEntry);
            }
            else {
                console.log('🔒 [AUDIT]', JSON.stringify(auditEntry, null, 2));
            }
            // In production, send to secure audit log storage (Supabase, CloudWatch, etc.)
            if (process.env.NODE_ENV === 'production') {
                // TODO: Send to audit log storage
                // await auditLogService.store(auditEntry);
            }
        });
        next();
    };
}
/**
 * Default audit middleware (without logger)
 */
exports.auditMiddleware = createAuditMiddleware();
/**
 * HIPAA compliance audit middleware
 * Stricter logging for PHI access
 */
function hipaaAuditMiddleware(req, res, next) {
    const healthcareContext = extractHealthcareContext(req);
    // Log PHI access immediately
    if (healthcareContext.dataClassification === 'PHI') {
        console.log('🏥 [HIPAA AUDIT] PHI Access:', {
            timestamp: new Date().toISOString(),
            userId: req.user?.id || 'anonymous',
            action: determineAction(req),
            patientId: healthcareContext.patientId,
            accessType: healthcareContext.accessType,
            ipAddress: req.ip
        });
    }
    next();
}
//# sourceMappingURL=audit.middleware.js.map