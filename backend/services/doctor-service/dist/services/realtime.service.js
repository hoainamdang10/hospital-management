"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRealtimeService = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const event_bus_1 = require("@hospital/shared/dist/events/event-bus");
const websocket_service_1 = require("./websocket.service");
class DoctorRealtimeService {
    constructor() {
        this.subscription = null;
        this.profileSubscription = null;
        this.shiftSubscription = null;
        this.experienceSubscription = null;
        this.isConnected = false;
        this.eventBus = new event_bus_1.EventBus('doctor-service');
        this.wsManager = new websocket_service_1.WebSocketManager();
    }
    async initialize(httpServer) {
        try {
            logger_1.default.info('🔄 Initializing Doctor Real-time Service...');
            await this.eventBus.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            if (httpServer) {
                await this.wsManager.initialize(httpServer);
            }
            else {
                logger_1.default.warn('⚠️ No HTTP server provided - WebSocket features will be limited');
            }
            await this.setupSupabaseSubscriptions();
            this.isConnected = true;
            logger_1.default.info('✅ Doctor Real-time Service initialized successfully');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to initialize Doctor Real-time Service:', error);
            throw error;
        }
    }
    async setupSupabaseSubscriptions() {
        try {
            this.subscription = database_config_1.supabaseAdmin
                .channel('doctors_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'doctors'
            }, (payload) => {
                this.handleDoctorChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger_1.default.info('✅ Supabase real-time subscription active for doctors');
                }
                else if (status === 'CHANNEL_ERROR') {
                    logger_1.default.error('❌ Supabase real-time subscription error for doctors');
                }
            });
            this.profileSubscription = database_config_1.supabaseAdmin
                .channel('doctor_profiles_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: 'role=eq.doctor'
            }, (payload) => {
                this.handleProfileChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger_1.default.info('✅ Supabase real-time subscription active for doctor profiles');
                }
                else if (status === 'CHANNEL_ERROR') {
                    logger_1.default.error('❌ Supabase real-time subscription error for doctor profiles');
                }
            });
            this.shiftSubscription = database_config_1.supabaseAdmin
                .channel('doctor_shifts_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'doctor_shifts'
            }, (payload) => {
                this.handleShiftChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger_1.default.info('✅ Supabase real-time subscription active for doctor shifts');
                }
                else if (status === 'CHANNEL_ERROR') {
                    logger_1.default.error('❌ Supabase real-time subscription error for doctor shifts');
                }
            });
            this.experienceSubscription = database_config_1.supabaseAdmin
                .channel('doctor_experiences_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'doctor_experiences'
            }, (payload) => {
                this.handleExperienceChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger_1.default.info('✅ Supabase real-time subscription active for doctor experiences');
                }
                else if (status === 'CHANNEL_ERROR') {
                    logger_1.default.error('❌ Supabase real-time subscription error for doctor experiences');
                }
            });
        }
        catch (error) {
            logger_1.default.error('❌ Failed to setup Supabase subscriptions:', error);
            throw error;
        }
    }
    async handleDoctorChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const doctor_id = newRecord?.doctor_id || oldRecord?.doctor_id;
            logger_1.default.info('📡 Received doctor change:', {
                eventType,
                doctor_id
            });
            const realtimeEvent = {
                type: eventType,
                doctor_id: doctor_id,
                profile_id: newRecord?.profile_id || oldRecord?.profile_id,
                old_status: oldRecord?.availability_status,
                new_status: newRecord?.availability_status,
                availability_updated: this.checkAvailabilityUpdate(newRecord, oldRecord),
                schedule_updated: this.checkScheduleUpdate(newRecord, oldRecord),
                experience_updated: false,
                shift_updated: false,
                timestamp: new Date().toISOString()
            };
            await this.processDoctorEvent(realtimeEvent);
        }
        catch (error) {
            logger_1.default.error('❌ Error handling doctor change:', error);
        }
    }
    async handleProfileChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const profileId = newRecord?.profile_id || oldRecord?.profile_id;
            logger_1.default.info('📡 Received doctor profile change:', {
                eventType,
                profileId
            });
            const doctor_id = await this.findDoctorByProfileId(profileId);
            if (!doctor_id) {
                logger_1.default.warn('⚠️ No doctor found for profile:', profileId);
                return;
            }
            const realtimeEvent = {
                type: eventType,
                doctor_id: doctor_id,
                profile_id: profileId,
                old_status: oldRecord?.status,
                new_status: newRecord?.status,
                availability_updated: false,
                schedule_updated: false,
                experience_updated: false,
                shift_updated: false,
                timestamp: new Date().toISOString()
            };
            await this.processDoctorEvent(realtimeEvent);
        }
        catch (error) {
            logger_1.default.error('❌ Error handling profile change:', error);
        }
    }
    async handleShiftChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const doctor_id = newRecord?.doctor_id || oldRecord?.doctor_id;
            logger_1.default.info('📡 Received doctor shift change:', {
                eventType,
                doctor_id
            });
            const realtimeEvent = {
                type: eventType,
                doctor_id: doctor_id,
                old_status: oldRecord?.status,
                new_status: newRecord?.status,
                availability_updated: false,
                schedule_updated: true,
                experience_updated: false,
                shift_updated: true,
                timestamp: new Date().toISOString()
            };
            await this.processDoctorEvent(realtimeEvent);
        }
        catch (error) {
            logger_1.default.error('❌ Error handling shift change:', error);
        }
    }
    async handleExperienceChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const doctor_id = newRecord?.doctor_id || oldRecord?.doctor_id;
            logger_1.default.info('📡 Received doctor experience change:', {
                eventType,
                doctor_id
            });
            const realtimeEvent = {
                type: eventType,
                doctor_id: doctor_id,
                old_status: oldRecord?.status,
                new_status: newRecord?.status,
                availability_updated: false,
                schedule_updated: false,
                experience_updated: true,
                shift_updated: false,
                timestamp: new Date().toISOString()
            };
            await this.processDoctorEvent(realtimeEvent);
        }
        catch (error) {
            logger_1.default.error('❌ Error handling experience change:', error);
        }
    }
    async processDoctorEvent(event) {
        try {
            await this.broadcastToWebSocket(event);
            await this.publishToEventBus(event);
            await this.handleSpecificEventType(event);
            await this.updateCache(event);
            logger_1.default.info('✅ Doctor event processed successfully:', {
                type: event.type,
                doctor_id: event.doctor_id
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error processing doctor event:', error);
        }
    }
    async broadcastToWebSocket(event) {
        try {
            if (!this.wsManager.isWebSocketReady()) {
                logger_1.default.warn('⚠️ WebSocket not ready - skipping broadcast');
                return;
            }
            this.wsManager.broadcastToAll('doctor_change', event);
            if (event.doctor_id) {
                this.wsManager.broadcastToRoom(`doctor_${event.doctor_id}`, 'doctor_change', event);
            }
            this.wsManager.broadcastToRoom('medical_staff', 'doctor_change', event);
            this.wsManager.broadcastToRoom('admin_dashboard', 'doctor_change', event);
            this.wsManager.broadcastToRoom('appointment_service', 'doctor_change', event);
            logger_1.default.info('✅ WebSocket broadcast completed for doctor:', event.doctor_id);
        }
        catch (error) {
            logger_1.default.error('❌ Error broadcasting to WebSocket:', error);
        }
    }
    async publishToEventBus(event) {
        try {
            await this.eventBus.publish('doctor.changed', event);
            logger_1.default.info('✅ Event published to event bus:', event.doctor_id);
        }
        catch (error) {
            logger_1.default.error('❌ Error publishing to event bus:', error);
        }
    }
    async handleSpecificEventType(event) {
        switch (event.type) {
            case 'INSERT':
                await this.handleNewDoctor(event);
                break;
            case 'UPDATE':
                await this.handleDoctorUpdate(event);
                break;
            case 'DELETE':
                await this.handleDoctorDeletion(event);
                break;
        }
    }
    async handleNewDoctor(event) {
        logger_1.default.info('👨‍⚕️ New doctor registered:', event.doctor_id);
        await this.triggerWelcomeNotifications(event);
        await this.updateDoctorStatistics();
    }
    async handleDoctorUpdate(event) {
        logger_1.default.info('📝 Doctor updated:', event.doctor_id);
        if (event.availability_updated) {
            await this.handleAvailabilityUpdate(event);
        }
        if (event.schedule_updated || event.shift_updated) {
            await this.handleScheduleUpdate(event);
        }
    }
    async handleDoctorDeletion(event) {
        logger_1.default.info('❌ Doctor deleted:', event.doctor_id);
        await this.cleanupDoctorData(event);
        await this.updateDoctorStatistics();
    }
    checkAvailabilityUpdate(newRecord, oldRecord) {
        return (newRecord?.availability_status !== oldRecord?.availability_status) ||
            (newRecord?.working_hours !== oldRecord?.working_hours);
    }
    checkScheduleUpdate(newRecord, oldRecord) {
        return (newRecord?.schedule !== oldRecord?.schedule) ||
            (newRecord?.working_days !== oldRecord?.working_days);
    }
    async findDoctorByProfileId(profileId) {
        try {
            const { data } = await database_config_1.supabaseAdmin
                .from('doctors')
                .select('doctor_id')
                .eq('profile_id', profileId)
                .single();
            return data?.doctor_id || null;
        }
        catch (error) {
            logger_1.default.error('❌ Error finding doctor by profile ID:', error);
            return null;
        }
    }
    async triggerWelcomeNotifications(event) {
        logger_1.default.info('📧 Welcome notifications triggered for doctor:', event.doctor_id);
    }
    async updateDoctorStatistics() {
        logger_1.default.info('📊 Doctor statistics updated');
    }
    async handleAvailabilityUpdate(event) {
        logger_1.default.info('📅 Availability updated for doctor:', event.doctor_id);
    }
    async handleScheduleUpdate(event) {
        logger_1.default.info('🗓️ Schedule updated for doctor:', event.doctor_id);
    }
    async cleanupDoctorData(event) {
        logger_1.default.info('🧹 Cleaning up data for doctor:', event.doctor_id);
    }
    async updateCache(event) {
        logger_1.default.info('💾 Cache updated for doctor:', event.doctor_id);
    }
    isRealtimeConnected() {
        return this.isConnected;
    }
    async disconnect() {
        try {
            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
            }
            if (this.profileSubscription) {
                await this.profileSubscription.unsubscribe();
                this.profileSubscription = null;
            }
            if (this.shiftSubscription) {
                await this.shiftSubscription.unsubscribe();
                this.shiftSubscription = null;
            }
            if (this.experienceSubscription) {
                await this.experienceSubscription.unsubscribe();
                this.experienceSubscription = null;
            }
            await this.eventBus.disconnect();
            await this.wsManager.disconnect();
            this.isConnected = false;
            logger_1.default.info('✅ Doctor Real-time Service disconnected');
        }
        catch (error) {
            logger_1.default.error('❌ Error disconnecting Doctor Real-time Service:', error);
        }
    }
}
exports.DoctorRealtimeService = DoctorRealtimeService;
//# sourceMappingURL=realtime.service.js.map