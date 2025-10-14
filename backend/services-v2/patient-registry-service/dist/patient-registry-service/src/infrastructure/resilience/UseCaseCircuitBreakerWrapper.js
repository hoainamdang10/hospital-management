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
exports.CircuitBreakerValidateInsuranceUseCase = exports.CircuitBreakerDeactivatePatientUseCase = exports.CircuitBreakerLinkPatientsUseCase = exports.CircuitBreakerMergePatientsUseCase = exports.CircuitBreakerMatchPatientsUseCase = exports.CircuitBreakerSearchPatientsUseCase = exports.CircuitBreakerGetPatientProfileUseCase = exports.CircuitBreakerUpdatePatientInfoUseCase = exports.CircuitBreakerRegisterPatientUseCase = void 0;
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
/**
 * Wrapped Match Patients Use Case
 */
class CircuitBreakerMatchPatientsUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('match-patients-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            matches: [],
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerMatchPatientsUseCase = CircuitBreakerMatchPatientsUseCase;
/**
 * Wrapped Merge Patients Use Case
 */
class CircuitBreakerMergePatientsUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('merge-patients-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerMergePatientsUseCase = CircuitBreakerMergePatientsUseCase;
/**
 * Wrapped Link Patients Use Case
 */
class CircuitBreakerLinkPatientsUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('link-patients-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerLinkPatientsUseCase = CircuitBreakerLinkPatientsUseCase;
/**
 * Wrapped Deactivate Patient Use Case
 */
class CircuitBreakerDeactivatePatientUseCase {
    constructor(useCase) {
        this.useCase = useCase;
        this.breaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('deactivate-patient-use-case');
    }
    async execute(request) {
        return this.breaker.execute(() => this.useCase.execute(request), async () => ({
            success: false,
            message: 'Service temporarily unavailable. Please try again later.',
            errors: ['Circuit breaker is OPEN']
        }));
    }
}
exports.CircuitBreakerDeactivatePatientUseCase = CircuitBreakerDeactivatePatientUseCase;
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