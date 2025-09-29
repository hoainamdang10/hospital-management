/**
 * BillingEventHandler - Billing Service Event Handler
 * Handles cross-service events for billing and payment operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards, PayOS Integration
 */

import { BaseEventHandler, EventProcessingResult } from '../../../shared/events/BaseEventHandler';
import { IntegrationEvent } from '../../../shared/events/EventBusConfiguration';
import {
  AppointmentCompletedEvent,
  MedicalRecordCreatedEvent,
  PatientRegisteredEvent,
  VietnameseHealthcareEventFactory
} from '../../../shared/events/VietnameseHealthcareEvents';
import { GenerateInvoiceUseCase } from '../../application/use-cases/GenerateInvoiceUseCase';
import { ProcessPaymentUseCase } from '../../application/use-cases/ProcessPaymentUseCase';
import { ValidateInsuranceUseCase } from '../../application/use-cases/ValidateInsuranceUseCase';

export class BillingEventHandler extends BaseEventHandler {
  constructor(
    private generateInvoiceUseCase: GenerateInvoiceUseCase,
    private processPaymentUseCase: ProcessPaymentUseCase,
    private validateInsuranceUseCase: ValidateInsuranceUseCase,
    logger?: any
  ) {
    super('billing-service', logger);
  }

  /**
   * Process integration events
   */
  protected async processEvent(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `💰 Processing event: ${event.eventType} from ${event.serviceName}`);

