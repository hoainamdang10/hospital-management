"use strict";
/**
 * Use Case Circuit Breaker Wrapper
 * Wraps use cases with circuit breaker protection
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Resilience Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerValidateInsuranceUseCase = exports.CircuitBreakerSearchPatientsUseCase = exports.CircuitBreakerGetPatientProfileUseCase = exports.CircuitBreakerUpdatePatientInfoUseCase = exports.CircuitBreakerRegisterPatientUseCase = void 0;
const CircuitBreaker_1 = require("./CircuitBreaker");
/**
 * Wrapped Register Patient Use Case
 */
class CircuitBreakerRegisterPatientUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('register-patient-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerRegisterPatientUseCase = CircuitBreakerRegisterPatientUseCase;
/**
 * Wrapped Update Patient Info Use Case
 */
class CircuitBreakerUpdatePatientInfoUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('update-patient-info-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerUpdatePatientInfoUseCase = CircuitBreakerUpdatePatientInfoUseCase;
/**
 * Wrapped Get Patient Profile Use Case
 */
class CircuitBreakerGetPatientProfileUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('get-patient-profile-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerGetPatientProfileUseCase = CircuitBreakerGetPatientProfileUseCase;
/**
 * Wrapped Search Patients Use Case
 */
class CircuitBreakerSearchPatientsUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('search-patients-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            patients: [],
            total: 0,
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerSearchPatientsUseCase = CircuitBreakerSearchPatientsUseCase;
/* POST-MVP: Archived circuit breaker wrappers - Not required for graduation project
// Wrapped Match Patients Use Case
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

// Wrapped Merge Patients Use Case
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

// Wrapped Link Patients Use Case
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

// Wrapped Deactivate Patient Use Case
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
END POST-MVP: Archived circuit breaker wrappers */
/**
 * Wrapped Validate Insurance Use Case
 */
class CircuitBreakerValidateInsuranceUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('validate-insurance-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            isValid: false,
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerValidateInsuranceUseCase = CircuitBreakerValidateInsuranceUseCase;
//# sourceMappingURL=UseCaseCircuitBreakerWrapper.js.map