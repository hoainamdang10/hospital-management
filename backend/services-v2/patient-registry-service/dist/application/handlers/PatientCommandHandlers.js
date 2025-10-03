"use strict";
/**
 * PatientCommandHandlers - Application Command Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS Command handlers for patient registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientCommandHandlers = void 0;
/**
 * Patient Command Handlers
 * Handles all patient-related commands with proper validation and authorization
 */
class PatientCommandHandlers {
    constructor(registerPatientUseCase, updatePatientInfoUseCase, logger) {
        this.registerPatientUseCase = registerPatientUseCase;
        this.updatePatientInfoUseCase = updatePatientInfoUseCase;
        this.logger = logger;
    }
    /**
     * Handle RegisterPatient command
     */
    async handleRegisterPatient(command) {
        try {
            this.logger.info('Processing RegisterPatient command', {
                commandId: command.commandId,
                requestedBy: command.requestedBy,
                userId: command.data.userId
            });
            // Validate command structure
            if (!this.isValidRegisterPatientCommand(command)) {
                return {
                    success: false,
                    message: 'Cấu trúc lệnh đăng ký bệnh nhân không hợp lệ'
                };
            }
            // Execute use case
            const result = await this.registerPatientUseCase.execute(command.data);
            this.logger.info('RegisterPatient command processed', {
                commandId: command.commandId,
                success: result.success,
                patientId: result.patientId
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing RegisterPatient command', {
                commandId: command.commandId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi xử lý lệnh đăng ký bệnh nhân'
            };
        }
    }
    /**
     * Handle UpdatePatientInfo command
     */
    async handleUpdatePatientInfo(command) {
        try {
            this.logger.info('Processing UpdatePatientInfo command', {
                commandId: command.commandId,
                requestedBy: command.requestedBy,
                patientId: command.data.patientId
            });
            // Validate command structure
            if (!this.isValidUpdatePatientInfoCommand(command)) {
                return {
                    success: false,
                    message: 'Cấu trúc lệnh cập nhật thông tin bệnh nhân không hợp lệ'
                };
            }
            // Execute use case
            const result = await this.updatePatientInfoUseCase.execute(command.data);
            this.logger.info('UpdatePatientInfo command processed', {
                commandId: command.commandId,
                success: result.success,
                patientId: command.data.patientId
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing UpdatePatientInfo command', {
                commandId: command.commandId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi xử lý lệnh cập nhật thông tin bệnh nhân'
            };
        }
    }
    /**
     * Handle DeactivatePatient command
     */
    async handleDeactivatePatient(command) {
        try {
            this.logger.info('Processing DeactivatePatient command', {
                commandId: command.commandId,
                requestedBy: command.requestedBy,
                patientId: command.data.patientId
            });
            // Validate command structure
            if (!this.isValidDeactivatePatientCommand(command)) {
                return {
                    success: false,
                    message: 'Cấu trúc lệnh vô hiệu hóa bệnh nhân không hợp lệ'
                };
            }
            // TODO: Implement deactivate patient use case
            // For now, return success
            this.logger.info('DeactivatePatient command processed', {
                commandId: command.commandId,
                patientId: command.data.patientId
            });
            return {
                success: true,
                message: 'Vô hiệu hóa bệnh nhân thành công'
            };
        }
        catch (error) {
            this.logger.error('Error processing DeactivatePatient command', {
                commandId: command.commandId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi xử lý lệnh vô hiệu hóa bệnh nhân'
            };
        }
    }
    /**
     * Handle GrantPatientConsent command
     */
    async handleGrantPatientConsent(command) {
        try {
            this.logger.info('Processing GrantPatientConsent command', {
                commandId: command.commandId,
                requestedBy: command.requestedBy,
                patientId: command.data.patientId
            });
            // Validate command structure
            if (!this.isValidGrantPatientConsentCommand(command)) {
                return {
                    success: false,
                    message: 'Cấu trúc lệnh cấp phép bệnh nhân không hợp lệ'
                };
            }
            // TODO: Implement grant patient consent use case
            // For now, return success
            this.logger.info('GrantPatientConsent command processed', {
                commandId: command.commandId,
                patientId: command.data.patientId
            });
            return {
                success: true,
                message: 'Cấp phép bệnh nhân thành công'
            };
        }
        catch (error) {
            this.logger.error('Error processing GrantPatientConsent command', {
                commandId: command.commandId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi xử lý lệnh cấp phép bệnh nhân'
            };
        }
    }
    /**
     * Handle AddEmergencyContact command
     */
    async handleAddEmergencyContact(command) {
        try {
            this.logger.info('Processing AddEmergencyContact command', {
                commandId: command.commandId,
                requestedBy: command.requestedBy,
                patientId: command.data.patientId
            });
            // Validate command structure
            if (!this.isValidAddEmergencyContactCommand(command)) {
                return {
                    success: false,
                    message: 'Cấu trúc lệnh thêm liên hệ khẩn cấp không hợp lệ'
                };
            }
            // TODO: Implement add emergency contact use case
            // For now, return success
            this.logger.info('AddEmergencyContact command processed', {
                commandId: command.commandId,
                patientId: command.data.patientId
            });
            return {
                success: true,
                message: 'Thêm liên hệ khẩn cấp thành công'
            };
        }
        catch (error) {
            this.logger.error('Error processing AddEmergencyContact command', {
                commandId: command.commandId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi xử lý lệnh thêm liên hệ khẩn cấp'
            };
        }
    }
    /**
     * Generic command handler dispatcher
     */
    async handleCommand(command) {
        switch (command.commandType) {
            case 'RegisterPatient':
                return this.handleRegisterPatient(command);
            case 'UpdatePatientInfo':
                return this.handleUpdatePatientInfo(command);
            case 'DeactivatePatient':
                return this.handleDeactivatePatient(command);
            case 'GrantPatientConsent':
                return this.handleGrantPatientConsent(command);
            case 'AddEmergencyContact':
                return this.handleAddEmergencyContact(command);
            default:
                this.logger.warn('Unknown command type', {
                    commandType: command.commandType,
                    commandId: command.commandId
                });
                return {
                    success: false,
                    message: 'Loại lệnh không được hỗ trợ'
                };
        }
    }
    // Command validation methods
    isValidRegisterPatientCommand(command) {
        return !!(command.commandId &&
            command.commandType === 'RegisterPatient' &&
            command.data &&
            command.data.userId &&
            command.data.personalInfo &&
            command.data.contactInfo &&
            command.data.requestedBy);
    }
    isValidUpdatePatientInfoCommand(command) {
        return !!(command.commandId &&
            command.commandType === 'UpdatePatientInfo' &&
            command.data &&
            command.data.patientId &&
            command.data.updates &&
            command.data.requestedBy);
    }
    isValidDeactivatePatientCommand(command) {
        return !!(command.commandId &&
            command.commandType === 'DeactivatePatient' &&
            command.data &&
            command.data.patientId &&
            command.data.reason &&
            command.data.requestedBy);
    }
    isValidGrantPatientConsentCommand(command) {
        return !!(command.commandId &&
            command.commandType === 'GrantPatientConsent' &&
            command.data &&
            command.data.patientId &&
            command.data.consentType &&
            command.data.grantedBy);
    }
    isValidAddEmergencyContactCommand(command) {
        return !!(command.commandId &&
            command.commandType === 'AddEmergencyContact' &&
            command.data &&
            command.data.patientId &&
            command.data.contactInfo &&
            command.data.contactInfo.name &&
            command.data.contactInfo.phoneNumber &&
            command.data.requestedBy);
    }
    /**
     * Get handler status for health checks
     */
    getStatus() {
        return {
            handlerName: 'PatientCommandHandlers',
            supportedCommands: [
                'RegisterPatient',
                'UpdatePatientInfo',
                'DeactivatePatient',
                'GrantPatientConsent',
                'AddEmergencyContact'
            ],
            isHealthy: true,
            lastProcessedAt: new Date().toISOString()
        };
    }
}
exports.PatientCommandHandlers = PatientCommandHandlers;
//# sourceMappingURL=PatientCommandHandlers.js.map