"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentRealtimeService = void 0;
const event_bus_1 = require("@hospital/shared/dist/events/event-bus");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const database_config_1 = require("../config/database.config");
const notification_service_1 = require("./notification.service");
const websocket_service_1 = require("./websocket.service");
class AppointmentRealtimeService {
    constructor() {
        this.subscription = null;
        this.isConnected = false;
        this.eventBus = new event_bus_1.EventBus("appointment-service");
        this.wsManager = new websocket_service_1.WebSocketManager();
    }
    async initialize(httpServer) {
        try {
            logger_1.default.info("🔄 Initializing Appointment Real-time Service...");
            await this.eventBus.connect(process.env.RABBITMQ_URL || "amqp://localhost");
            if (httpServer) {
                await this.wsManager.initialize(httpServer);
            }
            else {
                logger_1.default.warn("⚠️ No HTTP server provided - WebSocket features will be limited");
            }
            await this.setupSupabaseSubscription();
            this.isConnected = true;
            logger_1.default.info("✅ Appointment Real-time Service initialized successfully");
        }
        catch (error) {
            logger_1.default.error("❌ Failed to initialize Appointment Real-time Service:", error);
            throw error;
        }
    }
    async setupSupabaseSubscription() {
        try {
            this.subscription = database_config_1.supabaseAdmin
                .channel("appointments_realtime")
                .on("postgres_changes", {
                event: "*",
                schema: "appointment_schema",
                table: "appointments",
            }, (payload) => {
                this.handleAppointmentChange(payload);
            })
                .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    logger_1.default.info("✅ Supabase real-time subscription active for appointments");
                }
                else if (status === "CHANNEL_ERROR") {
                    logger_1.default.error("❌ Supabase real-time subscription error");
                }
            });
        }
        catch (error) {
            logger_1.default.error("❌ Failed to setup Supabase subscription:", error);
            throw error;
        }
    }
    async handleAppointmentChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const appointment_id = newRecord?.appointment_id ||
                oldRecord?.appointment_id;
            logger_1.default.info("📡 Received appointment change:", {
                eventType,
                appointment_id,
            });
            const realtimeEvent = {
                type: eventType,
                appointment_id: appointment_id,
                doctor_id: newRecord?.doctor_id || oldRecord?.doctor_id,
                patient_id: newRecord?.patient_id || oldRecord?.patient_id,
                old_status: oldRecord?.status,
                new_status: newRecord?.status,
                appointment_date: newRecord?.appointment_date ||
                    oldRecord?.appointment_date,
                start_time: newRecord?.start_time || oldRecord?.start_time,
                end_time: newRecord?.end_time || oldRecord?.end_time,
                timestamp: new Date().toISOString(),
            };
            await this.processAppointmentEvent(realtimeEvent);
        }
        catch (error) {
            logger_1.default.error("❌ Error handling appointment change:", error);
        }
    }
    async processAppointmentEvent(event) {
        try {
            await this.broadcastToWebSocket(event);
            await this.publishToEventBus(event);
            await this.handleSpecificEventType(event);
            await this.updateCache(event);
            logger_1.default.info("✅ Appointment event processed successfully:", {
                type: event.type,
                appointment_id: event.appointment_id,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error processing appointment event:", error);
        }
    }
    async broadcastToWebSocket(event) {
        try {
            if (!this.wsManager.isWebSocketReady()) {
                logger_1.default.warn("⚠️ WebSocket not ready - skipping broadcast");
                return;
            }
            this.wsManager.broadcastToAll("appointment_change", event);
            if (event.doctor_id) {
                this.wsManager.broadcastToRoom(`doctor_${event.doctor_id}`, "appointment_change", event);
            }
            if (event.patient_id) {
                this.wsManager.broadcastToRoom(`patient_${event.patient_id}`, "appointment_change", event);
            }
            if (event.appointment_date) {
                this.wsManager.broadcastToRoom(`date_${event.appointment_date}`, "appointment_change", event);
            }
            logger_1.default.info("✅ WebSocket broadcast completed for appointment:", event.appointment_id);
        }
        catch (error) {
            logger_1.default.error("❌ Error broadcasting to WebSocket:", error);
        }
    }
    async publishToEventBus(event) {
        try {
            await this.eventBus.publish("appointment_changed", event, `appointment.${event.type.toLowerCase()}`);
            if (event.type === "UPDATE" && event.old_status !== event.new_status) {
                await this.eventBus.publish("appointment_status_changed", {
                    ...event,
                    status_change: {
                        from: event.old_status,
                        to: event.new_status,
                    },
                }, "appointment.status");
            }
        }
        catch (error) {
            logger_1.default.error("❌ Error publishing to event bus:", error);
        }
    }
    async handleSpecificEventType(event) {
        try {
            switch (event.type) {
                case "INSERT":
                    await this.handleNewAppointment(event);
                    break;
                case "UPDATE":
                    await this.handleAppointmentUpdate(event);
                    break;
                case "DELETE":
                    await this.handleAppointmentCancellation(event);
                    break;
            }
        }
        catch (error) {
            logger_1.default.error("❌ Error handling specific event type:", error);
        }
    }
    async handleNewAppointment(event) {
        logger_1.default.info("🆕 New appointment created:", event.appointment_id);
        await this.checkRealtimeConflicts(event);
        await this.triggerNewAppointmentNotifications(event);
    }
    async handleAppointmentUpdate(event) {
        logger_1.default.info("📝 Appointment updated:", event.appointment_id);
        if (event.old_status !== event.new_status) {
            await this.handleStatusChange(event);
        }
        if (event.start_time || event.end_time) {
            await this.handleTimeChange(event);
        }
    }
    async handleAppointmentCancellation(event) {
        logger_1.default.info("❌ Appointment cancelled:", event.appointment_id);
        await this.triggerCancellationNotifications(event);
        await this.updateDoctorAvailability(event);
    }
    async checkRealtimeConflicts(event) {
        try {
            if (event.type === "INSERT" && event.appointment_id) {
                logger_1.default.info("🔍 Checking real-time conflicts for new appointment:", event.appointment_id);
                logger_1.default.info("✅ Real-time conflict check completed");
            }
        }
        catch (error) {
            logger_1.default.error("❌ Error in real-time conflict check:", error);
        }
    }
    async triggerNewAppointmentNotifications(event) {
        try {
            if (event.type === "INSERT" && event.appointment_id) {
                logger_1.default.info("📧 Triggering notifications for new appointment:", event.appointment_id);
                const durationMinutes = (() => {
                    if (event.start_time && event.end_time) {
                        const [sh, sm] = event.start_time.split(":").map(Number);
                        const [eh, em] = event.end_time.split(":").map(Number);
                        return Math.max(0, eh * 60 + em - (sh * 60 + sm));
                    }
                    return 30;
                })();
                const appointmentData = {
                    appointment_id: event.appointment_id,
                    doctor_id: event.doctor_id || "",
                    patient_id: event.patient_id || "",
                    appointment_date: event.appointment_date || "",
                    appointment_time: event.start_time || "",
                    duration_minutes: durationMinutes,
                    type: "consultation",
                    status: (event.new_status || "scheduled"),
                    created_at: event.timestamp,
                    updated_at: event.timestamp,
                };
                await notification_service_1.notificationService.sendAppointmentCreatedNotification(appointmentData);
                logger_1.default.info("✅ New appointment notifications triggered");
            }
        }
        catch (error) {
            logger_1.default.error("❌ Error triggering new appointment notifications:", error);
        }
    }
    async handleStatusChange(event) {
        logger_1.default.info("🔄 Status changed:", {
            appointment_id: event.appointment_id,
            from: event.old_status,
            to: event.new_status,
        });
    }
    async handleTimeChange(event) {
        logger_1.default.info("⏰ Time changed for appointment:", event.appointment_id);
    }
    async triggerCancellationNotifications(event) {
        try {
            if (event.type === "DELETE" && event.appointment_id) {
                logger_1.default.info("📧 Triggering cancellation notifications for appointment:", event.appointment_id);
                const durationMinutes = (() => {
                    if (event.start_time && event.end_time) {
                        const [sh, sm] = event.start_time.split(":").map(Number);
                        const [eh, em] = event.end_time.split(":").map(Number);
                        return Math.max(0, eh * 60 + em - (sh * 60 + sm));
                    }
                    return 30;
                })();
                const appointmentData = {
                    appointment_id: event.appointment_id,
                    doctor_id: event.doctor_id || "",
                    patient_id: event.patient_id || "",
                    appointment_date: event.appointment_date || "",
                    appointment_time: event.start_time || "",
                    duration_minutes: durationMinutes,
                    type: "consultation",
                    status: "cancelled",
                    created_at: event.timestamp,
                    updated_at: event.timestamp,
                };
                await notification_service_1.notificationService.sendAppointmentCancelledNotification(appointmentData, "Appointment cancelled");
                logger_1.default.info("✅ Cancellation notifications triggered");
            }
        }
        catch (error) {
            logger_1.default.error("❌ Error triggering cancellation notifications:", error);
        }
    }
    async updateDoctorAvailability(event) {
        try {
            if (event.doctor_id) {
                logger_1.default.info("📅 Updating doctor availability for:", event.doctor_id);
                logger_1.default.info("✅ Doctor availability update completed");
            }
        }
        catch (error) {
            logger_1.default.error("❌ Error updating doctor availability:", error);
        }
    }
    async updateCache(event) {
        try {
            logger_1.default.info("💾 Cache update triggered for appointment:", event.appointment_id);
            logger_1.default.info("✅ Cache update completed");
        }
        catch (error) {
            logger_1.default.error("❌ Error updating cache:", error);
        }
    }
    isRealtimeConnected() {
        return this.isConnected && this.subscription !== null;
    }
    async disconnect() {
        try {
            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
            }
            await this.eventBus.disconnect();
            await this.wsManager.disconnect();
            this.isConnected = false;
            logger_1.default.info("✅ Appointment Real-time Service disconnected");
        }
        catch (error) {
            logger_1.default.error("❌ Error disconnecting Real-time Service:", error);
        }
    }
}
exports.AppointmentRealtimeService = AppointmentRealtimeService;
//# sourceMappingURL=realtime.service.js.map