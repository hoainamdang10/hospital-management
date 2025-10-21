"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteSchedulerAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const types_1 = require("./types");
class RemoteSchedulerAdapter {
    constructor(config) {
        this.config = {
            baseURL: config.baseURL,
            apiKey: config.apiKey || '',
            timeout: config.timeout || 5000,
            retries: config.retries || 3,
            retryDelay: config.retryDelay || 1000,
            headers: config.headers || {}
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers
            }
        });
        this.setupRequestInterceptor();
        this.setupResponseInterceptor();
    }
    setupRequestInterceptor() {
        this.client.interceptors.request.use((config) => {
            if (this.config.apiKey) {
                config.headers.Authorization = `Bearer ${this.config.apiKey}`;
            }
            if (!config.headers['X-Correlation-Id']) {
                config.headers['X-Correlation-Id'] = (0, uuid_1.v4)();
            }
            if (config.headers['X-Idempotency-Key']) {
            }
            return config;
        }, (error) => Promise.reject(error));
    }
    setupResponseInterceptor() {
        this.client.interceptors.response.use((response) => response, async (error) => {
            const config = error.config;
            if (error.response?.data && (0, types_1.isErrorResponse)(error.response.data)) {
                const errorData = error.response.data;
                throw new types_1.SchedulerError(errorData.error.code, errorData.error.message, errorData.error.details, errorData.error.trace_id);
            }
            const status = error.response?.status || 0;
            const isServerError = status >= 500 && status < 600;
            const isTimeout = error.code === 'ECONNABORTED';
            const shouldRetry = isServerError || isTimeout;
            if (shouldRetry && config) {
                config._retryCount = config._retryCount || 0;
                if (config._retryCount < this.config.retries) {
                    config._retryCount += 1;
                    const delay = this.config.retryDelay * Math.pow(2, config._retryCount - 1);
                    const jitter = Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay + jitter));
                    return this.client.request(config);
                }
            }
            throw new types_1.SchedulerError('INTERNAL_ERROR', error.message || 'An unexpected error occurred', { originalError: error.message }, error.response?.headers['x-trace-id']);
        });
    }
    async createOrUpdateByDedup(request) {
        (0, types_1.validateScheduleType)(request);
        const payload = {
            ...request,
            startAtUtc: request.startAtUtc instanceof Date
                ? request.startAtUtc.toISOString()
                : request.startAtUtc,
            endAtUtc: request.endAtUtc instanceof Date
                ? request.endAtUtc.toISOString()
                : request.endAtUtc
        };
        const response = await this.client.post('/api/v1/schedules:createOrUpdateByDedup', payload, {
            headers: {
                'X-Tenant-Id': request.tenantId
            }
        });
        return response.data;
    }
    async cancelByOwner(request) {
        const response = await this.client.post('/api/v1/schedules:cancelByOwner', request, {
            headers: {
                'X-Tenant-Id': request.tenantId
            }
        });
        return response.data;
    }
    async getSchedule(scheduleId) {
        const response = await this.client.get(`/api/v1/schedules/${scheduleId}`);
        return response.data;
    }
    async runNow(scheduleId) {
        const response = await this.client.post(`/api/v1/schedules/${scheduleId}:runNow`);
        return response.data;
    }
    async getScheduleRuns(request) {
        const params = {};
        if (request.status)
            params.status = request.status;
        if (request.fromUtc) {
            params.fromUtc = request.fromUtc instanceof Date
                ? request.fromUtc.toISOString()
                : request.fromUtc;
        }
        if (request.toUtc) {
            params.toUtc = request.toUtc instanceof Date
                ? request.toUtc.toISOString()
                : request.toUtc;
        }
        if (request.limit)
            params.limit = request.limit;
        if (request.cursor)
            params.cursor = request.cursor;
        const response = await this.client.get(`/api/v1/schedules/${request.scheduleId}/runs`, { params });
        return response.data;
    }
    async health() {
        const response = await this.client.get('/health');
        return response.data;
    }
    withIdempotencyKey(key) {
        this.client.defaults.headers.common['X-Idempotency-Key'] = key;
        return this;
    }
    withCorrelationId(id) {
        this.client.defaults.headers.common['X-Correlation-Id'] = id;
        return this;
    }
}
exports.RemoteSchedulerAdapter = RemoteSchedulerAdapter;
//# sourceMappingURL=RemoteSchedulerAdapter.js.map