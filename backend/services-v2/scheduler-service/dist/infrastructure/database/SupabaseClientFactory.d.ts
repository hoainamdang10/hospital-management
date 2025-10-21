import { SupabaseClient } from '@supabase/supabase-js';
export interface SupabaseConfig {
    url: string;
    serviceRoleKey: string;
    schema: string;
}
export declare class SupabaseClientFactory {
    private static instance;
    static create(config: SupabaseConfig): SupabaseClient<any>;
    static getInstance(): SupabaseClient<any>;
    static close(): Promise<void>;
}
//# sourceMappingURL=SupabaseClientFactory.d.ts.map