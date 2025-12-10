/**
 * UpdateCommunicationPreferencesUseCase - Application Layer
 * Updates patient communication preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (communication field)
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Language, ContactMethod } from '../../domain/value-objects/CommunicationPreference';
export interface UpdateCommunicationPreferencesCommand {
    patientId: string;
    language: Language;
    preferred: boolean;
    contactMethod: ContactMethod;
    timezone: string;
    updatedBy: string;
}
export interface UpdateCommunicationPreferencesResponse {
    success: boolean;
    message: string;
    preference: {
        language: Language;
        preferred: boolean;
        contactMethod: ContactMethod;
        timezone: string;
    };
}
export declare class UpdateCommunicationPreferencesUseCase {
    private patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(command: UpdateCommunicationPreferencesCommand): Promise<UpdateCommunicationPreferencesResponse>;
}
//# sourceMappingURL=UpdateCommunicationPreferencesUseCase.d.ts.map