"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
exports.createServerClient = createServerClient;
exports.getServerUser = getServerUser;
exports.getServerSession = getServerSession;
exports.getUserProfile = getUserProfile;
exports.checkUserRole = checkUserRole;
const supabase_js_1 = require("@supabase/supabase-js");
const headers_1 = require("next/headers");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}
if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
}
function createServerClient() {
    const cookieStore = (0, headers_1.cookies)();
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                return cookieStore.get(name)?.value;
            },
            set(name, value, options) {
                try {
                    cookieStore.set({ name, value, ...options });
                }
                catch (error) {
                }
            },
            remove(name, options) {
                try {
                    cookieStore.set({ name, value: '', ...options });
                }
                catch (error) {
                }
            },
        },
    });
}
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: 'public',
    },
    global: {
        headers: {
            'X-Client-Info': 'hospital-management-admin',
        },
    },
});
async function getServerUser() {
    const supabase = createServerClient();
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error)
            throw error;
        return user;
    }
    catch (error) {
        console.error('Error getting server user:', error);
        return null;
    }
}
async function getServerSession() {
    const supabase = createServerClient();
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error)
            throw error;
        return session;
    }
    catch (error) {
        console.error('Error getting server session:', error);
        return null;
    }
}
async function getUserProfile(userId) {
    try {
        const { data, error } = await exports.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}
async function checkUserRole(userId, allowedRoles) {
    const profile = await getUserProfile(userId);
    if (!profile)
        return false;
    return allowedRoles.includes(profile.role);
}
exports.default = exports.supabaseAdmin;
//# sourceMappingURL=server.js.map