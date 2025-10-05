"use strict";
/**
 * VietnameseHealthcareEvents - Vietnamese Healthcare Domain Events
 * Comprehensive event definitions for Vietnamese healthcare workflows
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, HIPAA, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VietnameseHealthcareEventFactory = void 0;
// ================================
// EVENT FACTORY
// ================================
class VietnameseHealthcareEventFactory {
    /**
     * Create patient registered event
     */
    static createPatientRegisteredEvent(patientData, serviceName, metadata) {
        return {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventType: 'patient.registered',
            aggregateId: patientData.patientId,
            aggregateType: 'Patient',
            serviceName,
            eventVersion: '1.0',
            eventData: patientData,
            occurredAt: new Date(),
            version: 1,
            priority: 'NORMAL',
            metadata: {
                correlationId: metadata?.correlationId || `corr_${Date.now()}`,
                traceId: metadata?.traceId || `trace_${Date.now()}`,
                source: serviceName,
                ...metadata
            }
        };
    }
    /**
     * Create appointment scheduled event
     */
    static createAppointmentScheduledEvent(appointmentData, serviceName, metadata) {
        return {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventType: 'appointment.scheduled',
            aggregateId: appointmentData.appointmentId,
            aggregateType: 'Appointment',
            serviceName,
            eventVersion: '1.0',
            eventData: appointmentData,
            occurredAt: new Date(),
            version: 1,
            priority: 'HIGH',
            metadata: {
                correlationId: metadata?.correlationId || `corr_${Date.now()}`,
                traceId: metadata?.traceId || `trace_${Date.now()}`,
                source: serviceName,
                ...metadata
            }
        };
    }
    /**
     * Create test results ready event
     */
    static createTestResultsReadyEvent(testResultData, serviceName, metadata) {
        return {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventType: 'test-results.ready',
            aggregateId: testResultData.testResultId,
            aggregateType: 'TestResult',
            serviceName,
            eventVersion: '1.0',
            eventData: testResultData,
            occurredAt: new Date(),
            version: 1,
            priority: testResultData.overallStatus === 'CRITICAL' ? 'URGENT' : 'HIGH',
            metadata: {
                correlationId: metadata?.correlationId || `corr_${Date.now()}`,
                traceId: metadata?.traceId || `trace_${Date.now()}`,
                source: serviceName,
                ...metadata
            }
        };
    }
    /**
     * Create emergency alert event
     */
    static createEmergencyAlertEvent(alertData, serviceName, metadata) {
        return {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventType: 'emergency.alert',
            aggregateId: alertData.alertId,
            aggregateType: 'EmergencyAlert',
            serviceName,
            eventVersion: '1.0',
            eventData: alertData,
            occurredAt: new Date(),
            version: 1,
            priority: 'URGENT',
            metadata: {
                correlationId: metadata?.correlationId || `corr_${Date.now()}`,
                traceId: metadata?.traceId || `trace_${Date.now()}`,
                source: serviceName,
                ...metadata
            }
        };
    }
    /**
     * Create invoice generated event
     */
    static createInvoiceGeneratedEvent(invoiceData, serviceName, metadata) {
        return {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventType: 'invoice.generated',
            aggregateId: invoiceData.invoiceId,
            aggregateType: 'Invoice',
            serviceName,
            eventVersion: '1.0',
            eventData: invoiceData,
            occurredAt: new Date(),
            version: 1,
            priority: 'NORMAL',
            metadata: {
                correlationId: metadata?.correlationId || `corr_${Date.now()}`,
                traceId: metadata?.traceId || `trace_${Date.now()}`,
                source: serviceName,
                ...metadata
            }
        };
    }
}
exports.VietnameseHealthcareEventFactory = VietnameseHealthcareEventFactory;
//# sourceMappingURL=VietnameseHealthcareEvents.js.map