"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable ${name}`);
    }
    return value;
}
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3027),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    rabbitmqUrl: process.env.RABBITMQ_URL ?? "amqp://admin:admin@localhost:5673",
    rabbitmqExchange: process.env.RABBITMQ_EXCHANGE ?? "hospital.events",
    outbox: {
        enabled: process.env.OUTBOX_ENABLED !== "false",
        pollingIntervalMs: Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 5000),
        batchSize: Number(process.env.OUTBOX_BATCH_SIZE ?? 50),
    },
    integrationConsumer: {
        enabled: process.env.INTEGRATION_CONSUMER_ENABLED !== "false",
        queueName: process.env.INTEGRATION_QUEUE ??
            "clinical-emr-service.integration",
        prefetch: Number(process.env.INTEGRATION_PREFETCH ?? 5),
        routingKeys: (process.env.INTEGRATION_ROUTING_KEYS ??
            "patient.registered,patient.updated,provider.staff.created,provider.staff.updated,provider.staff.deactivated,appointment.completed,appointment.scheduled")
            .split(",")
            .map((key) => key.trim())
            .filter((key) => key.length > 0),
    },
    appointmentConsumer: {
        enabled: process.env.APPOINTMENT_CONSUMER_ENABLED !== "false",
        queueName: process.env.APPOINTMENT_QUEUE ??
            "clinical-emr-service.appointments",
        prefetch: Number(process.env.APPOINTMENT_PREFETCH ?? 10),
        routingKeys: (process.env.APPOINTMENT_ROUTING_KEYS ??
            "appointment.completed,appointment.checked_in,appointment.cancelled")
            .split(",")
            .map((key) => key.trim())
            .filter((key) => key.length > 0),
    },
    billingConsumer: {
        enabled: process.env.BILLING_CONSUMER_ENABLED !== "false",
        queueName: process.env.BILLING_QUEUE ??
            "clinical-emr-service.billing",
        prefetch: Number(process.env.BILLING_PREFETCH ?? 10),
        routingKeys: (process.env.BILLING_ROUTING_KEYS ??
            "billing.invoice.paid,billing.invoice.finalized,billing.insurance.claim.processed")
            .split(",")
            .map((key) => key.trim())
            .filter((key) => key.length > 0),
    },
};
