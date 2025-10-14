/**
 * Configuration Module
 * Centralized configuration for the Identity Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export const config = {
  port: process.env.PORT || 3001,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'identity-service',
  version: '2.0.0',
  defaultUserRole: process.env.DEFAULT_USER_ROLE || 'patient'
};

