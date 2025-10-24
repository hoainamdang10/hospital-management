"use strict";
/**
 * Dependency Injection Container - Clean Architecture
 * Enhanced IoC container with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, SOLID Principles, Healthcare Compliance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceTokens = exports.DIScope = exports.DIContainer = exports.ServiceLifetime = void 0;
// Import will be added when use-case interface is created
/**
 * Service Lifetime
 */
var ServiceLifetime;
(function (ServiceLifetime) {
    ServiceLifetime["SINGLETON"] = "singleton";
    ServiceLifetime["TRANSIENT"] = "transient";
    ServiceLifetime["SCOPED"] = "scoped";
})(ServiceLifetime || (exports.ServiceLifetime = ServiceLifetime = {}));
/**
 * Dependency Injection Container
 */
class DIContainer {
    constructor(config = {}) {
        this.services = new Map();
        this.singletonInstances = new Map();
        this.scopedInstances = new Map();
        this.config = {
            enableHealthcareCompliance: true,
            enableHealthChecks: true,
            enableMetrics: false,
            defaultLifetime: ServiceLifetime.TRANSIENT,
            ...config,
        };
    }
    /**
     * Register service with implementation
     */
    register(token, implementation, lifetime = this.config.defaultLifetime, dependencies = [], metadata) {
        this.services.set(token, {
            token,
            implementation,
            lifetime,
            dependencies,
            ...(metadata && { metadata }),
        });
        return this;
    }
    /**
     * Register service with factory function
     */
    registerFactory(token, factory, lifetime = this.config.defaultLifetime, dependencies = [], metadata) {
        this.services.set(token, {
            token,
            implementation: null,
            lifetime,
            dependencies,
            factory,
            ...(metadata && { metadata }),
        });
        return this;
    }
    /**
     * Register singleton instance
     */
    registerInstance(token, instance, metadata) {
        this.services.set(token, {
            token,
            implementation: null,
            lifetime: ServiceLifetime.SINGLETON,
            instance,
            ...(metadata && { metadata }),
        });
        this.singletonInstances.set(token, instance);
        return this;
    }
    /**
     * Resolve service instance
     */
    resolve(token, scopeId) {
        const registration = this.services.get(token);
        if (!registration) {
            throw new Error(`Service not registered: ${String(token)}`);
        }
        // Validate healthcare compliance if required
        if (this.config.enableHealthcareCompliance &&
            registration.metadata?.requiresHIPAACompliance) {
            this.validateHIPAACompliance(registration);
        }
        return this.createInstance(registration, scopeId);
    }
    /**
     * Resolve all services with specific tag
     */
    resolveByTag(tag, scopeId) {
        const services = [];
        for (const [token, registration] of this.services) {
            if (registration.metadata?.tags?.includes(tag)) {
                services.push(this.resolve(token, scopeId));
            }
        }
        return services;
    }
    /**
     * Create new scope for scoped services
     */
    createScope() {
        const scopeId = `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.scopedInstances.set(scopeId, new Map());
        return new DIScope(this, scopeId);
    }
    /**
     * Dispose scope and cleanup scoped instances
     */
    disposeScope(scopeId) {
        const scopedInstances = this.scopedInstances.get(scopeId);
        if (scopedInstances) {
            // Dispose instances that implement IDisposable
            for (const instance of scopedInstances.values()) {
                if (instance && typeof instance.dispose === "function") {
                    instance.dispose();
                }
            }
            this.scopedInstances.delete(scopeId);
        }
    }
    /**
     * Get service health status
     */
    async getServiceHealth() {
        if (!this.config.enableHealthChecks) {
            return [];
        }
        const healthStatuses = [];
        for (const [token, registration] of this.services) {
            if (registration.metadata?.healthCheck) {
                try {
                    const isHealthy = await registration.metadata.healthCheck();
                    healthStatuses.push({
                        service: String(token),
                        healthy: isHealthy,
                        lastChecked: new Date(),
                    });
                }
                catch (error) {
                    healthStatuses.push({
                        service: String(token),
                        healthy: false,
                        lastChecked: new Date(),
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }
        }
        return healthStatuses;
    }
    /**
     * Get registered services info
     */
    getServicesInfo() {
        return Array.from(this.services.values()).map((registration) => ({
            token: String(registration.token),
            lifetime: registration.lifetime,
            hasFactory: !!registration.factory,
            hasInstance: !!registration.instance,
            dependencies: registration.dependencies?.map((d) => String(d)) || [],
            ...(registration.metadata && { metadata: registration.metadata }),
        }));
    }
    /**
     * Create service instance based on lifetime
     */
    createInstance(registration, scopeId) {
        switch (registration.lifetime) {
            case ServiceLifetime.SINGLETON:
                return this.createSingletonInstance(registration);
            case ServiceLifetime.SCOPED:
                if (!scopeId) {
                    throw new Error(`Scoped service ${String(registration.token)} requires scope ID`);
                }
                return this.createScopedInstance(registration, scopeId);
            case ServiceLifetime.TRANSIENT:
            default:
                return this.createTransientInstance(registration);
        }
    }
    /**
     * Create singleton instance
     */
    createSingletonInstance(registration) {
        if (registration.instance) {
            return registration.instance;
        }
        let instance = this.singletonInstances.get(registration.token);
        if (!instance) {
            instance = this.instantiateService(registration);
            this.singletonInstances.set(registration.token, instance);
        }
        return instance;
    }
    /**
     * Create scoped instance
     */
    createScopedInstance(registration, scopeId) {
        const scopedInstances = this.scopedInstances.get(scopeId);
        if (!scopedInstances) {
            throw new Error(`Scope not found: ${scopeId}`);
        }
        let instance = scopedInstances.get(registration.token);
        if (!instance) {
            instance = this.instantiateService(registration);
            scopedInstances.set(registration.token, instance);
        }
        return instance;
    }
    /**
     * Create transient instance
     */
    createTransientInstance(registration) {
        return this.instantiateService(registration);
    }
    /**
     * Instantiate service with dependency injection
     */
    instantiateService(registration) {
        if (registration.factory) {
            const dependencies = this.resolveDependencies(registration.dependencies || []);
            return registration.factory(...dependencies);
        }
        if (registration.implementation) {
            const dependencies = this.resolveDependencies(registration.dependencies || []);
            return new registration.implementation(...dependencies);
        }
        throw new Error(`Cannot instantiate service: ${String(registration.token)}`);
    }
    /**
     * Resolve service dependencies
     */
    resolveDependencies(dependencies) {
        return dependencies.map((dep) => this.resolve(dep));
    }
    /**
     * Validate HIPAA compliance for healthcare services
     */
    validateHIPAACompliance(registration) {
        if (!registration.metadata?.isHealthcareService) {
            throw new Error(`Service ${String(registration.token)} requires HIPAA compliance but is not marked as healthcare service`);
        }
        // Additional HIPAA validation logic can be added here
    }
}
exports.DIContainer = DIContainer;
/**
 * DI Scope for scoped services
 */
class DIScope {
    constructor(container, scopeId) {
        this.container = container;
        this.scopeId = scopeId;
    }
    resolve(token) {
        return this.container.resolve(token, this.scopeId);
    }
    dispose() {
        this.container.disposeScope(this.scopeId);
    }
}
exports.DIScope = DIScope;
/**
 * Service Tokens for common services
 */
exports.ServiceTokens = {
    // Repositories
    PATIENT_REPOSITORY: Symbol("PatientRepository"),
    DOCTOR_REPOSITORY: Symbol("DoctorRepository"),
    APPOINTMENT_REPOSITORY: Symbol("AppointmentRepository"),
    // Use Cases
    REGISTER_PATIENT_USE_CASE: Symbol("RegisterPatientUseCase"),
    SCHEDULE_APPOINTMENT_USE_CASE: Symbol("ScheduleAppointmentUseCase"),
    // Infrastructure
    EVENT_BUS: Symbol("EventBus"),
    EVENT_STORE: Symbol("EventStore"),
    DATABASE_CONNECTION: Symbol("DatabaseConnection"),
    // Healthcare Services
    HIPAA_AUDIT_LOGGER: Symbol("HIPAAAuditLogger"),
    FHIR_CLIENT: Symbol("FHIRClient"),
    // External Services
    NOTIFICATION_SERVICE: Symbol("NotificationService"),
    PAYMENT_SERVICE: Symbol("PaymentService"),
};
//# sourceMappingURL=container.js.map