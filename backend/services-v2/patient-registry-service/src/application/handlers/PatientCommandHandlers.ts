/**
 * PatientCommandHandlers - Application Command Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS Command handlers for patient registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */

import { RegisterPatientUseCase, RegisterPatientRequest, RegisterPatientResponse } from '../use-cases/RegisterPatientUseCase';
import { UpdatePatientInfoUseCase, UpdatePatientInfoRequest, UpdatePatientInfoResponse } from '../use-cases/UpdatePatientInfoUseCase';
import { DeactivatePatientUseCase, DeactivatePatientResponse } from '../use-cases/DeactivatePatientUseCase';
import { GrantConsentUseCase, GrantConsentResult } from '../use-cases/GrantConsentUseCase';
import { AddEmergencyContactUseCase, AddEmergencyContactResult } from '../use-cases/AddEmergencyContactUseCase';
import { ILogger } from '@shared/application/services/logger.interface';

// Command interfaces
export interface RegisterPatientCommand {
  commandId: string;
  commandType: 'RegisterPatient';
  timestamp: Date;
  requestedBy: string;
  data: RegisterPatientRequest;
}

export interface UpdatePatientInfoCommand {
  commandId: string;
  commandType: 'UpdatePatientInfo';
  timestamp: Date;
  requestedBy: string;
  data: UpdatePatientInfoRequest;
}

export interface DeactivatePatientCommand {
  commandId: string;
  commandType: 'DeactivatePatient';
  timestamp: Date;
  requestedBy: string;
  data: {
    patientId: string;
    reason: string;
    requestedBy: string;
    requestedByRole: string;
  };
}

export interface GrantPatientConsentCommand {
  commandId: string;
  commandType: 'GrantPatientConsent';
  timestamp: Date;
  requestedBy: string;
  data: {
    patientId: string;
    consentType: string;
    consentDetails: string;
    grantedBy: string;
    expiresAt?: Date;
  };
}

export interface AddEmergencyContactCommand {
  commandId: string;
  commandType: 'AddEmergencyContact';
  timestamp: Date;
  requestedBy: string;
  data: {
    patientId: string;
    contactInfo: {
      name: string;
      relationship: string;
      phoneNumber: string;
      secondaryPhone?: string;
      email?: string;
      address?: string;
      isPrimary?: boolean;
    };
    requestedBy: string;
    requestedByRole: string;
  };
}

export type PatientCommand =
  | RegisterPatientCommand
  | UpdatePatientInfoCommand
  | DeactivatePatientCommand
  | GrantPatientConsentCommand
  | AddEmergencyContactCommand;

/**
 * Union type for all command results
 */
export type PatientCommandResult =
  | RegisterPatientResponse
  | UpdatePatientInfoResponse
  | DeactivatePatientResponse
  | GrantConsentResult
  | AddEmergencyContactResult
  | { success: false; message: string }; // For unknown command types

/**
 * Patient Command Handlers
 * Handles all patient-related commands with proper validation and authorization
 */
export class PatientCommandHandlers {
  constructor(
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    private readonly updatePatientInfoUseCase: UpdatePatientInfoUseCase,
    private readonly deactivatePatientUseCase: DeactivatePatientUseCase,
    private readonly grantConsentUseCase: GrantConsentUseCase,
    private readonly addEmergencyContactUseCase: AddEmergencyContactUseCase,
    private readonly logger: ILogger
  ) {}

