/**
 * Use Case Circuit Breaker Wrapper
 * Wraps use cases with circuit breaker protection
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Resilience Pattern
 */
import { RegisterPatientUseCase, RegisterPatientRequest, RegisterPatientResponse } from '../../application/use-cases/RegisterPatientUseCase';
import { UpdatePatientInfoUseCase, UpdatePatientInfoRequest, UpdatePatientInfoResponse } from '../../application/use-cases/UpdatePatientInfoUseCase';
import { GetPatientProfileUseCase, GetPatientProfileRequest, GetPatientProfileResponse } from '../../application/use-cases/GetPatientProfileUseCase';
import { SearchPatientsUseCase, SearchPatientsRequest, SearchPatientsResponse } from '../../application/use-cases/SearchPatientsUseCase';
import { MatchPatientsUseCase, MatchPatientsRequest, MatchPatientsResponse } from '../../application/use-cases/MatchPatientsUseCase';
import { MergePatientsUseCase, MergePatientsRequest, MergePatientsResponse } from '../../application/use-cases/MergePatientsUseCase';
import { LinkPatientsUseCase, LinkPatientsRequest, LinkPatientsResponse } from '../../application/use-cases/LinkPatientsUseCase';
import { DeactivatePatientUseCase, DeactivatePatientRequest, DeactivatePatientResponse } from '../../application/use-cases/DeactivatePatientUseCase';
import { ValidateInsuranceUseCase, ValidateInsuranceRequest, ValidateInsuranceResponse } from '../../application/use-cases/ValidateInsuranceUseCase';
/**
 * Wrapped Register Patient Use Case
 */
export declare class CircuitBreakerRegisterPatientUseCase {
    private useCase;
    private breaker;
    constructor(useCase: RegisterPatientUseCase);
    execute(request: RegisterPatientRequest): Promise<RegisterPatientResponse>;
}
/**
 * Wrapped Update Patient Info Use Case
 */
export declare class CircuitBreakerUpdatePatientInfoUseCase {
    private useCase;
    private breaker;
    constructor(useCase: UpdatePatientInfoUseCase);
    execute(request: UpdatePatientInfoRequest): Promise<UpdatePatientInfoResponse>;
}
/**
 * Wrapped Get Patient Profile Use Case
 */
export declare class CircuitBreakerGetPatientProfileUseCase {
    private useCase;
    private breaker;
    constructor(useCase: GetPatientProfileUseCase);
    execute(request: GetPatientProfileRequest): Promise<GetPatientProfileResponse>;
}
/**
 * Wrapped Search Patients Use Case
 */
export declare class CircuitBreakerSearchPatientsUseCase {
    private useCase;
    private breaker;
    constructor(useCase: SearchPatientsUseCase);
    execute(request: SearchPatientsRequest): Promise<SearchPatientsResponse>;
}
/**
 * Wrapped Match Patients Use Case
 */
export declare class CircuitBreakerMatchPatientsUseCase {
    private useCase;
    private breaker;
    constructor(useCase: MatchPatientsUseCase);
    execute(request: MatchPatientsRequest): Promise<MatchPatientsResponse>;
}
/**
 * Wrapped Merge Patients Use Case
 */
export declare class CircuitBreakerMergePatientsUseCase {
    private useCase;
    private breaker;
    constructor(useCase: MergePatientsUseCase);
    execute(request: MergePatientsRequest): Promise<MergePatientsResponse>;
}
/**
 * Wrapped Link Patients Use Case
 */
export declare class CircuitBreakerLinkPatientsUseCase {
    private useCase;
    private breaker;
    constructor(useCase: LinkPatientsUseCase);
    execute(request: LinkPatientsRequest): Promise<LinkPatientsResponse>;
}
/**
 * Wrapped Deactivate Patient Use Case
 */
export declare class CircuitBreakerDeactivatePatientUseCase {
    private useCase;
    private breaker;
    constructor(useCase: DeactivatePatientUseCase);
    execute(request: DeactivatePatientRequest): Promise<DeactivatePatientResponse>;
}
/**
 * Wrapped Validate Insurance Use Case
 */
export declare class CircuitBreakerValidateInsuranceUseCase {
    private useCase;
    private breaker;
    constructor(useCase: ValidateInsuranceUseCase);
    execute(request: ValidateInsuranceRequest): Promise<ValidateInsuranceResponse>;
}
//# sourceMappingURL=UseCaseCircuitBreakerWrapper.d.ts.map