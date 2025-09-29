"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllParameterMappings = exports.hasParameterMapping = exports.getMappedParameterName = exports.parameterMappingMiddleware = void 0;
const PARAMETER_MAPPINGS = {
    'doctor-id': 'doctor_id',
    'patient-id': 'patient_id',
    'appointment-id': 'appointment_id',
    'department-id': 'department_id',
    'profile-id': 'profile_id',
    'experience-id': 'experience_id',
    'schedule-id': 'schedule_id',
    'review-id': 'review_id',
    'room-id': 'room_id',
    'template-id': 'template_id',
    'record-id': 'record_id',
    'payment-id': 'payment_id',
    'notification-id': 'notification_id',
    'medical-record-id': 'medical_record_id',
    'prescription-id': 'prescription_id',
    'lab-result-id': 'lab_result_id',
    'vital-sign-id': 'vital_sign_id',
    'attachment-id': 'attachment_id',
    'billing-id': 'billing_id',
    'invoice-id': 'invoice_id',
    'specialty-id': 'specialty_id',
    'shift-id': 'shift_id',
    'slot-id': 'slot_id',
    'exception-id': 'exception_id',
    'availability-id': 'availability_id'
};
const parameterMappingMiddleware = (req, res, next) => {
    try {
        const mappedParams = { ...req.params };
        Object.keys(req.params).forEach(kebabParam => {
            const snakeParam = PARAMETER_MAPPINGS[kebabParam];
            if (snakeParam) {
                mappedParams[snakeParam] = req.params[kebabParam];
            }
        });
        req.params = mappedParams;
        next();
    }
    catch (error) {
        console.error('Parameter mapping error:', error);
        next(error);
    }
};
exports.parameterMappingMiddleware = parameterMappingMiddleware;
const getMappedParameterName = (kebabCase) => {
    return PARAMETER_MAPPINGS[kebabCase] || kebabCase;
};
exports.getMappedParameterName = getMappedParameterName;
const hasParameterMapping = (kebabCase) => {
    return kebabCase in PARAMETER_MAPPINGS;
};
exports.hasParameterMapping = hasParameterMapping;
const getAllParameterMappings = () => {
    return { ...PARAMETER_MAPPINGS };
};
exports.getAllParameterMappings = getAllParameterMappings;
exports.default = exports.parameterMappingMiddleware;
//# sourceMappingURL=parameter-mapping.middleware.js.map