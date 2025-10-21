"use strict";
/**
 * UpdateInsuranceInfoUseCase - Application Layer
 * Update insurance information for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInsuranceInfoUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class UpdateInsuranceInfoUseCase {
    constructor(patientRepository, eventBus, logger) {
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async execute(command) {
        this.logger.info('Updating insurance info', {
            patientId: command.patientId,
            performedBy: command.performedBy
        });
        try {
            if (!command.patientId || command.patientId.trim().length === 0) {
                return {
                    success: false,
                    message: 'Patient ID không được để trống',
                    errors: ['INVALID_PATIENT_ID']
                };
            }
            const patientId = PatientId_1.PatientId.create(command.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
                    errors: ['PATIENT_NOT_FOUND']
                };
            }
            const currentInsurance = patient.getInsuranceInfo();
            if (!currentInsurance) {
                return {
                    success: false,
                    message: 'Bệnh nhân chưa có thông tin bảo hiểm để cập nhật',
                    errors: ['NO_INSURANCE_INFO']
                };
            }
            // Update insurance info using activate/deactivate/setPrimary/removePrimary methods
            if (command.isActive !== undefined) {
                if (command.isActive) {
                    currentInsurance.activate();
                }
                else {
                    currentInsurance.deactivate();
                }
            }
            if (command.isPrimary !== undefined) {
                if (command.isPrimary) {
                    currentInsurance.setPrimary();
                }
                else {
                    currentInsurance.removePrimary();
                }
            }
            // Note: Other fields (provider, policyNumber, validFrom, validTo) are immutable
            // To change them, create a new InsuranceInfo entity
            // Save patient
            await this.patientRepository.save(patient);
            // Publish domain events
            await this.publishDomainEvents(patient);
            this.logger.info('Insurance info updated successfully', {
                patientId: command.patientId
            });
            return {
                success: true,
                message: 'Cập nhật thông tin bảo hiểm thành công'
            };
        }
        catch (error) {
            this.logger.error('Error updating insurance info', {
                patientId: command.patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi khi cập nhật thông tin bảo hiểm',
                errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
            };
        }
    }
    async publishDomainEvents(patient) {
        try {
            const events = patient.getUncommittedEvents();
            for (const event of events) {
                await this.eventBus.publish(event);
            }
            patient.markEventsAsCommitted();
        }
        catch (error) {
            this.logger.warn('Event publishing failed, but insurance info was updated', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.UpdateInsuranceInfoUseCase = UpdateInsuranceInfoUseCase;
//# sourceMappingURL=UpdateInsuranceInfoUseCase.js.map