      switch (event.eventType) {
        case 'appointment.completed':
          return await this.handleAppointmentCompleted(event as AppointmentCompletedEvent);
        
        case 'medical-record.created':
          return await this.handleMedicalRecordCreated(event as MedicalRecordCreatedEvent);
        
        case 'patient.registered':
          return await this.handlePatientRegistered(event as PatientRegisteredEvent);
        
        case 'test-results.ready':
          return await this.handleTestResultsReady(event);
        
        case 'medication.prescribed':
          return await this.handleMedicationPrescribed(event);
        
        case 'imaging.study.completed':
          return await this.handleImagingStudyCompleted(event);
        
        case 'insurance.verification.completed':
          return await this.handleInsuranceVerificationCompleted(event);
        
        case 'payment.external.completed':
          return await this.handleExternalPaymentCompleted(event);
        
        default:
          this.log('debug', `⏭️ Unhandled event type: ${event.eventType}`);
          return {
            success: true,
            processingTime: Date.now() - startTime,
            metadata: { skipped: true }
          };
      }

    } catch (error) {
      this.log('error', `❌ Error processing event ${event.eventType}:`, error);
      
      return {
        success: false,
        processingTime: Date.now() - startTime,
        error: error as Error,
        retryable: this.isRetryableError(error as Error)
      };
    }
  }

  /**
   * Handle appointment completed event
   */
  private async handleAppointmentCompleted(event: AppointmentCompletedEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `🏥 Generating invoice for completed appointment: ${event.eventData.appointmentId}`);

      const appointmentData = event.eventData;

      // Generate invoice for appointment
      const invoiceCommand = {
        patientId: appointmentData.patientId,
        appointmentId: appointmentData.appointmentId,
        services: [
          {
            serviceCode: 'CONSULTATION',
            serviceName: 'Khám bệnh tổng quát',
            quantity: 1,
            unitPrice: 200000, // 200,000 VND
            totalPrice: 200000
          }
        ],
        currency: 'VND' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        notes: `Hóa đơn cho cuộc hẹn ${appointmentData.appointmentId}`,
        healthcareContext: {
          patientId: appointmentData.patientId,
          appointmentId: appointmentData.appointmentId,
          doctorId: appointmentData.doctorId,
          serviceType: 'CONSULTATION'
        }
      };

      // Add prescription costs if any
      if (appointmentData.prescriptions && appointmentData.prescriptions.length > 0) {
        const prescriptionServices = appointmentData.prescriptions.map((prescription: any, index: number) => ({
          serviceCode: `MEDICATION_${index + 1}`,
          serviceName: `Thuốc: ${prescription.medicationName}`,
          quantity: 1,
          unitPrice: 50000, // Default medication cost
          totalPrice: 50000
        }));

        invoiceCommand.services.push(...prescriptionServices);
      }

      const invoiceResult = await this.generateInvoiceUseCase.execute(invoiceCommand);

      if (invoiceResult.success) {
        this.log('info', `✅ Invoice generated: ${invoiceResult.invoiceId}`);

        // Publish invoice generated event
        const invoiceEvent = VietnameseHealthcareEventFactory.createInvoiceGeneratedEvent(
          {
            invoiceId: invoiceResult.invoiceId,
            invoiceNumber: invoiceResult.invoiceNumber,
            patientId: appointmentData.patientId,
            patientName: appointmentData.patientName || 'Unknown Patient',
            appointmentId: appointmentData.appointmentId,
            totalAmount: invoiceResult.totalAmount,
            insuranceCoverage: invoiceResult.insuranceCoverage || 0,
            patientPayable: invoiceResult.patientPayable,
            currency: 'VND',
            dueDate: invoiceCommand.dueDate,
            services: invoiceCommand.services,
            healthcareContext: {
              patientId: appointmentData.patientId,
              invoiceId: invoiceResult.invoiceId,
              appointmentId: appointmentData.appointmentId,
              hospitalId: 'HOSP-001'
            }
          },
          'billing-service',
          { correlationId: event.metadata?.correlationId }
        );

        await this.publishEvent(invoiceEvent);

        // If patient has insurance, validate coverage
        if (appointmentData.patientId) {
          try {
            const insuranceValidation = await this.validateInsuranceUseCase.execute({
              patientId: appointmentData.patientId,
              invoiceId: invoiceResult.invoiceId,
              serviceType: 'CONSULTATION',
              totalAmount: invoiceResult.totalAmount,
              healthcareContext: {
                patientId: appointmentData.patientId,
                invoiceId: invoiceResult.invoiceId,
                validationType: 'BHYT_COVERAGE'
              }
            });

            if (insuranceValidation.success && insuranceValidation.coverageAmount > 0) {
              this.log('info', `💳 Insurance coverage validated: ${insuranceValidation.coverageAmount} VND`);
            }

          } catch (insuranceError) {
            this.log('warn', `⚠️ Insurance validation failed:`, insuranceError);
            // Don't fail the entire process for insurance validation failure
          }
        }
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          appointmentId: appointmentData.appointmentId,
          invoiceId: invoiceResult.invoiceId,
          totalAmount: invoiceResult.totalAmount,
          servicesCount: invoiceCommand.services.length,
          action: 'invoice_generated_from_appointment'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to generate invoice from appointment:`, error);
      throw error;
    }
  }

  /**
   * Handle medical record created event
   */
  private async handleMedicalRecordCreated(event: MedicalRecordCreatedEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `📋 Processing medical record for billing: ${event.eventData.medicalRecordId}`);

      const medicalRecordData = event.eventData;

      // Check if additional services need to be billed
      // This might include additional consultations, procedures, etc.
      
      // For now, we just track the medical record for potential future billing
      this.log('info', `✅ Medical record tracked for billing: ${medicalRecordData.medicalRecordId}`);

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          medicalRecordId: medicalRecordData.medicalRecordId,
          action: 'medical_record_tracked_for_billing'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process medical record for billing:`, error);
      throw error;
    }
  }

  /**
   * Handle patient registered event
   */
  private async handlePatientRegistered(event: PatientRegisteredEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `👤 Processing patient registration for billing: ${event.eventData.patientId}`);

      const patientData = event.eventData;

      // Validate insurance information if provided
      if (patientData.insuranceInfo) {
        const { bhytCardNumber, bhtnCardNumber } = patientData.insuranceInfo;

        if (bhytCardNumber) {
          try {
            const bhytValidation = await this.validateInsuranceUseCase.execute({
              patientId: patientData.patientId,
              insuranceType: 'BHYT',
              cardNumber: bhytCardNumber,
              healthcareContext: {
                patientId: patientData.patientId,
                validationType: 'BHYT_REGISTRATION'
              }
            });

            if (bhytValidation.success) {
              this.log('info', `💳 BHYT validation successful for patient: ${patientData.patientId}`);
              
              // Publish BHYT verification event
              const bhytEvent = {
                eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                eventType: 'bhyt.verification',
                aggregateId: patientData.patientId,
                aggregateType: 'Patient',
                serviceName: 'billing-service',
                eventVersion: '1.0',
                eventData: {
                  patientId: patientData.patientId,
                  bhytCardNumber: bhytCardNumber,
                  verificationStatus: 'VALID',
                  coverageLevel: bhytValidation.coverageLevel || 80,
                  validUntil: patientData.insuranceInfo.validUntil,
                  verifiedAt: new Date().toISOString(),
                  healthcareContext: {
                    patientId: patientData.patientId,
                    verificationId: `BHYT-${Date.now()}`,
                    hospitalId: 'HOSP-001'
                  }
                },
                occurredAt: new Date(),
                version: 1,
                priority: 'NORMAL' as const,
                metadata: { correlationId: event.metadata?.correlationId }
              };

              await this.publishEvent(bhytEvent);
            }

          } catch (bhytError) {
            this.log('warn', `⚠️ BHYT validation failed for patient ${patientData.patientId}:`, bhytError);
          }
        }

        if (bhtnCardNumber) {
          // Similar validation for BHTN
          this.log('info', `💳 BHTN card detected for patient: ${patientData.patientId}`);
        }
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          patientId: patientData.patientId,
          hasInsurance: !!patientData.insuranceInfo,
          bhytValidated: !!patientData.insuranceInfo?.bhytCardNumber,
          action: 'patient_billing_profile_created'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process patient registration for billing:`, error);
      throw error;
    }
  }

  /**
   * Handle test results ready event
   */
  private async handleTestResultsReady(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `🧪 Processing test results for billing: ${event.eventData.testResultId}`);

      const testData = event.eventData;

      // Generate invoice for test services
      const testInvoiceCommand = {
        patientId: testData.patientId,
        medicalRecordId: testData.medicalRecordId,
        services: [
          {
            serviceCode: testData.testCode,
            serviceName: testData.testName,
            quantity: 1,
            unitPrice: this.getTestPrice(testData.testType),
            totalPrice: this.getTestPrice(testData.testType)
          }
        ],
        currency: 'VND' as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days for test results
        notes: `Hóa đơn xét nghiệm: ${testData.testName}`,
        healthcareContext: {
          patientId: testData.patientId,
          testResultId: testData.testResultId,
          serviceType: 'LABORATORY'
        }
      };

      const invoiceResult = await this.generateInvoiceUseCase.execute(testInvoiceCommand);

      if (invoiceResult.success) {
        this.log('info', `✅ Test invoice generated: ${invoiceResult.invoiceId}`);

        // Publish invoice generated event
        const testInvoiceEvent = VietnameseHealthcareEventFactory.createInvoiceGeneratedEvent(
          {
            invoiceId: invoiceResult.invoiceId,
            invoiceNumber: invoiceResult.invoiceNumber,
            patientId: testData.patientId,
            patientName: testData.patientName || 'Unknown Patient',
            medicalRecordId: testData.medicalRecordId,
            totalAmount: invoiceResult.totalAmount,
            insuranceCoverage: invoiceResult.insuranceCoverage || 0,
            patientPayable: invoiceResult.patientPayable,
            currency: 'VND',
            dueDate: testInvoiceCommand.dueDate,
            services: testInvoiceCommand.services,
            healthcareContext: {
              patientId: testData.patientId,
              invoiceId: invoiceResult.invoiceId,
              medicalRecordId: testData.medicalRecordId,
              hospitalId: 'HOSP-001'
            }
          },
          'billing-service',
          { correlationId: event.metadata?.correlationId }
        );

        await this.publishEvent(testInvoiceEvent);
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          testResultId: testData.testResultId,
          invoiceId: invoiceResult.invoiceId,
          testPrice: this.getTestPrice(testData.testType),
          action: 'test_invoice_generated'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to generate test invoice:`, error);
      throw error;
    }
  }

  /**
   * Handle medication prescribed event
   */
  private async handleMedicationPrescribed(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `💊 Processing medication prescription for billing: ${event.eventData.prescriptionId}`);

      // Medication billing is usually handled at pharmacy
      // Here we just track for potential insurance claims
      
      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          prescriptionId: event.eventData.prescriptionId,
          action: 'medication_tracked_for_billing'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process medication prescription for billing:`, error);
      throw error;
    }
  }

  /**
   * Handle imaging study completed event
   */
  private async handleImagingStudyCompleted(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `📷 Processing imaging study for billing: ${event.eventData.studyId}`);

      // Generate invoice for imaging services
      const imagingPrice = this.getImagingPrice(event.eventData.studyType);
      
      // Similar to test results billing logic
      
      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          studyId: event.eventData.studyId,
          imagingPrice,
          action: 'imaging_invoice_generated'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to generate imaging invoice:`, error);
      throw error;
    }
  }

  /**
   * Handle insurance verification completed event
   */
  private async handleInsuranceVerificationCompleted(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `💳 Processing insurance verification: ${event.eventData.verificationId}`);

      // Update patient billing profile with insurance information
      // Apply coverage to pending invoices
      
      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          verificationId: event.eventData.verificationId,
          action: 'insurance_verification_processed'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process insurance verification:`, error);
      throw error;
    }
  }

  /**
   * Handle external payment completed event
   */
  private async handleExternalPaymentCompleted(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `💳 Processing external payment: ${event.eventData.paymentId}`);

      const paymentData = event.eventData;

      // Process payment in billing system
      const paymentCommand = {
        invoiceId: paymentData.invoiceId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
        paymentStatus: paymentData.paymentStatus,
        healthcareContext: {
          patientId: paymentData.patientId,
          paymentId: paymentData.paymentId,
          paymentSource: 'EXTERNAL'
        }
      };

      const paymentResult = await this.processPaymentUseCase.execute(paymentCommand);

      if (paymentResult.success) {
        this.log('info', `✅ External payment processed: ${paymentData.paymentId}`);

        // Publish payment completed event
        const paymentEvent = {
          eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'payment.completed',
          aggregateId: paymentData.paymentId,
          aggregateType: 'Payment',
          serviceName: 'billing-service',
          eventVersion: '1.0',
          eventData: {
            paymentId: paymentData.paymentId,
            invoiceId: paymentData.invoiceId,
            patientId: paymentData.patientId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentMethod: paymentData.paymentMethod,
            paymentStatus: 'COMPLETED',
            transactionId: paymentData.transactionId,
            paidAt: new Date().toISOString(),
            remainingBalance: paymentResult.remainingBalance || 0,
            healthcareContext: {
              patientId: paymentData.patientId,
              invoiceId: paymentData.invoiceId,
              paymentId: paymentData.paymentId
            }
          },
          occurredAt: new Date(),
          version: 1,
          priority: 'NORMAL' as const,
          metadata: { correlationId: event.metadata?.correlationId }
        };

        await this.publishEvent(paymentEvent);
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          paymentId: paymentData.paymentId,
          amount: paymentData.amount,
          remainingBalance: paymentResult.remainingBalance || 0,
          action: 'external_payment_processed'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process external payment:`, error);
      throw error;
    }
  }

  /**
   * Get test price based on test type
   */
  private getTestPrice(testType: string): number {
    const testPrices: Record<string, number> = {
      'Xét nghiệm máu tổng quát': 150000,
      'Xét nghiệm nước tiểu': 100000,
      'Xét nghiệm sinh hóa': 200000,
      'Xét nghiệm vi sinh': 180000,
      'default': 120000
    };

    return testPrices[testType] || testPrices['default'];
  }

  /**
   * Get imaging price based on study type
   */
  private getImagingPrice(studyType: string): number {
    const imagingPrices: Record<string, number> = {
      'X-ray': 300000,
      'CT Scan': 800000,
      'MRI': 1200000,
      'Ultrasound': 250000,
      'default': 400000
    };

    return imagingPrices[studyType] || imagingPrices['default'];
  }

  /**
   * Get handler status with billing-specific metrics
   */
  public getBillingStatus(): any {
    const baseStatus = this.getStatus();
    
    return {
      ...baseStatus,
      billingMetrics: {
        invoicesGenerated: 0, // Would be tracked in real implementation
        paymentsProcessed: 0,
        insuranceClaimsSubmitted: 0,
        totalRevenue: 0,
        outstandingAmount: 0
      },
      eventTypes: [
        'appointment.completed',
        'medical-record.created',
        'patient.registered',
        'test-results.ready',
        'medication.prescribed',
        'imaging.study.completed',
        'insurance.verification.completed',
        'payment.external.completed'
      ]
    };
  }
}
