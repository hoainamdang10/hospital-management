import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  schema: string;
}

export class SupabaseClientFactory {
  private static instance: SupabaseClient<any> | null = null;

  static create(config: SupabaseConfig): SupabaseClient<any> {
    if (!this.instance) {
      console.log('🔌 Creating Supabase client...', {
        url: config.url,
        schema: config.schema
      });

      this.instance = createClient(config.url, config.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: config.schema
        }
      }) as SupabaseClient<any>;

      console.log('✅ Supabase client created');
    }

    return this.instance;
  }

  static getInstance(): SupabaseClient<any> {
    if (!this.instance) {
      throw new Error('Supabase client not initialized. Call create() first.');
    }

    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      console.log('🛑 Closing Supabase client...');
      this.instance = null;
      console.log('✅ Supabase client closed');
    }
  }
}

