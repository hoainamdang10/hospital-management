/**
 * Register Patient Command Handler - CQRS Pattern
 * Handles patient registration commands
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, DDD, HIPAA, Event Sourcing
 */

import { CommandHandler } from '../../base/command';
import { RegisterPatientCommand } from '../../commands/patient/register-patient.command';
import { Patient } from '../../../domain/aggregates/patient.aggregate';
import { PersonalInfo } from '../../../domain/value-objects/personal-info';
import { ContactInfo } from '../../../domain/value-objects/contact-info';
import { MedicalInfo } from '../../../domain/value-objects/medical-info';
import { EmergencyContact } from '../../../domain/value-objects/emergency-contact';
import { InsuranceInfo } from '../../../domain/value-objects/insurance-info';
import { IPatientRepository } from '../../../domain/repositories/patient.repository';
import { IEventStore } from '../../../infrastructure/event-store/event-store.interface';
import { IDomainEventPublisher } from '../../../domain/events/domain-event-publisher.interface';

export interface RegisterPatientResult {
  patientId: string;
  success: boolean;
  message: string;
  fhirComplianceScore: number;
  warnings?: string[];
}

/**
 * Register Patient Command Handler
 * Creates new patient aggregate and persists it
 */
export class RegisterPatientHandler extends CommandHandler<RegisterPatientCommand, RegisterPatientResult> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventStore: IEventStore,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  /**
   * Execute patient registration command
   */
  protected async executeCommand(command: RegisterPatientCommand): Promise<RegisterPatientResult> {
    // Create value objects from command data
    const personalInfo = this.createPersonalInfo(command);
    const contactInfo = this.createContactInfo(command);
    const medicalInfo = this.createMedicalInfo(command);
    const emergencyContact = this.createEmergencyContact(command);
    const insuranceInfo = this.createInsuranceInfo(command);

    // Create patient aggregate
    const patient = Patient.create(
      personalInfo,
      contactInfo,
      medicalInfo,
      emergencyContact,
      insuranceInfo
    );

    // Validate business rules
    await this.validateBusinessRules(patient, command);

    // Persist patient aggregate
    await this.patientRepository.save(patient);

    // Store domain events in event store
    const events = patient.getUncommittedEvents();
    if (events.length > 0) {
      await this.eventStore.saveEvents(
        patient.id,
        'Patient',
        events,
        patient.getVersion()
      );

      // Publish domain events
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }

      // Mark events as committed
      patient.markEventsAsCommitted();
    }

    // Calculate FHIR compliance score
    const fhirComplianceScore = patient.getFHIRComplianceScore();

    // Generate warnings if needed
    const warnings = this.generateWarnings(patient, fhirComplianceScore);

    return {
      patientId: patient.patientId.value,
      success: true,
      message: `Bệnh nhân ${personalInfo.fullName} đã được đăng ký thành công với ID ${patient.patientId.value}`,
      fhirComplianceScore,
      warnings
    };
  }

  /**
   * Create PersonalInfo value object from command
   */
  private createPersonalInfo(command: RegisterPatientCommand): PersonalInfo {
    const data = command.getPersonalInfo();
    return PersonalInfo.create(
      data.fullName,
      data.dateOfBirth,
      data.gender as any,
      data.nationalId,
      data.nationality,
      data.occupation,
      data.maritalStatus
    );
  }

  /**
   * Create ContactInfo value object from command
   */
  private createContactInfo(command: RegisterPatientCommand): ContactInfo {
    const data = command.getContactInfo();
    return ContactInfo.create(
      data.phoneNumber,
      data.email,
      data.address,
      data.preferredContactMethod
    );
  }

  /**
   * Create MedicalInfo value object from command
   */
  private createMedicalInfo(command: RegisterPatientCommand): MedicalInfo {
    const data = command.getMedicalInfo();
    return MedicalInfo.create(
      data.bloodType as any,
      data.allergies || [],
      data.chronicConditions || [],
      data.currentMedications || [],
      data.medicalHistory,
      data.familyMedicalHistory,
      data.smokingStatus,
      data.alcoholConsumption,
      data.exerciseFrequency
    );
  }

  /**
   * Create EmergencyContact value object from command
   */
  private createEmergencyContact(command: RegisterPatientCommand): EmergencyContact | undefined {
    const data = command.getEmergencyContact();
    if (!data) return undefined;

    return EmergencyContact.create(
      data.fullName,
      data.relationship,
      data.phoneNumber,
      data.alternatePhoneNumber,
      data.email,
      data.address,
      data.isPrimary
    );
  }

  /**
   * Create InsuranceInfo value object from command
   */
  private createInsuranceInfo(command: RegisterPatientCommand): InsuranceInfo | undefined {
    const data = command.getInsuranceInfo();
    if (!data) return undefined;

    return InsuranceInfo.create(
      data.provider,
      data.policyNumber,
      data.subscriberName,
      data.subscriberDateOfBirth,
      data.relationshipToSubscriber,
      data.effectiveDate,
      data.coverageType,
      data.groupNumber,
      data.expirationDate,
      data.copayAmount,
      data.deductibleAmount,
      data.isActive
    );
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(patient: Patient, command: RegisterPatientCommand): Promise<void> {
    // Check for duplicate phone number
    const existingPatientByPhone = await this.patientRepository.findByPhoneNumber(
      patient.contactInfo.phoneNumber
    );
    if (existingPatientByPhone) {
      throw new Error(`Số điện thoại ${patient.contactInfo.phoneNumber} đã được sử dụng bởi bệnh nhân khác`);
    }

    // Check for duplicate national ID if provided
    if (patient.personalInfo.nationalId) {
      const existingPatientByNationalId = await this.patientRepository.findByNationalId(
        patient.personalInfo.nationalId
      );
      if (existingPatientByNationalId) {
        throw new Error(`CMND/CCCD ${patient.personalInfo.nationalId} đã được sử dụng bởi bệnh nhân khác`);
      }
    }

    // Check for duplicate email if provided
    if (patient.contactInfo.email) {
      const existingPatientByEmail = await this.patientRepository.findByEmail(
        patient.contactInfo.email
      );
      if (existingPatientByEmail) {
        throw new Error(`Email ${patient.contactInfo.email} đã được sử dụng bởi bệnh nhân khác`);
      }
    }

    // Validate insurance policy if provided
    if (patient.insuranceInfo) {
      const existingPatientByPolicy = await this.patientRepository.findByInsurancePolicyNumber(
        patient.insuranceInfo.policyNumber
      );
      if (existingPatientByPolicy && 
          patient.insuranceInfo.relationshipToSubscriber === 'self') {
        throw new Error(`Số bảo hiểm ${patient.insuranceInfo.policyNumber} đã được sử dụng bởi bệnh nhân khác`);
      }
    }

    // Validate consent requirements
    if (!command.isConsentGiven()) {
      throw new Error('Bệnh nhân phải đồng ý với việc xử lý dữ liệu y tế');
    }

    if (!command.isPrivacyPolicyAccepted()) {
      throw new Error('Bệnh nhân phải chấp nhận chính sách bảo mật');
    }
  }

  /**
   * Generate warnings for patient registration
   */
  private generateWarnings(patient: Patient, fhirComplianceScore: number): string[] {
    const warnings: string[] = [];

    // FHIR compliance warnings
    if (fhirComplianceScore < 80) {
      warnings.push(`Điểm tuân thủ FHIR thấp (${fhirComplianceScore}%). Cần bổ sung thông tin để đạt tiêu chuẩn y tế.`);
    }

    // Missing emergency contact for adults
    if (!patient.hasEmergencyContact() && !patient.isMinor()) {
      warnings.push('Khuyến nghị thêm thông tin người liên hệ khẩn cấp để đảm bảo an toàn.');
    }

    // Missing insurance information
    if (!patient.hasValidInsurance()) {
      warnings.push('Chưa có thông tin bảo hiểm. Bệnh nhân có thể phải thanh toán toàn bộ chi phí điều trị.');
    }

    // High-risk patient warnings
    const riskAssessment = patient.medicalInfo.getLifestyleRiskAssessment();
    if (riskAssessment.riskLevel === 'high') {
      warnings.push(`Bệnh nhân có nguy cơ cao: ${riskAssessment.riskFactors.join(', ')}. Cần theo dõi đặc biệt.`);
    }

    // Age-related warnings
    if (patient.getAge() >= 65) {
      warnings.push('Bệnh nhân cao tuổi. Cần chú ý đặc biệt về tương tác thuốc và các biến chứng.');
    }

    if (patient.isMinor()) {
      warnings.push('Bệnh nhân dưới 18 tuổi. Cần có sự đồng ý của phụ huynh/người giám hộ cho các thủ thuật y tế.');
    }

    // Medical history warnings
    if (patient.medicalInfo.hasAllergies()) {
      warnings.push(`Bệnh nhân có dị ứng: ${patient.medicalInfo.allergies.join(', ')}. Cần cảnh báo khi kê đơn thuốc.`);
    }

    if (patient.medicalInfo.hasChronicConditions()) {
      warnings.push(`Bệnh nhân có bệnh mãn tính: ${patient.medicalInfo.chronicConditions.join(', ')}. Cần theo dõi định kỳ.`);
    }

    if (patient.medicalInfo.hasCurrentMedications()) {
      warnings.push(`Bệnh nhân đang dùng ${patient.medicalInfo.currentMedications.length} loại thuốc. Cần kiểm tra tương tác thuốc.`);
    }

    return warnings;
  }

  /**
   * Log successful patient registration
   */
  protected async logCommandSuccess(command: RegisterPatientCommand, result: RegisterPatientResult): Promise<void> {
    await super.logCommandSuccess(command, result);
    
    // Additional logging for patient registration
    console.log('Patient registered successfully', {
      patientId: result.patientId,
      patientName: command.getPersonalInfo().fullName,
      registrationSource: command.getRegistrationSource(),
      fhirComplianceScore: result.fhirComplianceScore,
      hasInsurance: !!command.getInsuranceInfo(),
      hasEmergencyContact: !!command.getEmergencyContact(),
      warningsCount: result.warnings?.length || 0,
    });
  }
}
