/**
 * App Factory for Integration Tests
 *
 * Creates and configures Express app instance for testing
 * without starting the actual server
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Application } from "express";
import { InMemoryPatientRepository } from "./InMemoryPatientRepository";
import { IPatientRepository } from "../../src/domain/repositories/IPatientRepository";
import { RabbitMQEventPublisher } from "../../src/infrastructure/events/RabbitMQEventPublisher";
import { ILogger } from "../../../shared/application/services/logger.interface";
/**
 * App Factory Configuration
 */
export interface AppFactoryConfig {
    supabaseUrl: string;
    supabaseKey: string;
    rabbitmqUrl?: string;
    enableRabbitMQ?: boolean;
    enableAuthentication?: boolean;
    identityServiceUrl?: string;
    logger?: ILogger;
    useInMemoryRepository?: boolean;
}
/**
 * App Factory Result
 */
export interface AppFactoryResult {
    app: Application;
    cleanup: () => Promise<void>;
    eventPublisher?: RabbitMQEventPublisher;
    patientRepository: IPatientRepository;
    inMemoryRepository?: InMemoryPatientRepository;
}
/**
 * Create Express app for testing
 */
export declare function createTestApp(config: AppFactoryConfig): Promise<AppFactoryResult>;
/**
 * Create minimal test app (without RabbitMQ, without authentication)
 */
export declare function createMinimalTestApp(): Promise<AppFactoryResult>;
/**
 * Create test app with authentication
 * - If IDENTITY_USE_MOCK=true or NODE_ENV=test: Uses mock Identity Service
 * - If IDENTITY_USE_MOCK=false: Uses REAL Identity Service at IDENTITY_SERVICE_URL
 */
export declare function createAuthenticatedTestApp(): Promise<AppFactoryResult>;
/**
 * Create full test app (with RabbitMQ)
 */
export declare function createFullTestApp(): Promise<AppFactoryResult>;
//# sourceMappingURL=appFactory.d.ts.map