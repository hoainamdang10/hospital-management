import { Logger } from 'winston';
export interface ServiceAdapter {
    serviceName: string;
    baseUrl: string;
    executeAction(action: string, payload: any, options?: RequestOptions): Promise<any>;
    executeCompensation(action: string, payload: any, options?: RequestOptions): Promise<any>;
    healthCheck(): Promise<boolean>;
}
export interface RequestOptions {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
}
export interface ServiceConfig {
    name: string;
    baseUrl: string;
    timeout: number;
    retries: number;
    retryDelay: number;
    healthEndpoint: string;
    authRequired: boolean;
}
export declare class ServiceAdapterFactory {
    private logger;
    private adapters;
    private serviceConfigs;
    private apiGatewayUrl;
    constructor(logger: Logger);
    private initializeServiceConfigs;
    getAdapter(serviceName: string): ServiceAdapter | null;
    getAllAdapters(): ServiceAdapter[];
    registerAdapter(serviceName: string, adapter: ServiceAdapter): void;
    healthCheckAll(): Promise<Record<string, boolean>>;
}
//# sourceMappingURL=ServiceAdapterFactory.d.ts.map