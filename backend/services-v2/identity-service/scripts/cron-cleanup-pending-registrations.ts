/**
 * Cron Job: Cleanup Pending Registrations
 * 
 * Purpose: Periodically clean up expired, failed, and verified pending registrations
 * - Runs every hour
 * - Removes records with status: VERIFIED, EXPIRED, FAILED
 * - Removes EMAIL_SENT records that have expired
 * 
 * Usage:
 * - Development: npm run cron:cleanup
 * - Production: Add to crontab or use PM2 cron
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
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(' Missing required environment variables');
  process.exit(1);
}

interface CleanupStats {
  totalRuns: number;
  totalDeleted: number;
  lastRun: Date | null;
  lastDeletedCount: number;
}

const stats: CleanupStats = {
  totalRuns: 0,
  totalDeleted: 0,
  lastRun: null,
  lastDeletedCount: 0
};

async function runCleanup(): Promise<number> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  let deletedCount = 0;

  try {
    console.log(`\n[${ new Date().toISOString()}]  Running cleanup...`);

    // Delete VERIFIED records
    const { data: verified } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .delete()
      .eq('status', 'VERIFIED')
      .select('id');
    
    const verifiedCount = verified?.length || 0;
    deletedCount += verifiedCount;

    // Delete EXPIRED records
    const { data: expired } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .delete()
      .eq('status', 'EXPIRED')
      .select('id');
    
    const expiredCount = expired?.length || 0;
    deletedCount += expiredCount;

    // Delete FAILED records
    const { data: failed } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .delete()
      .eq('status', 'FAILED')
      .select('id');
    
    const failedCount = failed?.length || 0;
    deletedCount += failedCount;

    // Delete EMAIL_SENT records that have expired
    const { data: emailSentExpired } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .delete()
      .eq('status', 'EMAIL_SENT')
      .lt('expires_at', new Date().toISOString())
      .select('id');
    
    const emailSentExpiredCount = emailSentExpired?.length || 0;
    deletedCount += emailSentExpiredCount;

    // Log audit event
    if (deletedCount > 0) {
      await supabase
        .schema('auth_schema')
        .from('audit_logs')
        .insert({
          action: 'CRON_CLEANUP_PENDING_REGISTRATIONS',
          details: {
            deletedCount,
            byStatus: {
              VERIFIED: verifiedCount,
              EXPIRED: expiredCount,
              FAILED: failedCount,
              EMAIL_SENT_EXPIRED: emailSentExpiredCount
            },
            cleanupTime: new Date().toISOString()
          },
          severity: 'info',
          created_at: new Date().toISOString()
        });
    }

    // Update stats
    stats.totalRuns++;
    stats.totalDeleted += deletedCount;
    stats.lastRun = new Date();
    stats.lastDeletedCount = deletedCount;

    if (deletedCount > 0) {
      console.log(` Deleted ${deletedCount} records (V:${verifiedCount}, E:${expiredCount}, F:${failedCount}, ES:${emailSentExpiredCount})`);
    } else {
      console.log(' No records to clean up');
    }

    console.log(` Stats: Total runs: ${stats.totalRuns}, Total deleted: ${stats.totalDeleted}`);

    return deletedCount;

  } catch (error: any) {
    console.error(' Cleanup error:', error.message);
    return 0;
  }
}

// Run cleanup immediately on start
console.log(' Starting cleanup cron job...');
console.log(` Interval: Every ${CLEANUP_INTERVAL_MS / 1000 / 60} minutes`);
console.log(` Supabase URL: ${SUPABASE_URL}`);

runCleanup().then(() => {
  console.log(' Initial cleanup completed');
});

// Schedule periodic cleanup
setInterval(async () => {
  await runCleanup();
}, CLEANUP_INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n Shutting down cleanup cron job...');
  console.log(' Final Stats:');
  console.log(`   - Total runs: ${stats.totalRuns}`);
  console.log(`   - Total deleted: ${stats.totalDeleted}`);
  console.log(`   - Last run: ${stats.lastRun?.toISOString() || 'N/A'}`);
  console.log(' Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n Received SIGTERM, shutting down...');
  process.exit(0);
});