  /**
   * Handle RegisterPatient command
   */
  async handleRegisterPatient(command: RegisterPatientCommand): Promise<RegisterPatientResponse> {
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

    } catch (error) {
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
  async handleUpdatePatientInfo(command: UpdatePatientInfoCommand): Promise<UpdatePatientInfoResponse> {
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

    } catch (error) {
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
  async handleDeactivatePatient(command: DeactivatePatientCommand): Promise<{ success: boolean; message: string }> {
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

      // Execute use case
      const result = await this.deactivatePatientUseCase.execute({
        patientId: command.data.patientId,
        reason: command.data.reason,
        performedBy: command.data.requestedBy
      });

      this.logger.info('DeactivatePatient command processed', {
        commandId: command.commandId,
        patientId: command.data.patientId,
        success: result.success
      });

      return result;

    } catch (error) {
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
  async handleGrantPatientConsent(command: GrantPatientConsentCommand): Promise<{ success: boolean; message: string }> {
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

      // Execute use case
      const result = await this.grantConsentUseCase.execute({
        patientId: command.data.patientId,
        consentType: command.data.consentType,
        grantedBy: command.data.grantedBy,
        expiresAt: command.data.expiresAt,
        performedBy: command.requestedBy
      });

      this.logger.info('GrantPatientConsent command processed', {
        commandId: command.commandId,
        patientId: command.data.patientId,
        success: result.success,
        consentId: result.consentId
      });

      return {
        success: result.success,
        message: result.message
      };

    } catch (error) {
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
  async handleAddEmergencyContact(command: AddEmergencyContactCommand): Promise<{ success: boolean; message: string }> {
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

      // Execute use case
      const result = await this.addEmergencyContactUseCase.execute({
        patientId: command.data.patientId,
        name: command.data.contactInfo.name,
        relationship: command.data.contactInfo.relationship,
        primaryPhone: command.data.contactInfo.phoneNumber,
        secondaryPhone: command.data.contactInfo.secondaryPhone,
        email: command.data.contactInfo.email,
        address: command.data.contactInfo.address,
        isPrimary: command.data.contactInfo.isPrimary,
        performedBy: command.data.requestedBy
      });

      this.logger.info('AddEmergencyContact command processed', {
        commandId: command.commandId,
        patientId: command.data.patientId,
        success: result.success,
        contactId: result.contactId
      });

      return {
        success: result.success,
        message: result.message
      };

    } catch (error) {
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
  async handleCommand(command: PatientCommand): Promise<PatientCommandResult> {
    switch (command.commandType) {
      case 'RegisterPatient':
        return this.handleRegisterPatient(command as RegisterPatientCommand);

      case 'UpdatePatientInfo':
        return this.handleUpdatePatientInfo(command as UpdatePatientInfoCommand);

      case 'DeactivatePatient':
        return this.handleDeactivatePatient(command as DeactivatePatientCommand);

      case 'GrantPatientConsent':
        return this.handleGrantPatientConsent(command as GrantPatientConsentCommand);

      case 'AddEmergencyContact':
        return this.handleAddEmergencyContact(command as AddEmergencyContactCommand);

      default:
        this.logger.warn('Unknown command type');

        return {
          success: false,
          message: 'Loại lệnh không được hỗ trợ'
        };
    }
  }

  // Command validation methods
  private isValidRegisterPatientCommand(command: RegisterPatientCommand): boolean {
    return !!(
      command.commandId &&
      command.commandType === 'RegisterPatient' &&
      command.data &&
      command.data.userId &&
      command.data.personalInfo &&
      command.data.contactInfo &&
      command.data.requestedBy
    );
  }

  private isValidUpdatePatientInfoCommand(command: UpdatePatientInfoCommand): boolean {
    return !!(
      command.commandId &&
      command.commandType === 'UpdatePatientInfo' &&
      command.data &&
      command.data.patientId &&
      command.data.updatedBy
    );
  }

  private isValidDeactivatePatientCommand(command: DeactivatePatientCommand): boolean {
    return !!(
      command.commandId &&
      command.commandType === 'DeactivatePatient' &&
      command.data &&
      command.data.patientId &&
      command.data.reason &&
      command.data.requestedBy
    );
  }

  private isValidGrantPatientConsentCommand(command: GrantPatientConsentCommand): boolean {
    return !!(
      command.commandId &&
      command.commandType === 'GrantPatientConsent' &&
      command.data &&
      command.data.patientId &&
      command.data.consentType &&
      command.data.grantedBy
    );
  }

  private isValidAddEmergencyContactCommand(command: AddEmergencyContactCommand): boolean {
    return !!(
      command.commandId &&
      command.commandType === 'AddEmergencyContact' &&
      command.data &&
      command.data.patientId &&
      command.data.contactInfo &&
      command.data.contactInfo.name &&
      command.data.contactInfo.phoneNumber &&
      command.data.requestedBy
    );
  }

  /**
   * Get handler status for health checks
   */
  getStatus(): {
    handlerName: string;
    supportedCommands: string[];
    isHealthy: boolean;
    lastProcessedAt: string;
    } {
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
