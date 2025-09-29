import logger from "@hospital/shared/dist/utils/logger";
import { ResponseHelper } from "@hospital/shared/dist/utils/response-helpers";
import { NextFunction, Request, Response } from "express";

/**
 * Validate doctor ID format
 */
export const validateDoctorId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { doctor_id } = req.params;

  if (!doctor_id) {
    res
      .status(400)
      .json(ResponseHelper.error("Doctor ID is required", "MISSING_DOCTOR_ID"));
    return;
  }

  // Validate doctor ID format (e.g., GENE-DOC-202506-006)
  const doctorIdPattern = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;
  if (!doctorIdPattern.test(doctor_id)) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Invalid doctor ID format. Expected format: DEPT-DOC-YYYYMM-XXX",
          "INVALID_DOCTOR_ID_FORMAT"
        )
      );
    return;
  }

  next();
};

/**
 * Validate date format (YYYY-MM-DD)
 */
export const validateDateFormat = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { date } = req.params;

  if (!date) {
    res
      .status(400)
      .json(ResponseHelper.error("Date is required", "MISSING_DATE"));
    return;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(date)) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Invalid date format. Use YYYY-MM-DD",
          "INVALID_DATE_FORMAT"
        )
      );
    return;
  }

  // Validate that it's a valid date
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    res
      .status(400)
      .json(ResponseHelper.error("Invalid date value", "INVALID_DATE_VALUE"));
    return;
  }

  next();
};

/**
 * Validate time format (HH:MM)
 */
export const validateTimeFormat = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { start_time, end_time } = req.body;

  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (start_time && !timePattern.test(start_time)) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Invalid start_time format. Use HH:MM",
          "INVALID_START_TIME_FORMAT"
        )
      );
    return;
  }

  if (end_time && !timePattern.test(end_time)) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Invalid end_time format. Use HH:MM",
          "INVALID_END_TIME_FORMAT"
        )
      );
    return;
  }

  // Validate that start_time is before end_time
  if (start_time && end_time) {
    const startMinutes = timeToMinutes(start_time);
    const endMinutes = timeToMinutes(end_time);

    if (startMinutes >= endMinutes) {
      res
        .status(400)
        .json(
          ResponseHelper.error(
            "start_time must be before end_time",
            "INVALID_TIME_RANGE"
          )
        );
      return;
    }
  }

  next();
};

/**
 * Validate availability query parameters
 */
export const validateAvailabilityQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { duration, appointment_type, include_breaks } = req.query;

  // Validate duration
  if (duration) {
    const durationNum = parseInt(duration as string);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 120) {
      res
        .status(400)
        .json(
          ResponseHelper.error(
            "Duration must be a number between 15 and 120 minutes",
            "INVALID_DURATION"
          )
        );
      return;
    }
  }

  // Validate appointment_type
  if (appointment_type) {
    const validTypes = [
      "consultation",
      "follow_up",
      "emergency",
      "routine_checkup",
    ];
    if (!validTypes.includes(appointment_type as string)) {
      res
        .status(400)
        .json(
          ResponseHelper.error(
            `Invalid appointment_type. Must be one of: ${validTypes.join(", ")}`,
            "INVALID_APPOINTMENT_TYPE"
          )
        );
      return;
    }
  }

  // Validate include_breaks
  if (include_breaks && !["true", "false"].includes(include_breaks as string)) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "include_breaks must be true or false",
          "INVALID_INCLUDE_BREAKS"
        )
      );
    return;
  }

  next();
};

/**
 * Validate check availability request body
 */
export const validateCheckAvailabilityBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { date, start_time, end_time } = req.body;

  // Check required fields
  if (!date || !start_time || !end_time) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Missing required fields: date, start_time, end_time",
          "MISSING_REQUIRED_FIELDS"
        )
      );
    return;
  }

  // Validate date format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(date)) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Invalid date format. Use YYYY-MM-DD",
          "INVALID_DATE_FORMAT"
        )
      );
    return;
  }

  // Validate time formats
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timePattern.test(start_time) || !timePattern.test(end_time)) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Invalid time format. Use HH:MM",
          "INVALID_TIME_FORMAT"
        )
      );
    return;
  }

  // Validate time range
  const startMinutes = timeToMinutes(start_time);
  const endMinutes = timeToMinutes(end_time);

  if (startMinutes >= endMinutes) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "start_time must be before end_time",
          "INVALID_TIME_RANGE"
        )
      );
    return;
  }

  // Validate date is not in the past (optional - you might want to allow past dates for testing)
  const requestDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (requestDate < today) {
    logger.warn("Availability check for past date", {
      date,
      today: today.toISOString().split("T")[0],
    });
    // Note: Not blocking past dates for testing purposes
  }

  next();
};

/**
 * Validate week start date
 */
export const validateWeekStartDate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { startDate } = req.params;

  if (!startDate) {
    res
      .status(400)
      .json(
        ResponseHelper.error("Start date is required", "MISSING_START_DATE")
      );
    return;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(startDate)) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Invalid start date format. Use YYYY-MM-DD",
          "INVALID_START_DATE_FORMAT"
        )
      );
    return;
  }

  // Validate that it's a valid date
  const dateObj = new Date(startDate);
  if (isNaN(dateObj.getTime())) {
    res
      .status(400)
      .json(
        ResponseHelper.error(
          "Invalid start date value",
          "INVALID_START_DATE_VALUE"
        )
      );
    return;
  }

  next();
};

/**
 * General request logging middleware
 */
export const logAvailabilityRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.info("🔍 [Availability] Request received", {
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

/**
 * Utility function to convert time string to minutes
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}
