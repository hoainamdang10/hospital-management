import { authServiceApi } from '../api/auth';

/**
 * Debug utility to check auth state using Auth Service exclusively
 * Updated to remove Supabase dependencies
 */
export async function debugAuthState() {
  console.log('🔍 [DEBUG] Starting auth state debug...');

  try {
    // 1. Check Auth Service token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    console.log('🔍 [DEBUG] Auth Service token:', { hasToken: !!token });

    if (!token) {
      console.log('❌ [DEBUG] No auth token found');
      return;
    }

    // 2. Verify token with Auth Service
    try {
      const verifyResult = await authServiceApi.verifyToken();
      console.log('🔍 [DEBUG] Token verification:', verifyResult);

      if (!verifyResult.success) {
        console.log('❌ [DEBUG] Token verification failed');
        return;
      }

      const user = verifyResult.data?.user;
      if (!user) {
        console.log('❌ [DEBUG] No user data from token verification');
        return;
      }

      // 3. Get current user data from Auth Service (includes profile data)
      const currentUserResult = await authServiceApi.getCurrentUser();
      console.log('🔍 [DEBUG] Current user data:', currentUserResult);

      if (currentUserResult.success && currentUserResult.data?.user) {
        const fullUserData = currentUserResult.data.user;
        console.log('✅ [DEBUG] Full user profile:', {
          id: fullUserData.id,
          email: fullUserData.email,
          role: fullUserData.role,
          full_name: fullUserData.full_name,
          is_active: fullUserData.is_active,
          doctor_id: fullUserData.doctor_id,
          patient_id: fullUserData.patient_id
        });

        return { user: fullUserData };
      }

      return { user };

    } catch (verifyError) {
      console.error('❌ [DEBUG] Token verification error:', verifyError);
      return null;
    }

  } catch (error) {
    console.error('❌ [DEBUG] Error during auth debug:', error);
    return null;
  }
}

/**
 * Clear all auth cache and refresh
 */
export async function clearAuthCacheAndRefresh() {
  console.log('🔄 [DEBUG] Clearing auth cache and refreshing...');

  try {
    // Clear Auth Service tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');

    console.log('✅ [DEBUG] Auth tokens cleared');

    // Try to get fresh auth state
    const result = await debugAuthState();
    console.log('✅ [DEBUG] Cache cleared and refreshed:', result);

    return result;
  } catch (error) {
    console.error('❌ [DEBUG] Error clearing cache:', error);
    return null;
  }
}

// Make functions available globally for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAuthState = debugAuthState;
  (window as any).clearAuthCacheAndRefresh = clearAuthCacheAndRefresh;
  console.log('🔧 [DEBUG] Auth debug functions available: debugAuthState(), clearAuthCacheAndRefresh()');
}
