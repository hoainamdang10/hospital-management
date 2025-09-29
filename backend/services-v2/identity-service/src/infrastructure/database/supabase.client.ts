/**
 * Supabase Database Client - Infrastructure Layer
 * Optimized for free tier usage and healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createIdentityServiceClient } from '../../../shared/infrastructure/database/optimized-supabase-client';
import { OptimizedSupabaseClient } from '../../../shared/infrastructure/database/optimized-supabase-client';

// Create optimized client instance
export const optimizedSupabaseClient: OptimizedSupabaseClient = createIdentityServiceClient();

// Legacy client for backward compatibility (deprecated)
export const supabaseClient = optimizedSupabaseClient.getRawClient();

// Export optimized client as default
export default optimizedSupabaseClient;
