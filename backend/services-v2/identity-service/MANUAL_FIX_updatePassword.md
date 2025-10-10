# Manual Fix Required: SupabaseAuthService.updatePassword()

## File to Edit
`backend/services-v2/identity-service/src/infrastructure/auth/SupabaseAuthService.ts`

## Lines to Replace
Lines 341-393

## Current Code (BROKEN - has reference to undefined `currentPassword`)
```typescript
  /**
   * Update user password (requires current password)
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      this.logger.info('Updating user password', { userId });

      // Fetch user email from user_profiles table
      const { data: profile, error: profileError } = await this.supabaseClient
        .from('user_profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error(`User not found: ${getErrorMessage(profileError)}`);
      }

      // First verify current password by signing in with email
      const { data: signInData, error: signInError } = await this.supabaseClient.auth.signInWithPassword({
        email: profile.email, // Use actual email, not userId
        password: currentPassword  // ❌ ERROR: currentPassword is undefined
      });

      if (signInError || !signInData.session) {
        throw new Error('Current password is incorrect');
      }

      // Set session first
      const { error: sessionError } = await this.supabaseClient.auth.setSession({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token
      });

      if (sessionError) {
        throw new Error(`Set session failed: ${sessionError.message}`);
      }

      const { error } = await this.supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        this.logger.error('Supabase Auth updatePassword failed', { error: getErrorMessage(error) });
        throw new Error(`Cadp nhadt madt kha9u tha5t ba1i: ${getErrorMessage(error)}`);
      }

      this.logger.info('Password updated successfully');
    } catch (error) {
      this.logger.error('Update password error', { error: getErrorMessage(error) });
      throw error as any;
    }
  }
```

## New Code (FIXED - simplified, uses Admin API)
```typescript
  /**
   * Update user password (for authenticated users)
   * Note: Current password verification should be done in use case
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      this.logger.info('Updating user password', { userId });

      // Update password using Supabase Admin API
      const { error } = await this.supabaseClient.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        this.logger.error('Supabase Auth updatePassword failed', { error: getErrorMessage(error) });
        throw new Error(`Cập nhật mật khẩu thất bại: ${getErrorMessage(error)}`);
      }

      this.logger.info('Password updated successfully', { userId });
    } catch (error) {
      this.logger.error('Update password error', { error: getErrorMessage(error) });
      throw error as any;
    }
  }
```

## Steps to Fix

1. Open file: `backend/services-v2/identity-service/src/infrastructure/auth/SupabaseAuthService.ts`
2. Find the `updatePassword` method (lines 341-393)
3. Delete the entire method (lines 341-393)
4. Paste the new code (from above) at line 341
5. Save the file
6. Verify no TypeScript errors

## Why This Fix is Needed

The method signature was updated to remove `currentPassword` parameter:
- Old: `updatePassword(userId: string, currentPassword: string, newPassword: string)`
- New: `updatePassword(userId: string, newPassword: string)`

But the method body still references `currentPassword` on line 362, causing a compilation error.

The new implementation:
- Uses Supabase Admin API (`auth.admin.updateUserById`)
- Removes current password verification (done in ChangePasswordUseCase)
- Simplifies the code from 53 lines to 24 lines
- Fixes the undefined variable error

## After Fix

Run this command to verify no errors:
```bash
cd backend/services-v2/identity-service
npm run build
```

If successful, you should see no TypeScript errors related to `updatePassword`.

