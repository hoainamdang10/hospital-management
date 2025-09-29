import { SupabaseClient } from "@supabase/supabase-js";
export declare const supabaseAdmin: SupabaseClient;
export declare function getSupabase(): SupabaseClient;
export declare const dbPool: {
    executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
    executeFHIRValidation<T>(validationFn: (client: any) => Promise<T>): Promise<T>;
    executeDiagnosisOperation<T>(diagnosisFn: (client: any) => Promise<T>): Promise<T>;
    executeBulkOperation<T>(bulkFn: (client: any) => Promise<T>): Promise<T>;
};
export default getSupabase;
export declare function getSchemaAwareConnection(): Promise<SupabaseClient>;
export declare function executeFHIRQuery<T>(queryFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
//# sourceMappingURL=database.config.d.ts.map