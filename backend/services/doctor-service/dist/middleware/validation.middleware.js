"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAvailabilityRequest = exports.validateWeekStartDate = exports.validateCheckAvailabilityBody = exports.validateAvailabilityQuery = exports.validateTimeFormat = exports.validateDateFormat = exports.validateDoctorId = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const validateDoctorId = (req, res, next) => {
    const { doctor_id } = req.params;
    if (!doctor_id) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Doctor ID is required", "MISSING_DOCTOR_ID"));
        return;
    }
    const doctorIdPattern = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;
    if (!doctorIdPattern.test(doctor_id)) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid doctor ID format. Expected format: DEPT-DOC-YYYYMM-XXX", "INVALID_DOCTOR_ID_FORMAT"));
        return;
    }
    next();
};
exports.validateDoctorId = validateDoctorId;
const validateDateFormat = (req, res, next) => {
    const { date } = req.params;
    if (!date) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Date is required", "MISSING_DATE"));
        return;
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid date format. Use YYYY-MM-DD", "INVALID_DATE_FORMAT"));
        return;
    }
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid date value", "INVALID_DATE_VALUE"));
        return;
    }
    next();
};
exports.validateDateFormat = validateDateFormat;
const validateTimeFormat = (req, res, next) => {
    const { start_time, end_time } = req.body;
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (start_time && !timePattern.test(start_time)) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid start_time format. Use HH:MM", "INVALID_START_TIME_FORMAT"));
        return;
    }
    if (end_time && !timePattern.test(end_time)) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid end_time format. Use HH:MM", "INVALID_END_TIME_FORMAT"));
        return;
    }
    if (start_time && end_time) {
        const startMinutes = timeToMinutes(start_time);
        const endMinutes = timeToMinutes(end_time);
        if (startMinutes >= endMinutes) {
            res
                .status(400)
                .json(response_helpers_1.ResponseHelper.error("start_time must be before end_time", "INVALID_TIME_RANGE"));
            return;
        }
    }
    next();
};
exports.validateTimeFormat = validateTimeFormat;
const validateAvailabilityQuery = (req, res, next) => {
    const { duration, appointment_type, include_breaks } = req.query;
    if (duration) {
        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum < 15 || durationNum > 120) {
            res
                .status(400)
                .json(response_helpers_1.ResponseHelper.error("Duration must be a number between 15 and 120 minutes", "INVALID_DURATION"));
            return;
        }
    }
    if (appointment_type) {
        const validTypes = [
            "consultation",
            "follow_up",
            "emergency",
            "routine_checkup",
        ];
        if (!validTypes.includes(appointment_type)) {
            res
                .status(400)
                .json(response_helpers_1.ResponseHelper.error(`Invalid appointment_type. Must be one of: ${validTypes.join(", ")}`, "INVALID_APPOINTMENT_TYPE"));
            return;
        }
    }
    if (include_breaks && !["true", "false"].includes(include_breaks)) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("include_breaks must be true or false", "INVALID_INCLUDE_BREAKS"));
        return;
    }
    next();
};
exports.validateAvailabilityQuery = validateAvailabilityQuery;
const validateCheckAvailabilityBody = (req, res, next) => {
    const { date, start_time, end_time } = req.body;
    if (!date || !start_time || !end_time) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Missing required fields: date, start_time, end_time", "MISSING_REQUIRED_FIELDS"));
        return;
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid date format. Use YYYY-MM-DD", "INVALID_DATE_FORMAT"));
        return;
    }
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(start_time) || !timePattern.test(end_time)) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid time format. Use HH:MM", "INVALID_TIME_FORMAT"));
        return;
    }
    const startMinutes = timeToMinutes(start_time);
    const endMinutes = timeToMinutes(end_time);
    if (startMinutes >= endMinutes) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("start_time must be before end_time", "INVALID_TIME_RANGE"));
        return;
    }
    const requestDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestDate < today) {
        logger_1.default.warn("Availability check for past date", {
            date,
            today: today.toISOString().split("T")[0],
        });
    }
    next();
};
exports.validateCheckAvailabilityBody = validateCheckAvailabilityBody;
const validateWeekStartDate = (req, res, next) => {
    const { startDate } = req.params;
    if (!startDate) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Start date is required", "MISSING_START_DATE"));
        return;
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(startDate)) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid start date format. Use YYYY-MM-DD", "INVALID_START_DATE_FORMAT"));
        return;
    }
    const dateObj = new Date(startDate);
    if (isNaN(dateObj.getTime())) {
        res
            .status(400)
            .json(response_helpers_1.ResponseHelper.error("Invalid start date value", "INVALID_START_DATE_VALUE"));
        return;
    }
    next();
};
exports.validateWeekStartDate = validateWeekStartDate;
const logAvailabilityRequest = (req, res, next) => {
    logger_1.default.info("🔍 [Availability] Request received", {
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        body: req.method === "POST" ? req.body : undefined,
        user_agent: req.headers["user-agent"],
        ip: req.ip,
    });
    next();
};
exports.logAvailabilityRequest = logAvailabilityRequest;
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
}
//# sourceMappingURL=validation.middleware.js.map