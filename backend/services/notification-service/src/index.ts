import { getMetricsHandler, metricsMiddleware } from "@hospital/shared";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3011;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Metrics middleware and endpoint
app.use(metricsMiddleware("notification-service"));
app.get("/metrics", getMetricsHandler);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    service: "Hospital Notification Service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    features: {
      email: true,
      sms: false, // Will be enabled when Twilio is configured
      push: false, // Will be enabled when Firebase is configured
      realtime: true,
    },
  });
});

// Enhanced notification endpoints
app.post("/api/notifications/send", async (req, res) => {
  try {
    const { type, recipient, subject, message, data } = req.body;

    // Validate input
    if (!type || !recipient || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, recipient, message",
      });
    }

    let result;
    switch (type) {
      case "email":
        result = await sendEmailNotification(recipient, subject, message, data);
        break;
      case "sms":
        result = await sendSMSNotification(recipient, message);
        break;
      case "push":
        result = await sendPushNotification(recipient, subject, message, data);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid notification type. Supported: email, sms, push",
        });
    }

    return res.json({
      success: true,
      message: "Notification sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Notification send error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

// Appointment notification endpoints
app.post("/api/notifications/appointment/reminder", async (req, res) => {
  try {
    const { appointmentId, patientEmail, doctorName, appointmentTime } =
      req.body;

    const subject = "Nhắc nhở lịch khám - Hospital Management";
    const message = `
      Xin chào,

      Đây là lời nhắc về lịch khám của bạn:
      - Bác sĩ: ${doctorName}
      - Thời gian: ${appointmentTime}
      - Mã lịch khám: ${appointmentId}

      Vui lòng đến đúng giờ. Cảm ơn!

      Bệnh viện ABC
    `;

    const result = await sendEmailNotification(patientEmail, subject, message, {
      type: "appointment_reminder",
      appointmentId,
    });

    return res.json({
      success: true,
      message: "Appointment reminder sent",
      data: result,
    });
  } catch (error) {
    console.error("Appointment reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send appointment reminder",
    });
  }
});

app.get("/api/notifications", (req, res) => {
  // Return notification service status
  res.json({
    success: true,
    message: "Notification service is running",
    data: {
      service: "Hospital Notification Service",
      features: {
        email: !!process.env.SMTP_HOST,
        sms: !!process.env.TWILIO_ACCOUNT_SID,
        push: !!process.env.FIREBASE_SERVER_KEY,
      },
      endpoints: [
        "POST /api/notifications/send",
        "POST /api/notifications/appointment/reminder",
        "GET /api/notifications",
        "GET /health",
      ],
    },
  });
});

// Notification service functions
async function sendEmailNotification(
  recipient: string,
  subject: string,
  message: string,
  data?: any
) {
  // For demo purposes, we'll simulate email sending
  console.log(`📧 Email notification sent to: ${recipient}`);
  console.log(`📧 Subject: ${subject}`);
  console.log(`📧 Message: ${message}`);

  return {
    type: "email",
    recipient,
    subject,
    status: "sent",
    timestamp: new Date().toISOString(),
    messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

async function sendSMSNotification(recipient: string, message: string) {
  // Placeholder for SMS - would integrate with Twilio
  console.log(`📱 SMS notification sent to: ${recipient}`);
  console.log(`📱 Message: ${message}`);

  return {
    type: "sms",
    recipient,
    status: "sent",
    timestamp: new Date().toISOString(),
    messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

async function sendPushNotification(
  recipient: string,
  title: string,
  message: string,
  data?: any
) {
  // Placeholder for Push - would integrate with Firebase
  console.log(`🔔 Push notification sent to: ${recipient}`);
  console.log(`🔔 Title: ${title}`);
  console.log(`🔔 Message: ${message}`);

  return {
    type: "push",
    recipient,
    title,
    status: "sent",
    timestamp: new Date().toISOString(),
    messageId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
  console.log(
    `📧 Email notifications: ${process.env.SMTP_HOST ? "Configured" : "Not configured"}`
  );
  console.log(
    `📱 SMS notifications: ${process.env.TWILIO_ACCOUNT_SID ? "Configured" : "Not configured"}`
  );
  console.log(
    `🔥 Push notifications: ${process.env.FIREBASE_SERVER_KEY ? "Configured" : "Not configured"}`
  );
});

export default app;
