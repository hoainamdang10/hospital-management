/**
 * GetCommunicationPreferencesUseCase - Application Layer
 * Retrieves patient communication preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (communication field)
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Language, ContactMethod } from '../../domain/value-objects/CommunicationPreference';
export interface GetCommunicationPreferencesQuery {
    patientId: string;
}
export interface GetCommunicationPreferencesResponse {
    hasPreference: boolean;
    preference: {
        language: Language;
        preferred: boolean;
        contactMethod: ContactMethod;
        timezone: string;
    } | null;
}
export declare class GetCommunicationPreferencesUseCase {
    private patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(query: GetCommunicationPreferencesQuery): Promise<GetCommunicationPreferencesResponse>;
}
//# sourceMappingURL=GetCommunicationPreferencesUseCase.d.ts.map