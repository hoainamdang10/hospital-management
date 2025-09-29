"use strict";
// import logger from '@hospital/shared/src/utils/logger';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
class ServiceRegistry {
    constructor() {
        this.services = new Map();
    }
    static getInstance() {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }
    async initialize() {
        // Register known services with correct ports
        this.registerService("auth-service", process.env.AUTH_SERVICE_URL || "http://auth-service:3001");
        this.registerService("doctor-service", process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3002");
        this.registerService("patient-service", process.env.PATIENT_SERVICE_URL || "http://patient-service:3003");
        this.registerService("appointment-service", process.env.APPOINTMENT_SERVICE_URL || "http://appointment-service:3004");
        this.registerService("department-service", process.env.DEPARTMENT_SERVICE_URL || "http://department-service:3005");
        this.registerService("medical-records-service", process.env.MEDICAL_RECORDS_SERVICE_URL ||
            "http://medical-records-service:3007" // Updated port to 3007 (merged with prescription service)
        );
        // REMOVED: prescription-service - merged into medical-records-service
        this.registerService("payment-service", process.env.PAYMENT_SERVICE_URL || "http://payment-service:3009");
        // Note: Room management is handled by department-service, no separate room-service
        this.registerService("notification-service", process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3011");
        // Start health checking
        this.startHealthChecking();
        console.log("Service registry initialized", {
            services: Array.from(this.services.keys()),
        });
    }
    registerService(name, url) {
        this.services.set(name, {
            name,
            url,
            status: "unknown",
            lastCheck: new Date(),
        });
        console.log("Service registered", { name, url });
    }
    getService(name) {
        return this.services.get(name);
    }
    getRegisteredServices() {
        return Array.from(this.services.values());
    }
    startHealthChecking() {
        // Check service health every 30 seconds
        setInterval(async () => {
            for (const [name, service] of this.services) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    const response = await fetch(`${service.url}/health`, {
                        method: "GET",
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);
                    if (response.ok) {
                        this.updateServiceStatus(name, "healthy");
                    }
                    else {
                        this.updateServiceStatus(name, "unhealthy");
                    }
                }
                catch (error) {
                    this.updateServiceStatus(name, "unhealthy");
                    console.warn("Service health check failed", {
                        service: name,
                        url: service.url,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }
        }, 30000);
    }
    updateServiceStatus(name, status) {
        const service = this.services.get(name);
        if (service) {
            service.status = status;
            service.lastCheck = new Date();
            this.services.set(name, service);
        }
    }
    async disconnect() {
        // Cleanup if needed
        console.log("Service registry disconnected");
    }
}
exports.ServiceRegistry = ServiceRegistry;
