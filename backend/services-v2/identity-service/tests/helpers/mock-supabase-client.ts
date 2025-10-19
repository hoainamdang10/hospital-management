/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Jest mock for @supabase/supabase-js used by integration tests.
 * Provides an in-memory Supabase client implementation with minimal behaviour
 * required by SupabaseAuthClient and related repositories.
 */

interface SeedUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role_type: string;
  is_verified?: boolean;
  is_active?: boolean;
}

interface Dataset {
  usersByEmail: Map<string, SeedUser>;
  usersById: Map<string, SeedUser>;
  profiles: Map<string, any>;
  tokens: Map<string, string>;
  refreshTokens: Map<string, string>;
  loginAttempts: any[];
  rpcCalls: { fn: string; payload: any }[];
  signOutCalls: number;
}

const dataset: Dataset = {
  usersByEmail: new Map(),
  usersById: new Map(),
  profiles: new Map(),
  tokens: new Map(),
  refreshTokens: new Map(),
  loginAttempts: [],
  rpcCalls: [],
  signOutCalls: 0
};

const createToken = (prefix: string, userId: string): string =>
  `${prefix}-${userId}-${Math.random().toString(36).slice(2)}`;

class MockSupabaseClient {
  private readonly config: { supabaseUrl: string; supabaseKey: string };

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.config = { supabaseUrl, supabaseKey };
  }

  auth = {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      if (!email || !password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Missing credentials' }
        };
      }

      if (this.config.supabaseUrl.includes('invalid-url')) {
        return {
          data: { user: null, session: null },
          error: { message: 'Network error' }
        };
      }

      const user = dataset.usersByEmail.get(email.toLowerCase());

      if (!user || user.password !== password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' }
        };
      }

      const accessToken = createToken('access', user.id);
      const refreshToken = createToken('refresh', user.id);
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      dataset.tokens.set(accessToken, user.id);
      dataset.refreshTokens.set(refreshToken, user.id);

      return {
        data: {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { roles: [user.role_type] }
          },
          session: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt
          }
        },
        error: null
      };
    },

    getUser: async (token: string) => {
      const userId = dataset.tokens.get(token);
      if (!userId) {
        return {
          data: { user: null },
          error: { message: 'Invalid token' }
        };
      }

      const user = dataset.usersById.get(userId);
      if (!user) {
        return {
          data: { user: null },
          error: { message: 'User not found' }
        };
      }

      return {
        data: {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { roles: [user.role_type] }
          }
        },
        error: null
      };
    },

    refreshSession: async ({ refresh_token }: { refresh_token: string }) => {
      const userId = dataset.refreshTokens.get(refresh_token);
      if (!userId) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid refresh token' }
        };
      }

      const user = dataset.usersById.get(userId);
      if (!user) {
        return {
          data: { user: null, session: null },
          error: { message: 'User not found' }
        };
      }

      const newAccessToken = createToken('access', user.id);
      const newRefreshToken = createToken('refresh', user.id);
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      dataset.tokens.set(newAccessToken, user.id);
      dataset.refreshTokens.set(newRefreshToken, user.id);

      return {
        data: {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { roles: [user.role_type] }
          },
          session: {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            expires_at: expiresAt
          }
        },
        error: null
      };
    },

    signOut: async () => {
      dataset.signOutCalls += 1;
      return {
        data: {},
        error: null
      };
    }
  };

  rpc = async (fn: string, payload: any) => {
    dataset.rpcCalls.push({ fn, payload });
    return {
      data: null,
      error: null
    };
  };

  // Add schema() method to support .schema('auth_schema').from('table')
  schema(_schemaName: string) {
    return this; // Return self to allow chaining
  }

  from(table: string) {
    if (table === 'auth_user_profiles_view') {
      const builder: any = {
        __filter: null as { column: string; value: any } | null,
        select: () => builder,
        eq: (column: string, value: any) => {
          builder.__filter = { column, value };
          return builder;
        },
        single: async () => {
          const filter = builder.__filter;
          if (!filter || filter.column !== 'id') {
            return { data: null, error: { message: 'Invalid filter' } };
          }

          const profile = dataset.profiles.get(filter.value);
          if (!profile) {
            return { data: null, error: { message: 'Record not found' } };
          }

          return { data: profile, error: null };
        }
      };
      return builder;
    }

    if (table === 'login_attempts') {
      return {
        insert: async (payload: any) => {
          dataset.loginAttempts.push(payload);
          return { data: payload, error: null };
        }
      };
    }

    // Support for healthcare_roles, user_roles, permissions, etc.
    if (table === 'healthcare_roles') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null })
          }),
          data: [],
          error: null
        }),
        insert: async (_payload: any) => ({ data: null, error: null }),
        update: async (_payload: any) => ({ data: null, error: null })
      };
    }

    if (table === 'user_roles') {
      return {
        select: () => ({
          eq: () => ({
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        insert: async (_payload: any) => ({ data: null, error: null }),
        delete: () => ({
          eq: () => ({
            data: null,
            error: null
          })
        })
      };
    }

    if (table === 'permissions' || table === 'user_permissions' || table === 'role_permissions' || table === 'audit_logs') {
      return {
        select: () => ({
          eq: () => ({
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        insert: async (_payload: any) => ({ data: null, error: null }),
        delete: () => ({
          eq: () => ({
            data: null,
            error: null
          })
        })
      };
    }

    return {
      insert: async (_payload: any) => ({ data: null, error: null }),
      update: async (_payload: any) => ({ data: null, error: null }),
      select: () => ({ data: [], error: null })
    };
  }
}

export const createClient = jest.fn(
  (supabaseUrl: string, supabaseKey: string) => new MockSupabaseClient(supabaseUrl, supabaseKey)
);

export const __resetMock = (): void => {
  dataset.usersByEmail.clear();
  dataset.usersById.clear();
  dataset.profiles.clear();
  dataset.tokens.clear();
  dataset.refreshTokens.clear();
  dataset.loginAttempts = [];
  dataset.rpcCalls = [];
  dataset.signOutCalls = 0;
};

export const __seedUsers = (users: SeedUser[]): void => {
  dataset.usersByEmail.clear();
  dataset.usersById.clear();
  dataset.profiles.clear();

  users.forEach((user) => {
    const normalizedEmail = user.email.toLowerCase();
    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role_type: user.role_type,
      is_verified: user.is_verified ?? true,
      is_active: user.is_active ?? true
    };

    dataset.usersByEmail.set(normalizedEmail, { ...user });
    dataset.usersById.set(user.id, { ...user });
    dataset.profiles.set(user.id, profile);
  });
};

export const __resetAuthState = (): void => {
  dataset.tokens.clear();
  dataset.refreshTokens.clear();
  dataset.loginAttempts = [];
  dataset.rpcCalls = [];
  dataset.signOutCalls = 0;
};

export const __getLoginAttempts = (): any[] => [...dataset.loginAttempts];

export const __getRpcCalls = (): Array<{ fn: string; payload: any }> => [...dataset.rpcCalls];

export const __getSignOutCalls = (): number => dataset.signOutCalls;

export type { SeedUser };
