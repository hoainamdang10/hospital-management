/**
 * SupabaseBillingRepository - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Supabase implementation of billing repository with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Schema-per-Service, HIPAA
 */
import { OptimizedSupabaseClient } from "../../../../shared/infrastructure/database/optimized-supabase-client";
import { BillingAggregate } from "../../domain/aggregates/BillingAggregate";
import { IBillingRepository } from "../../domain/repositories/IBillingRepository";
import { ILogger } from "../../../../shared/infrastructure/logging/logger.interface";
import { IAuditService } from "../../../../shared/application/services/audit.service.interface";
export interface SupabaseBillingRepositoryConfig {
    supabase: OptimizedSupabaseClient;
    logger: ILogger;
    auditService: IAuditService;
    schema: string;
    tableName: string;
}
/**
 * Supabase Billing Repository
 * Implements billing repository with Vietnamese healthcare compliance
 */
export declare class SupabaseBillingRepository implements IBillingRepository {
    private readonly supabaseClient;
    private readonly logger;
    private readonly auditService;
    private readonly schema;
    private readonly tableName;
    constructor(config: SupabaseBillingRepositoryConfig);
    /**
     * Save billing aggregate
     */
    save(billing: BillingAggregate): Promise<void>;
    if(billing: any, payments: any, length: any): any;
}
//# sourceMappingURL=SupabaseBillingRepository.d.ts.map