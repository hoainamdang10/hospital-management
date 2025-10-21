"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseClientFactory = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class SupabaseClientFactory {
    static create(config) {
        if (!this.instance) {
            console.log('🔌 Creating Supabase client...', {
                url: config.url,
                schema: config.schema
            });
            this.instance = (0, supabase_js_1.createClient)(config.url, config.serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                db: {
                    schema: config.schema
                }
            });
            console.log('✅ Supabase client created');
        }
        return this.instance;
    }
    static getInstance() {
        if (!this.instance) {
            throw new Error('Supabase client not initialized. Call create() first.');
        }
        return this.instance;
    }
    static async close() {
        if (this.instance) {
            console.log('🛑 Closing Supabase client...');
            this.instance = null;
            console.log('✅ Supabase client closed');
        }
    }
}
exports.SupabaseClientFactory = SupabaseClientFactory;
SupabaseClientFactory.instance = null;
//# sourceMappingURL=SupabaseClientFactory.js.map