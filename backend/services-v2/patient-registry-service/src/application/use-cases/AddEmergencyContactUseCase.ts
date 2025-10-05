/**
 * AddEmergencyContactUseCase - Application Layer
 * Add emergency contact to existing patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { PatientId } from '../../domain/value-objects/PatientId';

export interface AddEmergencyContactCommand {
  patientId: string;
  name: string;
  relationship: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
  performedBy: string;
}

export interface AddEmergencyContactResult {
  success: boolean;
  contactId: string;
  message: string;
}

/**
 * Use Case: Add Emergency Contact
 */
export class AddEmergencyContactUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(command: AddEmergencyContactCommand): Promise<AddEmergencyContactResult> {
    // 1. Validate input
    if (!command.patientId || command.patientId.trim().length === 0) {
      throw new Error('Patient ID không được để trống');
    }

    if (!command.name || command.name.trim().length === 0) {
      throw new Error('Tên người liên hệ không được để trống');
    }

    if (!command.relationship || command.relationship.trim().length === 0) {
      throw new Error('Mối quan hệ không được để trống');
    }

    if (!command.primaryPhone || command.primaryPhone.trim().length === 0) {
      throw new Error('Số điện thoại không được để trống');
    }

    if (!command.performedBy || command.performedBy.trim().length === 0) {
      throw new Error('Người thực hiện không được để trống');
    }

    // 2. Find patient
    const patientId = PatientId.create(command.patientId);
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new Error(`Không tìm thấy bệnh nhân với ID: ${command.patientId}`);
    }

    // 3. Create emergency contact
    const contact = EmergencyContact.create(
      command.name,
      command.relationship,
      command.primaryPhone,
      command.secondaryPhone,
      command.email,
      command.address,
      command.isPrimary || false
    );

    // 4. Add to patient
    patient.addEmergencyContact(contact, command.performedBy);

    // 5. Save patient
    await this.patientRepository.save(patient);

    return {
      success: true,
      contactId: contact.getId(),
      message: 'Đã thêm người liên hệ khẩn cấp thành công'
    };
  }
}

