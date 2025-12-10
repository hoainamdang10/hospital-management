/**
 * Cleanup Orphaned Auth Users
 * 
 * This script removes auth.users that don't have corresponding user_profiles
 * This happens when tests fail or when trigger was removed
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(' Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'auth_schema'
  }
});

async function findOrphanedAuthUsers(): Promise<string[]> {
  console.log('\n Finding orphaned auth users...');
  
  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }
    
    if (!authUsers || authUsers.users.length === 0) {
      console.log('ℹ  No auth users found');
      return [];
    }
    
    console.log(` Found ${authUsers.users.length} auth users`);
    
    // Check which ones have user_profiles
    const orphanedIds: string[] = [];
    
    for (const authUser of authUsers.users) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      if (profileError || !profile) {
        orphanedIds.push(authUser.id);
        console.log(`   Orphaned: ${authUser.email} (${authUser.id})`);
      }
    }
    
    return orphanedIds;
  } catch (error: any) {
    console.error(' Error finding orphaned users:', error.message);
    throw error;
  }
}

async function deleteOrphanedAuthUsers(userIds: string[]): Promise<void> {
  console.log(`\n Deleting ${userIds.length} orphaned auth users...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const userId of userIds) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error(`   Failed to delete ${userId}: ${error.message}`);
        failCount++;
      } else {
        console.log(`   Deleted ${userId}`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`   Error deleting ${userId}:`, error.message);
      failCount++;
    }
  }
  
  console.log(`\n Cleanup summary:`);
  console.log(`   Deleted: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
}

async function verifyCleanup(): Promise<void> {
  console.log('\n Verifying cleanup...');
  
  const orphanedIds = await findOrphanedAuthUsers();
  
  if (orphanedIds.length === 0) {
    console.log(' No orphaned auth users found. Cleanup successful!');
  } else {
    console.warn(`  Still found ${orphanedIds.length} orphaned auth users`);
  }
}

async function main() {
  console.log(' Starting orphaned auth users cleanup...');
  console.log(` Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // Step 1: Find orphaned users
    const orphanedIds = await findOrphanedAuthUsers();
    
    if (orphanedIds.length === 0) {
      console.log('\n No orphaned auth users found. Nothing to cleanup.');
      return;
    }
    
    // Step 2: Delete orphaned users
    await deleteOrphanedAuthUsers(orphanedIds);
    
    // Step 3: Verify cleanup
    await verifyCleanup();
    
    console.log('\n Cleanup complete!');
    
  } catch (error: any) {
    console.error('\n Cleanup failed:', error.message);
    process.exit(1);
  }
}

main();
