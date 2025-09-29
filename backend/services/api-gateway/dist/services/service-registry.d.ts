interface ServiceInfo {
    name: string;
    url: string;
    status: "healthy" | "unhealthy" | "unknown";
    lastCheck: Date;
}
export declare class ServiceRegistry {
    private static instance;
    private services;
    private constructor();
    static getInstance(): ServiceRegistry;
    initialize(): Promise<void>;
    registerService(name: string, url: string): void;
    getService(name: string): ServiceInfo | undefined;
    getRegisteredServices(): ServiceInfo[];
    private startHealthChecking;
    private updateServiceStatus;
    disconnect(): Promise<void>;
}
export {};
