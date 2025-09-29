"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.dbConfig = exports.supabaseAdmin = exports.supabaseClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase configuration. Please check your environment variables.');
}
exports.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
});
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
exports.dbConfig = {
    url: supabaseUrl,
    maxConnections: 20,
    connectionTimeout: 30000,
    queryTimeout: 60000,
    retryAttempts: 3,
    retryDelay: 1000,
};
const testConnection = async () => {
    try {
        const { data, error } = await exports.supabaseAdmin
            .from('departments')
            .select('department_id')
            .limit(1);
        if (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
        console.log('✅ Database connection successful');
        return true;
    }
    catch (error) {
        console.error('Database connection test error:', error);
        return false;
    }
};
exports.testConnection = testConnection;
//# sourceMappingURL=database.config.js.map