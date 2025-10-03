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
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
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
            email?: string;
            address?: string;
        };
        requestedBy: string;
        requestedByRole: string;
    };
}
export type PatientCommand = RegisterPatientCommand | UpdatePatientInfoCommand | DeactivatePatientCommand | GrantPatientConsentCommand | AddEmergencyContactCommand;
/**
 * Patient Command Handlers
 * Handles all patient-related commands with proper validation and authorization
 */
export declare class PatientCommandHandlers {
    private readonly registerPatientUseCase;
    private readonly updatePatientInfoUseCase;
    private readonly logger;
    constructor(registerPatientUseCase: RegisterPatientUseCase, updatePatientInfoUseCase: UpdatePatientInfoUseCase, logger: ILogger);
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
    handleCommand(command: PatientCommand): Promise<any>;
    private isValidRegisterPatientCommand;
    private isValidUpdatePatientInfoCommand;
    private isValidDeactivatePatientCommand;
    private isValidGrantPatientConsentCommand;
    private isValidAddEmergencyContactCommand;
    /**
     * Get handler status for health checks
     */
    getStatus(): any;
}
//# sourceMappingURL=PatientCommandHandlers.d.ts.map