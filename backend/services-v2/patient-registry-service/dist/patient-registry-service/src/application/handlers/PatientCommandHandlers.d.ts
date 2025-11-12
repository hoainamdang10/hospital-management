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
import { ILogger } from '../../../../shared/application/services/logger.interface';
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
export type PatientCommand = RegisterPatientCommand | UpdatePatientInfoCommand | DeactivatePatientCommand | GrantPatientConsentCommand | AddEmergencyContactCommand;
/**
 * Union type for all command results
 */
export type PatientCommandResult = RegisterPatientResponse | UpdatePatientInfoResponse | DeactivatePatientResponse | GrantConsentResult | AddEmergencyContactResult | {
    success: false;
    message: string;
};
/**
 * Patient Command Handlers
 * Handles all patient-related commands with proper validation and authorization
 */
export declare class PatientCommandHandlers {
    private readonly registerPatientUseCase;
    private readonly updatePatientInfoUseCase;
    private readonly deactivatePatientUseCase;
    private readonly grantConsentUseCase;
    private readonly addEmergencyContactUseCase;
    private readonly logger;
    constructor(registerPatientUseCase: RegisterPatientUseCase, updatePatientInfoUseCase: UpdatePatientInfoUseCase, deactivatePatientUseCase: DeactivatePatientUseCase, grantConsentUseCase: GrantConsentUseCase, addEmergencyContactUseCase: AddEmergencyContactUseCase, logger: ILogger);
    /**
     * Handle RegisterPatient command
     */
    handleRegisterPatient(command: RegisterPatientCommand): Promise<RegisterPatientResponse>;
    /**
     * Handle UpdatePatientInfo command
     */
    handleUpdatePatientInfo(command: UpdatePatientInfoCommand): Promise<UpdatePatientInfoResponse>;
    /**
     * Handle DeactivatePatient command
     */
    handleDeactivatePatient(command: DeactivatePatientCommand): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Handle GrantPatientConsent command
     */
    handleGrantPatientConsent(command: GrantPatientConsentCommand): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Handle AddEmergencyContact command
     */
    handleAddEmergencyContact(command: AddEmergencyContactCommand): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Generic command handler dispatcher
     */
    handleCommand(command: PatientCommand): Promise<PatientCommandResult>;
    private isValidRegisterPatientCommand;
    private isValidUpdatePatientInfoCommand;
    private isValidDeactivatePatientCommand;
    private isValidGrantPatientConsentCommand;
    private isValidAddEmergencyContactCommand;
    /**
     * Get handler status for health checks
     */
    getStatus(): {
        handlerName: string;
        supportedCommands: string[];
        isHealthy: boolean;
        lastProcessedAt: string;
    };
}
//# sourceMappingURL=PatientCommandHandlers.d.ts.map