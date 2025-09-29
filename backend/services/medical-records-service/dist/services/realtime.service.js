"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordRealtimeService = void 0;
const database_config_1 = require("../config/database.config");
const shared_1 = require("@hospital/shared");
const event_bus_1 = require("@hospital/shared/dist/events/event-bus");
const websocket_service_1 = require("./websocket.service");
class MedicalRecordRealtimeService {
    constructor() {
        this.subscription = null;
        this.vitalSignsSubscription = null;
        this.labResultsSubscription = null;
        this.isConnected = false;
        this.eventBus = new event_bus_1.EventBus('medical-records-service');
        this.wsManager = new websocket_service_1.WebSocketManager();
    }
    /**
     * Initialize real-time subscriptions for medical records
     */
    async initialize(httpServer) {
        try {
            shared_1.logger.info('🔄 Initializing Medical Records Real-time Service...');
            // Connect to event bus
            await this.eventBus.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            // Initialize WebSocket manager with HTTP server
            if (httpServer) {
                await this.wsManager.initialize(httpServer);
            }
            else {
                shared_1.logger.warn('⚠️ No HTTP server provided - WebSocket features will be limited');
            }
            // Setup Supabase real-time subscriptions
            await this.setupSupabaseSubscriptions();
            this.isConnected = true;
            shared_1.logger.info('✅ Medical Records Real-time Service initialized successfully');
        }
        catch (error) {
            shared_1.logger.error('❌ Failed to initialize Medical Records Real-time Service:', error);
            throw error;
        }
    }
    /**
     * Setup Supabase real-time subscriptions for medical records, vital signs, and lab results tables
     */
    async setupSupabaseSubscriptions() {
        try {
            // Subscribe to medical_records table changes
            this.subscription = database_config_1.supabaseAdmin
                .channel('medical_records_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'medical_records'
            }, (payload) => {
                this.handleMedicalRecordChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    shared_1.logger.info('✅ Supabase real-time subscription active for medical records');
                }
                else if (status === 'CHANNEL_ERROR') {
                    shared_1.logger.error('❌ Supabase real-time subscription error for medical records');
                }
            });
            // Subscribe to vital_signs table changes
            this.vitalSignsSubscription = database_config_1.supabaseAdmin
                .channel('vital_signs_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'vital_signs'
            }, (payload) => {
                this.handleVitalSignsChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    shared_1.logger.info('✅ Supabase real-time subscription active for vital signs');
                }
                else if (status === 'CHANNEL_ERROR') {
                    shared_1.logger.error('❌ Supabase real-time subscription error for vital signs');
                }
            });
            // Subscribe to lab_results table changes
            this.labResultsSubscription = database_config_1.supabaseAdmin
                .channel('lab_results_realtime')
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'lab_results'
            }, (payload) => {
                this.handleLabResultsChange(payload);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    shared_1.logger.info('✅ Supabase real-time subscription active for lab results');
                }
                else if (status === 'CHANNEL_ERROR') {
                    shared_1.logger.error('❌ Supabase real-time subscription error for lab results');
                }
            });
        }
        catch (error) {
            shared_1.logger.error('❌ Failed to setup Supabase subscriptions:', error);
            throw error;
        }
    }
    /**
     * Handle medical record table changes
     */
    async handleMedicalRecordChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const recordId = newRecord?.record_id || oldRecord?.record_id;
            shared_1.logger.info('📡 Received medical record change:', {
                eventType,
                recordId
            });
            const realtimeEvent = {
                type: eventType,
                record_id: recordId,
                patient_id: newRecord?.patient_id || oldRecord?.patient_id,
                doctor_id: newRecord?.doctor_id || oldRecord?.doctor_id,
                vital_signs_updated: false,
                lab_results_updated: false,
                diagnosis_updated: this.checkDiagnosisUpdate(newRecord, oldRecord),
                treatment_updated: this.checkTreatmentUpdate(newRecord, oldRecord),
                timestamp: new Date().toISOString()
            };
            await this.processMedicalRecordEvent(realtimeEvent);
        }
        catch (error) {
            shared_1.logger.error('❌ Error handling medical record change:', error);
        }
    }
    /**
     * Handle vital signs table changes
     */
    async handleVitalSignsChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const recordId = newRecord?.record_id || oldRecord?.record_id;
            shared_1.logger.info('📡 Received vital signs change:', {
                eventType,
                recordId
            });
            const realtimeEvent = {
                type: eventType,
                record_id: recordId,
                vital_signs_updated: true,
                lab_results_updated: false,
                diagnosis_updated: false,
                treatment_updated: false,
                timestamp: new Date().toISOString()
            };
            await this.processMedicalRecordEvent(realtimeEvent);
        }
        catch (error) {
            shared_1.logger.error('❌ Error handling vital signs change:', error);
        }
    }
    /**
     * Handle lab results table changes
     */
    async handleLabResultsChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const recordId = newRecord?.record_id || oldRecord?.record_id;
            shared_1.logger.info('📡 Received lab results change:', {
                eventType,
                recordId
            });
            const realtimeEvent = {
                type: eventType,
                record_id: recordId,
                vital_signs_updated: false,
                lab_results_updated: true,
                diagnosis_updated: false,
                treatment_updated: false,
                timestamp: new Date().toISOString()
            };
            await this.processMedicalRecordEvent(realtimeEvent);
        }
        catch (error) {
            shared_1.logger.error('❌ Error handling lab results change:', error);
        }
    }
    /**
     * Process medical record events and broadcast to relevant channels
     */
    async processMedicalRecordEvent(event) {
        try {
            // 1. Broadcast to WebSocket clients
            await this.broadcastToWebSocket(event);
            // 2. Publish to event bus for other services
            await this.publishToEventBus(event);
            // 3. Handle specific event types
            await this.handleSpecificEventType(event);
            // 4. Update cache if needed
            await this.updateCache(event);
            shared_1.logger.info('✅ Medical record event processed successfully:', {
                type: event.type,
                recordId: event.record_id
            });
        }
        catch (error) {
            shared_1.logger.error('❌ Error processing medical record event:', error);
        }
    }
    /**
     * Broadcast event to WebSocket clients
     */
    async broadcastToWebSocket(event) {
        try {
            if (!this.wsManager.isWebSocketReady()) {
                shared_1.logger.warn('⚠️ WebSocket not ready - skipping broadcast');
                return;
            }
            // Broadcast to all clients
            this.wsManager.broadcastToAll('medical_record_change', event);
            // Broadcast to specific patient and doctor rooms
            if (event.patient_id) {
                this.wsManager.broadcastToRoom(`patient_${event.patient_id}`, 'medical_record_change', event);
            }
            if (event.doctor_id) {
                this.wsManager.broadcastToRoom(`doctor_${event.doctor_id}`, 'medical_record_change', event);
            }
            // Broadcast to relevant rooms
            this.wsManager.broadcastToRoom('medical_staff', 'medical_record_change', event);
            this.wsManager.broadcastToRoom('admin_dashboard', 'medical_record_change', event);
            shared_1.logger.info('✅ WebSocket broadcast completed for medical record:', event.record_id);
        }
        catch (error) {
            shared_1.logger.error('❌ Error broadcasting to WebSocket:', error);
        }
    }
    /**
     * Publish event to event bus for other services
     */
    async publishToEventBus(event) {
        try {
            await this.eventBus.publish('medical_record.changed', event);
            shared_1.logger.info('✅ Event published to event bus:', event.record_id);
        }
        catch (error) {
            shared_1.logger.error('❌ Error publishing to event bus:', error);
        }
    }
    /**
     * Handle specific event types
     */
    async handleSpecificEventType(event) {
        switch (event.type) {
            case 'INSERT':
                await this.handleNewMedicalRecord(event);
                break;
            case 'UPDATE':
                await this.handleMedicalRecordUpdate(event);
                break;
            case 'DELETE':
                await this.handleMedicalRecordDeletion(event);
                break;
        }
    }
    /**
     * Handle new medical record creation
     */
    async handleNewMedicalRecord(event) {
        shared_1.logger.info('📋 New medical record created:', event.record_id);
        // Placeholder for new record logic
    }
    /**
     * Handle medical record updates
     */
    async handleMedicalRecordUpdate(event) {
        shared_1.logger.info('📝 Medical record updated:', event.record_id);
        // Handle vital signs updates
        if (event.vital_signs_updated) {
            await this.handleVitalSignsUpdate(event);
        }
        // Handle lab results updates
        if (event.lab_results_updated) {
            await this.handleLabResultsUpdate(event);
        }
        // Handle diagnosis updates
        if (event.diagnosis_updated) {
            await this.handleDiagnosisUpdate(event);
        }
        // Handle treatment updates
        if (event.treatment_updated) {
            await this.handleTreatmentUpdate(event);
        }
    }
    /**
     * Handle medical record deletion
     */
    async handleMedicalRecordDeletion(event) {
        shared_1.logger.info('❌ Medical record deleted:', event.record_id);
        // Placeholder for deletion logic
    }
    /**
     * Handle vital signs updates
     */
    async handleVitalSignsUpdate(event) {
        shared_1.logger.info('💓 Vital signs updated for record:', event.record_id);
        // Placeholder for vital signs update logic
    }
    /**
     * Handle lab results updates
     */
    async handleLabResultsUpdate(event) {
        shared_1.logger.info('🧪 Lab results updated for record:', event.record_id);
        // Placeholder for lab results update logic
    }
    /**
     * Handle diagnosis updates
     */
    async handleDiagnosisUpdate(event) {
        shared_1.logger.info('🩺 Diagnosis updated for record:', event.record_id);
        // Placeholder for diagnosis update logic
    }
    /**
     * Handle treatment updates
     */
    async handleTreatmentUpdate(event) {
        shared_1.logger.info('💊 Treatment updated for record:', event.record_id);
        // Placeholder for treatment update logic
    }
    /**
     * Check if diagnosis was updated
     */
    checkDiagnosisUpdate(newRecord, oldRecord) {
        return newRecord?.diagnosis !== oldRecord?.diagnosis;
    }
    /**
     * Check if treatment was updated
     */
    checkTreatmentUpdate(newRecord, oldRecord) {
        return (newRecord?.treatment_plan !== oldRecord?.treatment_plan) ||
            (newRecord?.medications !== oldRecord?.medications);
    }
    /**
     * Update cache
     */
    async updateCache(event) {
        // Placeholder for cache update logic
        shared_1.logger.info('💾 Cache updated for medical record:', event.record_id);
    }
    /**
     * Check if real-time service is connected
     */
    isRealtimeConnected() {
        return this.isConnected;
    }
    /**
     * Disconnect and cleanup
     */
    async disconnect() {
        try {
            // Unsubscribe from all channels
            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
            }
            if (this.vitalSignsSubscription) {
                await this.vitalSignsSubscription.unsubscribe();
                this.vitalSignsSubscription = null;
            }
            if (this.labResultsSubscription) {
                await this.labResultsSubscription.unsubscribe();
                this.labResultsSubscription = null;
            }
            // Disconnect event bus and WebSocket manager
            await this.eventBus.disconnect();
            await this.wsManager.disconnect();
            this.isConnected = false;
            shared_1.logger.info('✅ Medical Records Real-time Service disconnected');
        }
        catch (error) {
            shared_1.logger.error('❌ Error disconnecting Medical Records Real-time Service:', error);
        }
    }
}
exports.MedicalRecordRealtimeService = MedicalRecordRealtimeService;
//# sourceMappingURL=realtime.service.js.map