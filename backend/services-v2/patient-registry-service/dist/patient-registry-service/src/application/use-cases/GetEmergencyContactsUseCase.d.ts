/**
 * GetEmergencyContactsUseCase - Application Layer
 * Get all emergency contacts for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
export interface GetEmergencyContactsCommand {
    patientId: string;
    requestedBy: string;
}
export interface EmergencyContactDTO {
    id: string;
    name: string;
    relationship: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    address?: string;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface GetEmergencyContactsResult {
    success: boolean;
    data?: {
        patientId: string;
        contacts: EmergencyContactDTO[];
        totalCount: number;
    };
    message: string;
    errors?: string[];
}
/**
 * Use Case: Get Emergency Contacts
 */
export declare class GetEmergencyContactsUseCase {
    private patientRepository;
    private logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    execute(command: GetEmergencyContactsCommand): Promise<GetEmergencyContactsResult>;
}
//# sourceMappingURL=GetEmergencyContactsUseCase.d.ts.map