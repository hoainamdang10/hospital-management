"use strict";
/**
 * Simple DI Container for Notification Service
 * Simplified version for demo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIContainer = exports.ServiceLifetime = void 0;
var ServiceLifetime;
(function (ServiceLifetime) {
    ServiceLifetime[ServiceLifetime["SINGLETON"] = 0] = "SINGLETON";
    ServiceLifetime[ServiceLifetime["SCOPED"] = 1] = "SCOPED";
    ServiceLifetime[ServiceLifetime["TRANSIENT"] = 2] = "TRANSIENT";
})(ServiceLifetime || (exports.ServiceLifetime = ServiceLifetime = {}));
class DIContainer {
    constructor() {
        this.services = new Map();
    }
    registerFactory(token, factory, lifetime = ServiceLifetime.TRANSIENT) {
        this.services.set(token, { factory, lifetime });
    }
    registerSingleton(token, factory) {
        this.registerFactory(token, factory, ServiceLifetime.SINGLETON);
    }
    resolve(token) {
        const service = this.services.get(token);
        if (!service) {
            throw new Error(`Service not registered: ${token}`);
        }
        if (service.lifetime === ServiceLifetime.SINGLETON) {
            if (!service.instance) {
                service.instance = service.factory(this);
            }
            return service.instance;
        }
        return service.factory(this);
    }
    clear() {
        this.services.clear();
    }
}
exports.DIContainer = DIContainer;
//# sourceMappingURL=container.js.map