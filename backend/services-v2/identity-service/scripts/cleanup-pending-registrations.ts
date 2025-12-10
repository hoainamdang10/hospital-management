/**
 * Cleanup Pending Registrations Script
 * 
 * Purpose: Clean up expired, failed, and verified pending registrations
 * - Removes records with status: VERIFIED, EXPIRED, FAILED
 * - Removes EMAIL_SENT records that have expired
 * - Should be run periodically (e.g., hourly via cron job)
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(' Missing required environment variables:');
  console.error('   - SUPABASE_URL:', SUPABASE_URL ? '' : '');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '' : '');
  process.exit(1);
}

interface CleanupResult {
  deletedCount: number;
  byStatus: {
    VERIFIED: number;
    EXPIRED: number;
    FAILED: number;
    EMAIL_SENT_EXPIRED: number;
  };
}

async function cleanupPendingRegistrations(): Promise<CleanupResult> {
  console.log(' Starting cleanup of pending registrations...\n');
  console.log(` Supabase URL: ${SUPABASE_URL}`);
  console.log(` Project ID: ${SUPABASE_URL?.split('//')[1]?.split('.')[0]}\n`);

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const result: CleanupResult = {
    deletedCount: 0,
    byStatus: {
      VERIFIED: 0,
      EXPIRED: 0,
      FAILED: 0,
      EMAIL_SENT_EXPIRED: 0
    }
  };

  try {
    // 1. Delete VERIFIED records
    console.log(' Deleting VERIFIED records...');
    const { data: verifiedData, error: verifiedError } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .delete()
      .eq('status', 'VERIFIED')
      .select('id');

    if (verifiedError) {
      throw new Error(`Failed to delete VERIFIED records: ${verifiedError.message}`);
    }

    result.byStatus.VERIFIED = verifiedData?.length || 0;
    console.log(` Deleted ${result.byStatus.VERIFIED} VERIFIED records\n`);

    // 2. Delete EXPIRED records
    console.log(' Deleting EXPIRED records...');
    const { data: expiredData, error: expiredError } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .delete()
      .eq('status', 'EXPIRED')
      .select('id');

    if (expiredError) {
      throw new Error(`Failed to delete EXPIRED records: ${expiredError.message}`);
    }

    result.byStatus.EXPIRED = expiredData?.length || 0;
    console.log(` Deleted ${result.byStatus.EXPIRED} EXPIRED records\n`);

    // 3. Delete FAILED records
    console.log(' Deleting FAILED records...');
    const { data: failedData, error: failedError } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .delete()
      .eq('status', 'FAILED')
      .select('id');

    if (failedError) {
      throw new Error(`Failed to delete FAILED records: ${failedError.message}`);
    }

    result.byStatus.FAILED = failedData?.length || 0;
    console.log(` Deleted ${result.byStatus.FAILED} FAILED records\n`);

    // 4. Delete EMAIL_SENT records that have expired
    console.log(' Deleting EMAIL_SENT records that have expired...');
    const { data: emailSentExpiredData, error: emailSentExpiredError } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .delete()
      .eq('status', 'EMAIL_SENT')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (emailSentExpiredError) {
      throw new Error(`Failed to delete EMAIL_SENT expired records: ${emailSentExpiredError.message}`);
    }

    result.byStatus.EMAIL_SENT_EXPIRED = emailSentExpiredData?.length || 0;
    console.log(` Deleted ${result.byStatus.EMAIL_SENT_EXPIRED} EMAIL_SENT expired records\n`);

    // 5. Calculate total
    result.deletedCount = 
      result.byStatus.VERIFIED + 
      result.byStatus.EXPIRED + 
      result.byStatus.FAILED + 
      result.byStatus.EMAIL_SENT_EXPIRED;

    // 6. Log audit event
    console.log(' Logging audit event...');
    const { error: auditError } = await supabase
      .schema('auth_schema')
      .from('audit_logs')
      .insert({
        action: 'CLEANUP_PENDING_REGISTRATIONS',
        details: {
          deletedCount: result.deletedCount,
          byStatus: result.byStatus,
          cleanupTime: new Date().toISOString()
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });

    if (auditError) {
      console.warn('️  Failed to log audit event:', auditError.message);
    } else {
      console.log(' Audit event logged\n');
    }

    // 7. Display summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(' CLEANUP SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Deleted:           ${result.deletedCount}`);
    console.log(`  - VERIFIED:            ${result.byStatus.VERIFIED}`);
    console.log(`  - EXPIRED:             ${result.byStatus.EXPIRED}`);
    console.log(`  - FAILED:              ${result.byStatus.FAILED}`);
    console.log(`  - EMAIL_SENT (expired): ${result.byStatus.EMAIL_SENT_EXPIRED}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (result.deletedCount === 0) {
      console.log(' No records to clean up. Database is clean!\n');
    } else {
      console.log(` Successfully cleaned up ${result.deletedCount} records!\n`);
    }

    return result;

  } catch (error: any) {
    console.error(' Error during cleanup:', error.message);
    throw error;
  }
}

// Run the cleanup
cleanupPendingRegistrations()
  .then((result) => {
    console.log(' Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(' Cleanup failed:', error);
    process.exit(1);
  });
