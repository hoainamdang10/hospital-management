/**
 * Use Case Circuit Breaker Wrapper
 * Wraps use cases with circuit breaker protection
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Resilience Pattern
 */

import { CircuitBreakerFactory } from './CircuitBreaker';
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
export class CircuitBreakerRegisterPatientUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('register-patient-use-case');

  constructor(private useCase: RegisterPatientUseCase) {}

  async execute(request: RegisterPatientRequest): Promise<RegisterPatientResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

/**
 * Wrapped Update Patient Info Use Case
 */
export class CircuitBreakerUpdatePatientInfoUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('update-patient-info-use-case');

  constructor(private useCase: UpdatePatientInfoUseCase) {}

  async execute(request: UpdatePatientInfoRequest): Promise<UpdatePatientInfoResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

/**
 * Wrapped Get Patient Profile Use Case
 */
export class CircuitBreakerGetPatientProfileUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('get-patient-profile-use-case');

  constructor(private useCase: GetPatientProfileUseCase) {}

  async execute(request: GetPatientProfileRequest): Promise<GetPatientProfileResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

/**
 * Wrapped Search Patients Use Case
 */
export class CircuitBreakerSearchPatientsUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('search-patients-use-case');

  constructor(private useCase: SearchPatientsUseCase) {}

  async execute(request: SearchPatientsRequest): Promise<SearchPatientsResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        patients: [],
        total: 0,
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

/**
 * Wrapped Match Patients Use Case
 */
export class CircuitBreakerMatchPatientsUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('match-patients-use-case');

  constructor(private useCase: MatchPatientsUseCase) {}

  async execute(request: MatchPatientsRequest): Promise<MatchPatientsResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        matches: [],
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

/**
 * Wrapped Merge Patients Use Case
 */
export class CircuitBreakerMergePatientsUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('merge-patients-use-case');

  constructor(private useCase: MergePatientsUseCase) {}

  async execute(request: MergePatientsRequest): Promise<MergePatientsResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

/**
 * Wrapped Link Patients Use Case
 */
export class CircuitBreakerLinkPatientsUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('link-patients-use-case');

  constructor(private useCase: LinkPatientsUseCase) {}

  async execute(request: LinkPatientsRequest): Promise<LinkPatientsResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

/**
 * Wrapped Deactivate Patient Use Case
 */
export class CircuitBreakerDeactivatePatientUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('deactivate-patient-use-case');

  constructor(private useCase: DeactivatePatientUseCase) {}

  async execute(request: DeactivatePatientRequest): Promise<DeactivatePatientResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

/**
 * Wrapped Validate Insurance Use Case
 */
export class CircuitBreakerValidateInsuranceUseCase {
  private breaker = CircuitBreakerFactory.getBreaker('validate-insurance-use-case');

  constructor(private useCase: ValidateInsuranceUseCase) {}

  async execute(request: ValidateInsuranceRequest): Promise<ValidateInsuranceResponse> {
    return this.breaker.execute(
      () => this.useCase.execute(request),
      async () => ({
        success: false,
        isValid: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errors: ['Circuit breaker is OPEN']
      })
    );
  }
}

