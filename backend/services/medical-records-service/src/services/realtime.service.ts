import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Server as HttpServer } from 'http';
import { supabaseAdmin } from '../config/database.config';
import { logger } from '@hospital/shared';
import { EventBus } from '@hospital/shared/dist/events/event-bus';
import { WebSocketManager } from './websocket.service';

export interface MedicalRecordRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  patient_id?: string;
  doctor_id?: string;
  vital_signs_updated?: boolean;
  lab_results_updated?: boolean;
  diagnosis_updated?: boolean;
  treatment_updated?: boolean;
  timestamp: string;
}

export class MedicalRecordRealtimeService {
  private subscription: RealtimeChannel | null = null;
  private vitalSignsSubscription: RealtimeChannel | null = null;
  private labResultsSubscription: RealtimeChannel | null = null;
  private eventBus: EventBus;
  private wsManager: WebSocketManager;
  private isConnected: boolean = false;

  constructor() {
    this.eventBus = new EventBus('medical-records-service');
    this.wsManager = new WebSocketManager();
  }

  /**
   * Initialize real-time subscriptions for medical records
   */
  async initialize(httpServer?: HttpServer): Promise<void> {
    try {
      logger.info('🔄 Initializing Medical Records Real-time Service...');
      
      // Connect to event bus
      await this.eventBus.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      
      // Initialize WebSocket manager with HTTP server
      if (httpServer) {
        await this.wsManager.initialize(httpServer);
      } else {
        logger.warn('⚠️ No HTTP server provided - WebSocket features will be limited');
      }

      // Setup Supabase real-time subscriptions
      await this.setupSupabaseSubscriptions();

      this.isConnected = true;
      logger.info('✅ Medical Records Real-time Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Medical Records Real-time Service:', error);
      throw error;
    }
  }

