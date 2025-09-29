import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Server as HttpServer } from 'http';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';
import { EventBus } from '@hospital/shared/dist/events/event-bus';
import { WebSocketManager } from './websocket.service';

export interface PatientRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  patient_id: string;
  profile_id?: string;
  old_status?: string;
  new_status?: string;
  medical_history_updated?: boolean;
  emergency_contact_updated?: boolean;
  insurance_updated?: boolean;
  timestamp: string;
}

export class PatientRealtimeService {
  private subscription: RealtimeChannel | null = null;
  private profileSubscription: RealtimeChannel | null = null;
  private eventBus: EventBus;
  private wsManager: WebSocketManager;
  private isConnected: boolean = false;

  constructor() {
    this.eventBus = new EventBus('patient-service');
    this.wsManager = new WebSocketManager();
  }

  /**
   * Initialize real-time subscriptions for patients
   */
  async initialize(httpServer?: HttpServer): Promise<void> {
    try {
      logger.info('🔄 Initializing Patient Real-time Service...');

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
      logger.info('✅ Patient Real-time Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Patient Real-time Service:', error);
      throw error;
    }
  }

  /**
   * Setup Supabase real-time subscriptions for patients and profiles tables
   */
  private async setupSupabaseSubscriptions(): Promise<void> {
    try {
      // Subscribe to patients table changes
      this.subscription = supabaseAdmin
        .channel('patients_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patients'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handlePatientChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for patients');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for patients');
          }
        });

      // Subscribe to profiles table changes (for patient profiles)
      this.profileSubscription = supabaseAdmin
        .channel('patient_profiles_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: 'role=eq.patient'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleProfileChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for patient profiles');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for patient profiles');
          }
        });

    } catch (error) {
      logger.error('❌ Failed to setup Supabase subscriptions:', error);
      throw error;
    }
  }

  /**
   * Handle patient changes from Supabase real-time
   */
  private async handlePatientChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      // Type-safe access to record properties
      const patient_id = (newRecord as any)?.patient_id || (oldRecord as any)?.patient_id;
      
      logger.info('📡 Received patient change:', {
        eventType,
        patient_id
      });

      // Create standardized event with type-safe access
      const realtimeEvent: PatientRealtimeEvent = {
        type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        patient_id: patient_id,
        profile_id: (newRecord as any)?.profile_id || (oldRecord as any)?.profile_id,
        old_status: (oldRecord as any)?.status,
        new_status: (newRecord as any)?.status,
        medical_history_updated: this.checkMedicalHistoryUpdate(newRecord, oldRecord),
        emergency_contact_updated: this.checkEmergencyContactUpdate(newRecord, oldRecord),
        insurance_updated: this.checkInsuranceUpdate(newRecord, oldRecord),
        timestamp: new Date().toISOString()
      };

      // Process the event
      await this.processPatientEvent(realtimeEvent);

    } catch (error) {
      logger.error('❌ Error handling patient change:', error);
    }
  }

  /**
   * Handle profile changes from Supabase real-time
   */
  private async handleProfileChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      const profileId = (newRecord as any)?.profile_id || (oldRecord as any)?.profile_id;
      
      logger.info('📡 Received patient profile change:', {
        eventType,
        profileId
      });

      // Find associated patient
      const patient_id = await this.findPatientByProfileId(profileId);
      
      if (patient_id) {
        const realtimeEvent: PatientRealtimeEvent = {
          type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          patient_id: patient_id,
          profile_id: profileId,
          timestamp: new Date().toISOString()
        };

        await this.processPatientEvent(realtimeEvent);
      }

    } catch (error) {
      logger.error('❌ Error handling profile change:', error);
    }
  }

  /**
   * Process patient events and broadcast to relevant channels
   */
  private async processPatientEvent(event: PatientRealtimeEvent): Promise<void> {
    try {
      // 1. Broadcast to WebSocket clients
      await this.broadcastToWebSocket(event);

      // 2. Publish to event bus for other services
      await this.publishToEventBus(event);

      // 3. Handle specific event types
      await this.handleSpecificEventType(event);

      // 4. Update cache if needed
      await this.updateCache(event);

      logger.info('✅ Patient event processed successfully:', {
        type: event.type,
        patient_id: event.patient_id
      });

    } catch (error) {
      logger.error('❌ Error processing patient event:', error);
    }
  }

  /**
   * Broadcast event to WebSocket clients
   */
  private async broadcastToWebSocket(event: PatientRealtimeEvent): Promise<void> {
    try {
      // Check if WebSocket is available
      if (!this.wsManager.isWebSocketReady()) {
        logger.warn('⚠️ WebSocket not ready - skipping broadcast');
        return;
      }

      // Broadcast to all connected clients
      this.wsManager.broadcastToAll('patient_change', event);

      // Broadcast to specific patient's clients
      if (event.patient_id) {
        this.wsManager.broadcastToRoom(`patient_${event.patient_id}`, 'patient_change', event);
      }

      // Broadcast to medical staff monitoring patients
      this.wsManager.broadcastToRoom('medical_staff', 'patient_change', event);

      // Broadcast to admin dashboard
      this.wsManager.broadcastToRoom('admin_dashboard', 'patient_change', event);

      logger.info('✅ WebSocket broadcast completed for patient:', event.patient_id);

    } catch (error) {
      logger.error('❌ Error broadcasting to WebSocket:', error);
    }
  }

  /**
   * Publish event to message bus for other services
   */
  private async publishToEventBus(event: PatientRealtimeEvent): Promise<void> {
    try {
      await this.eventBus.publish('patient_changed' as any, event, `patient.${event.type.toLowerCase()}`);
      
      // Specific routing for medical history updates
      if (event.medical_history_updated) {
        await this.eventBus.publish('patient_medical_history_updated' as any, event, 'patient.medical_history');
      }

      // Specific routing for emergency contact updates
      if (event.emergency_contact_updated) {
        await this.eventBus.publish('patient_emergency_contact_updated' as any, event, 'patient.emergency_contact');
      }

    } catch (error) {
      logger.error('❌ Error publishing to event bus:', error);
    }
  }

  /**
   * Handle specific event types with custom logic
   */
  private async handleSpecificEventType(event: PatientRealtimeEvent): Promise<void> {
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
    } catch (error) {
      logger.error('❌ Error handling specific event type:', error);
    }
  }

  /**
   * Handle new patient registration
   */
  private async handleNewPatient(event: PatientRealtimeEvent): Promise<void> {
    logger.info('🆕 New patient registered:', event.patient_id);
    
    // Trigger welcome notifications
    await this.triggerWelcomeNotifications(event);
    
    // Update patient statistics
    await this.updatePatientStatistics();
  }

  /**
   * Handle patient updates
   */
  private async handlePatientUpdate(event: PatientRealtimeEvent): Promise<void> {
    logger.info('📝 Patient updated:', event.patient_id);
    
    // Handle medical history updates
    if (event.medical_history_updated) {
      await this.handleMedicalHistoryUpdate(event);
    }
    
    // Handle emergency contact updates
    if (event.emergency_contact_updated) {
      await this.handleEmergencyContactUpdate(event);
    }
  }

  /**
   * Handle patient deletion
   */
  private async handlePatientDeletion(event: PatientRealtimeEvent): Promise<void> {
    logger.info('❌ Patient deleted:', event.patient_id);
    
    // Cleanup related data
    await this.cleanupPatientData(event);
    
    // Update statistics
    await this.updatePatientStatistics();
  }

  // Helper methods
  private checkMedicalHistoryUpdate(newRecord: any, oldRecord: any): boolean {
    return (newRecord?.medical_history !== oldRecord?.medical_history) ||
           (newRecord?.allergies !== oldRecord?.allergies) ||
           (newRecord?.medications !== oldRecord?.medications);
  }

  private checkEmergencyContactUpdate(newRecord: any, oldRecord: any): boolean {
    return (newRecord?.emergency_contact_name !== oldRecord?.emergency_contact_name) ||
           (newRecord?.emergency_contact_phone !== oldRecord?.emergency_contact_phone);
  }

  private checkInsuranceUpdate(newRecord: any, oldRecord: any): boolean {
    return (newRecord?.insurance_provider !== oldRecord?.insurance_provider) ||
           (newRecord?.insurance_number !== oldRecord?.insurance_number);
  }

  private async findPatientByProfileId(profileId: string): Promise<string | null> {
    try {
      const { data } = await supabaseAdmin
        .from('patients')
        .select('patient_id')
        .eq('profile_id', profileId)
        .single();
      
      return data?.patient_id || null;
    } catch (error) {
      logger.error('❌ Error finding patient by profile ID:', error);
      return null;
    }
  }

  // Placeholder methods for future implementation
  private async triggerWelcomeNotifications(event: PatientRealtimeEvent): Promise<void> {
    // Implementation for welcome notifications
  }

  private async updatePatientStatistics(): Promise<void> {
    // Implementation for statistics updates
  }

  private async handleMedicalHistoryUpdate(event: PatientRealtimeEvent): Promise<void> {
    logger.info('🏥 Medical history updated for patient:', event.patient_id);
  }

  private async handleEmergencyContactUpdate(event: PatientRealtimeEvent): Promise<void> {
    logger.info('📞 Emergency contact updated for patient:', event.patient_id);
  }

  private async cleanupPatientData(event: PatientRealtimeEvent): Promise<void> {
    // Implementation for data cleanup
  }

  private async updateCache(event: PatientRealtimeEvent): Promise<void> {
    // Implementation for cache updates
  }

  /**
   * Get connection status
   */
  public isRealtimeConnected(): boolean {
    return this.isConnected && this.subscription !== null;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
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
      logger.info('✅ Patient Real-time Service disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting Patient Real-time Service:', error);
    }
  }
}
