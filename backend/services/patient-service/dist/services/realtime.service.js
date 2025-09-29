"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientRealtimeService = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const event_bus_1 = require("@hospital/shared/dist/events/event-bus");
const websocket_service_1 = require("./websocket.service");
class PatientRealtimeService {
    constructor() {
        this.subscription = null;
        this.profileSubscription = null;
        this.isConnected = false;
        this.eventBus = new event_bus_1.EventBus('patient-service');
        this.wsManager = new websocket_service_1.WebSocketManager();
    }
    async initialize(httpServer) {
        try {
            logger_1.default.info('🔄 Initializing Patient Real-time Service...');
            await this.eventBus.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            if (httpServer) {
                await this.wsManager.initialize(httpServer);
            }
            else {
                logger_1.default.warn('⚠️ No HTTP server provided - WebSocket features will be limited');
            }
            await this.setupSupabaseSubscriptions();
            this.isConnected = true;
            logger_1.default.info('✅ Patient Real-time Service initialized successfully');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to initialize Patient Real-time Service:', error);
            throw error;
        }
    }
    async setupSupabaseSubscriptions() {
        try {
            this.subscription = database_config_1.supabaseAdmin
                .channel('patients_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'patients'
            }, (payload) => {
                this.handlePatientChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger_1.default.info('✅ Supabase real-time subscription active for patients');
                }
                else if (status === 'CHANNEL_ERROR') {
                    logger_1.default.error('❌ Supabase real-time subscription error for patients');
                }
            });
            this.profileSubscription = database_config_1.supabaseAdmin
                .channel('patient_profiles_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: 'role=eq.patient'
            }, (payload) => {
                this.handleProfileChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger_1.default.info('✅ Supabase real-time subscription active for patient profiles');
                }
                else if (status === 'CHANNEL_ERROR') {
                    logger_1.default.error('❌ Supabase real-time subscription error for patient profiles');
                }
            });
        }
        catch (error) {
            logger_1.default.error('❌ Failed to setup Supabase subscriptions:', error);
            throw error;
        }
    }
    async handlePatientChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const patient_id = newRecord?.patient_id || oldRecord?.patient_id;
            logger_1.default.info('📡 Received patient change:', {
                eventType,
                patient_id
            });
            const realtimeEvent = {
                type: eventType,
                patient_id: patient_id,
                profile_id: newRecord?.profile_id || oldRecord?.profile_id,
                old_status: oldRecord?.status,
                new_status: newRecord?.status,
                medical_history_updated: this.checkMedicalHistoryUpdate(newRecord, oldRecord),
                emergency_contact_updated: this.checkEmergencyContactUpdate(newRecord, oldRecord),
                insurance_updated: this.checkInsuranceUpdate(newRecord, oldRecord),
                timestamp: new Date().toISOString()
            };
            await this.processPatientEvent(realtimeEvent);
        }
        catch (error) {
            logger_1.default.error('❌ Error handling patient change:', error);
        }
    }
    async handleProfileChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const profileId = newRecord?.profile_id || oldRecord?.profile_id;
            logger_1.default.info('📡 Received patient profile change:', {
                eventType,
                profileId
            });
            const patient_id = await this.findPatientByProfileId(profileId);
            if (patient_id) {
                const realtimeEvent = {
                    type: eventType,
                    patient_id: patient_id,
                    profile_id: profileId,
                    timestamp: new Date().toISOString()
                };
                await this.processPatientEvent(realtimeEvent);
            }
        }
        catch (error) {
            logger_1.default.error('❌ Error handling profile change:', error);
        }
    }
    async processPatientEvent(event) {
        try {
            await this.broadcastToWebSocket(event);
            await this.publishToEventBus(event);
            await this.handleSpecificEventType(event);
            await this.updateCache(event);
            logger_1.default.info('✅ Patient event processed successfully:', {
                type: event.type,
                patient_id: event.patient_id
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error processing patient event:', error);
        }
    }
    async broadcastToWebSocket(event) {
        try {
            if (!this.wsManager.isWebSocketReady()) {
                logger_1.default.warn('⚠️ WebSocket not ready - skipping broadcast');
                return;
            }
            this.wsManager.broadcastToAll('patient_change', event);
            if (event.patient_id) {
                this.wsManager.broadcastToRoom(`patient_${event.patient_id}`, 'patient_change', event);
            }
            this.wsManager.broadcastToRoom('medical_staff', 'patient_change', event);
            this.wsManager.broadcastToRoom('admin_dashboard', 'patient_change', event);
            logger_1.default.info('✅ WebSocket broadcast completed for patient:', event.patient_id);
        }
        catch (error) {
            logger_1.default.error('❌ Error broadcasting to WebSocket:', error);
        }
    }
    async publishToEventBus(event) {
        try {
            await this.eventBus.publish('patient_changed', event, `patient.${event.type.toLowerCase()}`);
            if (event.medical_history_updated) {
                await this.eventBus.publish('patient_medical_history_updated', event, 'patient.medical_history');
            }
            if (event.emergency_contact_updated) {
                await this.eventBus.publish('patient_emergency_contact_updated', event, 'patient.emergency_contact');
            }
        }
        catch (error) {
            logger_1.default.error('❌ Error publishing to event bus:', error);
        }
    }
    async handleSpecificEventType(event) {
        try {
            switch (event.type) {
                case 'INSERT':
                    await this.handleNewPatient(event);
                    break;
                case 'UPDATE':
                    await this.handlePatientUpdate(event);
                    break;
                case 'DELETE':
                    await this.handlePatientDeletion(event);
                    break;
            }
        }
        catch (error) {
            logger_1.default.error('❌ Error handling specific event type:', error);
        }
    }
    async handleNewPatient(event) {
        logger_1.default.info('🆕 New patient registered:', event.patient_id);
        await this.triggerWelcomeNotifications(event);
        await this.updatePatientStatistics();
    }
    async handlePatientUpdate(event) {
        logger_1.default.info('📝 Patient updated:', event.patient_id);
        if (event.medical_history_updated) {
            await this.handleMedicalHistoryUpdate(event);
        }
        if (event.emergency_contact_updated) {
            await this.handleEmergencyContactUpdate(event);
        }
    }
    async handlePatientDeletion(event) {
        logger_1.default.info('❌ Patient deleted:', event.patient_id);
        await this.cleanupPatientData(event);
        await this.updatePatientStatistics();
    }
    checkMedicalHistoryUpdate(newRecord, oldRecord) {
        return (newRecord?.medical_history !== oldRecord?.medical_history) ||
            (newRecord?.allergies !== oldRecord?.allergies) ||
            (newRecord?.medications !== oldRecord?.medications);
    }
    checkEmergencyContactUpdate(newRecord, oldRecord) {
        return (newRecord?.emergency_contact_name !== oldRecord?.emergency_contact_name) ||
            (newRecord?.emergency_contact_phone !== oldRecord?.emergency_contact_phone);
    }
    checkInsuranceUpdate(newRecord, oldRecord) {
        return (newRecord?.insurance_provider !== oldRecord?.insurance_provider) ||
            (newRecord?.insurance_number !== oldRecord?.insurance_number);
    }
    async findPatientByProfileId(profileId) {
        try {
            const { data } = await database_config_1.supabaseAdmin
                .from('patients')
                .select('patient_id')
                .eq('profile_id', profileId)
                .single();
            return data?.patient_id || null;
        }
        catch (error) {
            logger_1.default.error('❌ Error finding patient by profile ID:', error);
            return null;
        }
    }
    async triggerWelcomeNotifications(event) {
    }
    async updatePatientStatistics() {
    }
    async handleMedicalHistoryUpdate(event) {
        logger_1.default.info('🏥 Medical history updated for patient:', event.patient_id);
    }
    async handleEmergencyContactUpdate(event) {
        logger_1.default.info('📞 Emergency contact updated for patient:', event.patient_id);
    }
    async cleanupPatientData(event) {
    }
    async updateCache(event) {
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
            if (this.profileSubscription) {
                await this.profileSubscription.unsubscribe();
                this.profileSubscription = null;
            }
            await this.eventBus.disconnect();
            await this.wsManager.disconnect();
            this.isConnected = false;
            logger_1.default.info('✅ Patient Real-time Service disconnected');
        }
        catch (error) {
            logger_1.default.error('❌ Error disconnecting Patient Real-time Service:', error);
        }
    }
}
exports.PatientRealtimeService = PatientRealtimeService;
//# sourceMappingURL=realtime.service.js.map