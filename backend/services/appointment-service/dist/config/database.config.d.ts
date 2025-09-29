export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any, "public", string, any, any>;
export declare function getSupabase(): import("@supabase/supabase-js").SupabaseClient<any, "public", string, any, any>;
export declare const dbPool: {
    executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
    executeFHIRValidation<T>(validationFn: (client: any) => Promise<T>): Promise<T>;
    executeDiagnosisOperation<T>(diagnosisFn: (client: any) => Promise<T>): Promise<T>;
    executeBulkOperation<T>(bulkFn: (client: any) => Promise<T>): Promise<T>;
};
export default getSupabase;
export declare function getSchemaAwareConnection(): Promise<import("@supabase/supabase-js").SupabaseClient<any, string, any, any, any>>;
export declare function executeFHIRQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
//# sourceMappingURL=database.config.d.ts.map