/**
 * AddEmergencyContactUseCase - Application Layer
 * Add emergency contact to existing patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
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
export declare class AddEmergencyContactUseCase {
    private patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(command: AddEmergencyContactCommand): Promise<AddEmergencyContactResult>;
}
//# sourceMappingURL=AddEmergencyContactUseCase.d.ts.map