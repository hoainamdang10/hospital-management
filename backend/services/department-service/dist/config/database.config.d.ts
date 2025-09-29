export declare const supabaseClient: import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
export declare const dbConfig: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
    retryAttempts: number;
    retryDelay: number;
};
export declare const testConnection: () => Promise<boolean>;
//# sourceMappingURL=database.config.d.ts.map