import { SupabaseClient } from "@supabase/supabase-js";
export declare const supabaseAdmin: SupabaseClient<any, "public", any>;
export declare const supabaseFresh: SupabaseClient<any, "public", any>;
export declare const supabaseClient: SupabaseClient<any, "public", any>;
export declare const testSupabaseConnection: () => Promise<boolean>;
export declare const initializeSupabase: () => Promise<void>;
export declare const dbPool: {
    executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
    executeFHIRValidation<T>(validationFn: (client: any) => Promise<T>): Promise<T>;
    executeDiagnosisOperation<T>(diagnosisFn: (client: any) => Promise<T>): Promise<T>;
    executeBulkOperation<T>(bulkFn: (client: any) => Promise<T>): Promise<T>;
};
declare const _default: {
    admin: SupabaseClient<any, "public", any, any, any>;
    client: SupabaseClient<any, "public", any, any, any>;
    testConnection: () => Promise<boolean>;
    dbPool: {
        executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
        executeFHIRValidation<T>(validationFn: (client: any) => Promise<T>): Promise<T>;
        executeDiagnosisOperation<T>(diagnosisFn: (client: any) => Promise<T>): Promise<T>;
        executeBulkOperation<T>(bulkFn: (client: any) => Promise<T>): Promise<T>;
    };
};
export default _default;
export declare function getSchemaAwareConnection(): Promise<any>;
export declare function executeFHIRQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
//# sourceMappingURL=supabase.d.ts.map