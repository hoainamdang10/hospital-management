"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceAdapterFactory = void 0;
const axios_1 = __importDefault(require("axios"));
class ServiceAdapterFactory {
    constructor(logger) {
        this.adapters = new Map();
        this.serviceConfigs = new Map();
        this.logger = logger;
        this.apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://api-gateway:3100';
        this.initializeServiceConfigs();
    }
    initializeServiceConfigs() {
        const services = [
            {
                name: 'auth-service',
                baseUrl: `${this.apiGatewayUrl}/api/auth`,
                timeout: 15000,
                retries: 3,
                retryDelay: 1000,
                healthEndpoint: '/health',
                authRequired: true
            },
            {
                name: 'doctor-service',
                baseUrl: `${this.apiGatewayUrl}/api/doctors`,
                timeout: 15000,
                retries: 3,
                retryDelay: 1000,
                healthEndpoint: '/health',
                authRequired: true
            },
            {
                name: 'patient-service',
                baseUrl: `${this.apiGatewayUrl}/api/patients`,
                timeout: 15000,
                retries: 3,
                retryDelay: 1000,
                healthEndpoint: '/health',
                authRequired: true
            },
            {
                name: 'appointment-service',
                baseUrl: `${this.apiGatewayUrl}/api/appointments`,
                timeout: 15000,
                retries: 3,
                retryDelay: 1000,
                healthEndpoint: '/health',
                authRequired: true
            },
            {
                name: 'medical-records-service',
                baseUrl: `${this.apiGatewayUrl}/api/medical-records`,
                timeout: 20000,
                retries: 3,
                retryDelay: 1000,
                healthEndpoint: '/health',
                authRequired: true
            },
            {
                name: 'payment-service',
                baseUrl: `${this.apiGatewayUrl}/api/payments`,
                timeout: 30000,
                retries: 3,
                retryDelay: 1000,
                healthEndpoint: '/health',
                authRequired: true
            },
            {
                name: 'file-service',
                baseUrl: `${this.apiGatewayUrl}/api/files`,
                timeout: 60000,
                retries: 2,
                retryDelay: 2000,
                healthEndpoint: '/health',
                authRequired: true
            }
        ];
        services.forEach(config => {
            this.serviceConfigs.set(config.name, config);
            this.adapters.set(config.name, new HttpServiceAdapter(config, this.logger));
        });
        this.logger.info('Service adapters initialized', {
            services: services.map(s => s.name)
        });
    }
    getAdapter(serviceName) {
        return this.adapters.get(serviceName) || null;
    }
    getAllAdapters() {
        return Array.from(this.adapters.values());
    }
    registerAdapter(serviceName, adapter) {
        this.adapters.set(serviceName, adapter);
        this.logger.info('Custom service adapter registered', { serviceName });
    }
    async healthCheckAll() {
        const results = {};
        const adapters = Array.from(this.adapters.entries());
        await Promise.allSettled(adapters.map(async ([serviceName, adapter]) => {
            try {
                results[serviceName] = await adapter.healthCheck();
            }
            catch (error) {
                results[serviceName] = false;
            }
        }));
        return results;
    }
}
exports.ServiceAdapterFactory = ServiceAdapterFactory;
class HttpServiceAdapter {
    constructor(config, logger) {
        this.serviceName = config.name;
        this.baseUrl = config.baseUrl;
        this.config = config;
        this.logger = logger;
        this.httpClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Admin-Orchestrator/1.0'
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.httpClient.interceptors.request.use((config) => {
            if (this.config.authRequired) {
                const token = process.env.SERVICE_AUTH_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            this.logger.debug('HTTP request', {
                service: this.serviceName,
                method: config.method,
                url: config.url
            });
            return config;
        }, (error) => {
            this.logger.error('HTTP request error', {
                service: this.serviceName,
                error: error.message
            });
            return Promise.reject(error);
        });
        this.httpClient.interceptors.response.use((response) => {
            this.logger.debug('HTTP response', {
                service: this.serviceName,
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            this.logger.error('HTTP response error', {
                service: this.serviceName,
                status: error.response?.status,
                message: error.message,
                url: error.config?.url
            });
            return Promise.reject(error);
        });
    }
    async executeAction(action, payload, options = {}) {
        const requestOptions = {
            timeout: this.config.timeout,
            retries: this.config.retries,
            retryDelay: this.config.retryDelay,
            ...options
        };
        return this.executeWithRetry(action, payload, requestOptions, 'action');
    }
    async executeCompensation(action, payload, options = {}) {
        const requestOptions = {
            timeout: this.config.timeout,
            retries: this.config.retries,
            retryDelay: this.config.retryDelay,
            ...options
        };
        return this.executeWithRetry(action, payload, requestOptions, 'compensation');
    }
    async executeWithRetry(action, payload, options, type) {
        const maxRetries = options.retries || 0;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.makeHttpRequest(action, payload, options, type);
                if (attempt > 0) {
                    this.logger.info('Request succeeded after retry', {
                        service: this.serviceName,
                        action,
                        attempt,
                        type
                    });
                }
                return response.data;
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    const delay = (options.retryDelay || 1000) * Math.pow(2, attempt);
                    this.logger.warn('Request failed, retrying', {
                        service: this.serviceName,
                        action,
                        attempt: attempt + 1,
                        maxRetries,
                        delay,
                        error: error.message,
                        type
                    });
                    await this.sleep(delay);
                }
            }
        }
        this.logger.error('Request failed after all retries', {
            service: this.serviceName,
            action,
            maxRetries,
            error: lastError.message,
            type
        });
        throw lastError;
    }
    async makeHttpRequest(action, payload, options, type) {
        const endpoint = this.getActionEndpoint(action, type);
        const method = this.getHttpMethod(action, type);
        const requestConfig = {
            method,
            url: endpoint,
            timeout: options.timeout,
            headers: options.headers
        };
        if (method === 'GET' || method === 'DELETE') {
            requestConfig.params = payload;
        }
        else {
            requestConfig.data = payload;
        }
        return this.httpClient.request(requestConfig);
    }
    getActionEndpoint(action, type) {
        const actionMappings = {
            'auth-service': {
                'createUser': '/users',
                'deleteUser': '/users',
                'createUsersBatch': '/users/batch',
                'deleteUsersBatch': '/users/batch',
                'checkDepartmentCapacity': '/admin/departments/capacity',
                'updateDepartmentCapacity': '/admin/departments/capacity'
            },
            'doctor-service': {
                'createDoctor': '/doctors',
                'deleteDoctor': '/doctors',
                'updateDoctor': '/doctors'
            },
            'patient-service': {
                'createPatient': '/patients',
                'deletePatient': '/patients'
            },
            'appointment-service': {
                'createAppointment': '/appointments',
                'deleteAppointment': '/appointments'
            },
            'medical-records-service': {
                'createRecord': '/records',
                'deleteRecord': '/records'
            },
            'payment-service': {
                'processPayment': '/payments',
                'refundPayment': '/payments/refund'
            },
            'file-service': {
                'uploadFile': '/upload',
                'deleteFile': '/files'
            }
        };
        const serviceActions = actionMappings[this.serviceName] || {};
        return serviceActions[action] || `/${action}`;
    }
    getHttpMethod(action, type) {
        if (type === 'compensation' || action.startsWith('delete')) {
            return 'DELETE';
        }
        if (action.startsWith('create') || action.startsWith('process')) {
            return 'POST';
        }
        if (action.startsWith('update')) {
            return 'PUT';
        }
        if (action.startsWith('get') || action.startsWith('check')) {
            return 'GET';
        }
        return 'POST';
    }
    async healthCheck() {
        try {
            const response = await this.httpClient.get(this.config.healthEndpoint, {
                timeout: 5000
            });
            return response.status === 200;
        }
        catch (error) {
            this.logger.warn('Health check failed', {
                service: this.serviceName,
                error: error.message
            });
            return false;
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=ServiceAdapterFactory.js.map