  /**
   * Setup Supabase real-time subscriptions for medical records, vital signs, and lab results tables
   */
  private async setupSupabaseSubscriptions(): Promise<void> {
    try {
      // Subscribe to medical_records table changes
      this.subscription = supabaseAdmin
        .channel('medical_records_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medical_records'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleMedicalRecordChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for medical records');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for medical records');
          }
        });

      // Subscribe to vital_signs table changes
      this.vitalSignsSubscription = supabaseAdmin
        .channel('vital_signs_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vital_signs'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleVitalSignsChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for vital signs');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for vital signs');
          }
        });

      // Subscribe to lab_results table changes
      this.labResultsSubscription = supabaseAdmin
        .channel('lab_results_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lab_results'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleLabResultsChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for lab results');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for lab results');
          }
        });

    } catch (error) {
      logger.error('❌ Failed to setup Supabase subscriptions:', error);
      throw error;
    }
  }

  /**
   * Handle medical record table changes
   */
  private async handleMedicalRecordChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const recordId = (newRecord as any)?.record_id || (oldRecord as any)?.record_id;
      
      logger.info('📡 Received medical record change:', {
        eventType,
        recordId
      });

      const realtimeEvent: MedicalRecordRealtimeEvent = {
        type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        record_id: recordId,
        patient_id: (newRecord as any)?.patient_id || (oldRecord as any)?.patient_id,
        doctor_id: (newRecord as any)?.doctor_id || (oldRecord as any)?.doctor_id,
        vital_signs_updated: false,
        lab_results_updated: false,
        diagnosis_updated: this.checkDiagnosisUpdate(newRecord, oldRecord),
        treatment_updated: this.checkTreatmentUpdate(newRecord, oldRecord),
        timestamp: new Date().toISOString()
      };

      await this.processMedicalRecordEvent(realtimeEvent);
    } catch (error) {
      logger.error('❌ Error handling medical record change:', error);
    }
  }

  /**
   * Handle vital signs table changes
   */
  private async handleVitalSignsChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const recordId = (newRecord as any)?.record_id || (oldRecord as any)?.record_id;
      
      logger.info('📡 Received vital signs change:', {
        eventType,
        recordId
      });

      const realtimeEvent: MedicalRecordRealtimeEvent = {
        type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        record_id: recordId,
        vital_signs_updated: true,
        lab_results_updated: false,
        diagnosis_updated: false,
        treatment_updated: false,
        timestamp: new Date().toISOString()
      };

      await this.processMedicalRecordEvent(realtimeEvent);
    } catch (error) {
      logger.error('❌ Error handling vital signs change:', error);
    }
  }

  /**
   * Handle lab results table changes
   */
  private async handleLabResultsChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const recordId = (newRecord as any)?.record_id || (oldRecord as any)?.record_id;
      
      logger.info('📡 Received lab results change:', {
        eventType,
        recordId
      });

      const realtimeEvent: MedicalRecordRealtimeEvent = {
        type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        record_id: recordId,
        vital_signs_updated: false,
        lab_results_updated: true,
        diagnosis_updated: false,
        treatment_updated: false,
        timestamp: new Date().toISOString()
      };

      await this.processMedicalRecordEvent(realtimeEvent);
    } catch (error) {
      logger.error('❌ Error handling lab results change:', error);
    }
  }

  /**
   * Process medical record events and broadcast to relevant channels
   */
  private async processMedicalRecordEvent(event: MedicalRecordRealtimeEvent): Promise<void> {
    try {
      // 1. Broadcast to WebSocket clients
      await this.broadcastToWebSocket(event);

      // 2. Publish to event bus for other services
      await this.publishToEventBus(event);

      // 3. Handle specific event types
      await this.handleSpecificEventType(event);

      // 4. Update cache if needed
      await this.updateCache(event);

      logger.info('✅ Medical record event processed successfully:', {
        type: event.type,
        recordId: event.record_id
      });

    } catch (error) {
      logger.error('❌ Error processing medical record event:', error);
    }
  }

  /**
   * Broadcast event to WebSocket clients
   */
  private async broadcastToWebSocket(event: MedicalRecordRealtimeEvent): Promise<void> {
    try {
      if (!this.wsManager.isWebSocketReady()) {
        logger.warn('⚠️ WebSocket not ready - skipping broadcast');
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

      logger.info('✅ WebSocket broadcast completed for medical record:', event.record_id);
    } catch (error) {
      logger.error('❌ Error broadcasting to WebSocket:', error);
    }
  }

  /**
   * Publish event to event bus for other services
   */
  private async publishToEventBus(event: MedicalRecordRealtimeEvent): Promise<void> {
    try {
      await this.eventBus.publish('medical_record.changed' as any, event);
      logger.info('✅ Event published to event bus:', event.record_id);
    } catch (error) {
      logger.error('❌ Error publishing to event bus:', error);
    }
  }

  /**
   * Handle specific event types
   */
  private async handleSpecificEventType(event: MedicalRecordRealtimeEvent): Promise<void> {
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
  private async handleNewMedicalRecord(event: MedicalRecordRealtimeEvent): Promise<void> {
    logger.info('📋 New medical record created:', event.record_id);
    // Placeholder for new record logic
  }

  /**
   * Handle medical record updates
   */
  private async handleMedicalRecordUpdate(event: MedicalRecordRealtimeEvent): Promise<void> {
    logger.info('📝 Medical record updated:', event.record_id);

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
  private async handleMedicalRecordDeletion(event: MedicalRecordRealtimeEvent): Promise<void> {
    logger.info('❌ Medical record deleted:', event.record_id);
    // Placeholder for deletion logic
  }

  /**
   * Handle vital signs updates
   */
  private async handleVitalSignsUpdate(event: MedicalRecordRealtimeEvent): Promise<void> {
    logger.info('💓 Vital signs updated for record:', event.record_id);
    // Placeholder for vital signs update logic
  }

  /**
   * Handle lab results updates
   */
  private async handleLabResultsUpdate(event: MedicalRecordRealtimeEvent): Promise<void> {
    logger.info('🧪 Lab results updated for record:', event.record_id);
    // Placeholder for lab results update logic
  }

  /**
   * Handle diagnosis updates
   */
  private async handleDiagnosisUpdate(event: MedicalRecordRealtimeEvent): Promise<void> {
    logger.info('🩺 Diagnosis updated for record:', event.record_id);
    // Placeholder for diagnosis update logic
  }

  /**
   * Handle treatment updates
   */
  private async handleTreatmentUpdate(event: MedicalRecordRealtimeEvent): Promise<void> {
    logger.info('💊 Treatment updated for record:', event.record_id);
    // Placeholder for treatment update logic
  }

  /**
   * Check if diagnosis was updated
   */
  private checkDiagnosisUpdate(newRecord: any, oldRecord: any): boolean {
    return newRecord?.diagnosis !== oldRecord?.diagnosis;
  }

  /**
   * Check if treatment was updated
   */
  private checkTreatmentUpdate(newRecord: any, oldRecord: any): boolean {
    return (newRecord?.treatment_plan !== oldRecord?.treatment_plan) ||
           (newRecord?.medications !== oldRecord?.medications);
  }

  /**
   * Update cache
   */
  private async updateCache(event: MedicalRecordRealtimeEvent): Promise<void> {
    // Placeholder for cache update logic
    logger.info('💾 Cache updated for medical record:', event.record_id);
  }

  /**
   * Check if real-time service is connected
   */
  public isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect and cleanup
   */
  public async disconnect(): Promise<void> {
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
      logger.info('✅ Medical Records Real-time Service disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting Medical Records Real-time Service:', error);
    }
  }
}
