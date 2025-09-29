import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';
export declare function createServerClient(): SupabaseClient<Database, "public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<keyof Database, "__InternalSupabase">, SchemaNameOrClientOptions extends string & Exclude<keyof Database, "__InternalSupabase"> ? SchemaNameOrClientOptions : "public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<Exclude<keyof Database, "__InternalSupabase">, "__InternalSupabase">, Omit<Database, "__InternalSupabase">[SchemaNameOrClientOptions extends string & Exclude<keyof Database, "__InternalSupabase"> ? SchemaNameOrClientOptions : "public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<Exclude<keyof Database, "__InternalSupabase">, "__InternalSupabase">] extends import("@supabase/supabase-js/dist/module/lib/types").GenericSchema ? Omit<Database, "__InternalSupabase">[SchemaNameOrClientOptions extends string & Exclude<keyof Database, "__InternalSupabase"> ? SchemaNameOrClientOptions : "public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<Exclude<keyof Database, "__InternalSupabase">, "__InternalSupabase">] : never, ("public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<keyof Database, "__InternalSupabase">) extends infer T ? T extends ("public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<keyof Database, "__InternalSupabase">) ? T extends string ? any : T extends {
    PostgrestVersion: string;
} ? T : never : never : never>;
export declare const supabaseAdmin: SupabaseClient<Database>;
export declare function getServerUser(): Promise<import("@supabase/supabase-js").AuthUser | null>;
export declare function getServerSession(): Promise<import("@supabase/supabase-js").AuthSession | null>;
export declare function getUserProfile(userId: string): Promise<any>;
export declare function checkUserRole(userId: string, allowedRoles: string[]): Promise<boolean>;
export default supabaseAdmin;
//# sourceMappingURL=server.d.ts.map