/**
 * Check Orphaned Pending Registrations Script
 * 
 * Purpose: Identify orphaned records in pending_registrations table
 * - Records that are not expired but never verified
 * - Records that might be blocking re-registration
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
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

interface PendingRegistration {
  id: string;
  email: string;
  user_data: {
    fullName: string;
    roleType: string;
  };
  verification_token: string;
  expires_at: string;
  created_at: string;
  is_used: boolean;
}

interface OrphanedRecord {
  id: string;
  email: string;
  fullName: string;
  roleType: string;
  createdAt: Date;
  expiresAt: Date;
  ageInHours: number;
  status: 'ACTIVE' | 'EXPIRED' | 'USED';
  isOrphaned: boolean;
  reason: string;
}

async function checkOrphanedRecords(): Promise<void> {
  console.log('🔍 Checking for orphaned pending registrations...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📍 Project ID: ${SUPABASE_URL?.split('//')[1]?.split('.')[0]}\n`);

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Get all pending registrations
    console.log('📊 Fetching all pending registrations...');
    const { data: allRecords, error: fetchError } = await supabase
      .schema('auth_schema')
      .from('pending_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch pending registrations: ${fetchError.message}`);
    }

    if (!allRecords || allRecords.length === 0) {
      console.log('✅ No pending registrations found in database.');
      return;
    }

    console.log(`📦 Total records found: ${allRecords.length}\n`);

    // 2. Analyze each record
    const now = new Date();
    const orphanedRecords: OrphanedRecord[] = [];
    const activeRecords: OrphanedRecord[] = [];
    const expiredRecords: OrphanedRecord[] = [];
    const usedRecords: OrphanedRecord[] = [];

    for (const record of allRecords as PendingRegistration[]) {
      const createdAt = new Date(record.created_at);
      const expiresAt = new Date(record.expires_at);
      const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      let status: 'ACTIVE' | 'EXPIRED' | 'USED' = 'ACTIVE';
      let isOrphaned = false;
      let reason = '';

      if (record.is_used) {
        status = 'USED';
        reason = 'Record marked as used but not deleted';
        isOrphaned = true;
      } else if (expiresAt < now) {
        status = 'EXPIRED';
        reason = 'Record expired but not cleaned up';
        isOrphaned = true;
      } else {
        status = 'ACTIVE';
        // Check if it's been active for too long (> 1 hour without verification)
        if (ageInHours > 1) {
          isOrphaned = true;
          reason = `Active for ${ageInHours.toFixed(1)} hours without verification`;
        }
      }

      const orphanedRecord: OrphanedRecord = {
        id: record.id,
        email: record.email,
        fullName: record.user_data.fullName,
        roleType: record.user_data.roleType,
        createdAt,
        expiresAt,
        ageInHours,
        status,
        isOrphaned,
        reason
      };

      if (status === 'USED') {
        usedRecords.push(orphanedRecord);
      } else if (status === 'EXPIRED') {
        expiredRecords.push(orphanedRecord);
      } else if (isOrphaned) {
        orphanedRecords.push(orphanedRecord);
      } else {
        activeRecords.push(orphanedRecord);
      }
    }

    // 3. Display results
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Records:        ${allRecords.length}`);
    console.log(`✅ Active (Valid):    ${activeRecords.length}`);
    console.log(`⚠️  Orphaned (Stuck): ${orphanedRecords.length}`);
    console.log(`⏰ Expired:           ${expiredRecords.length}`);
    console.log(`✔️  Used (Not Deleted): ${usedRecords.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 4. Display active records
    if (activeRecords.length > 0) {
      console.log('✅ ACTIVE PENDING REGISTRATIONS (Valid)');
      console.log('───────────────────────────────────────────────────────────────');
      activeRecords.forEach((record, index) => {
        console.log(`${index + 1}. Email: ${record.email}`);
        console.log(`   Name: ${record.fullName}`);
        console.log(`   Created: ${record.createdAt.toLocaleString()}`);
        console.log(`   Expires: ${record.expiresAt.toLocaleString()}`);
        console.log(`   Age: ${record.ageInHours.toFixed(1)} hours`);
        console.log('');
      });
    }

    // 5. Display orphaned records (CRITICAL)
    if (orphanedRecords.length > 0) {
      console.log('⚠️  ORPHANED PENDING REGISTRATIONS (Blocking Re-registration)');
      console.log('───────────────────────────────────────────────────────────────');
      orphanedRecords.forEach((record, index) => {
        console.log(`${index + 1}. Email: ${record.email}`);
        console.log(`   Name: ${record.fullName}`);
        console.log(`   Created: ${record.createdAt.toLocaleString()}`);
        console.log(`   Expires: ${record.expiresAt.toLocaleString()}`);
        console.log(`   Age: ${record.ageInHours.toFixed(1)} hours`);
        console.log(`   ⚠️  Reason: ${record.reason}`);
        console.log(`   ID: ${record.id}`);
        console.log('');
      });
    }

    // 6. Display expired records
    if (expiredRecords.length > 0) {
      console.log('⏰ EXPIRED PENDING REGISTRATIONS (Should be cleaned up)');
      console.log('───────────────────────────────────────────────────────────────');
      expiredRecords.forEach((record, index) => {
        console.log(`${index + 1}. Email: ${record.email}`);
        console.log(`   Name: ${record.fullName}`);
        console.log(`   Created: ${record.createdAt.toLocaleString()}`);
        console.log(`   Expired: ${record.expiresAt.toLocaleString()}`);
        console.log(`   Age: ${record.ageInHours.toFixed(1)} hours`);
        console.log(`   ID: ${record.id}`);
        console.log('');
      });
    }

    // 7. Display used records
    if (usedRecords.length > 0) {
      console.log('✔️  USED PENDING REGISTRATIONS (Should be deleted)');
      console.log('───────────────────────────────────────────────────────────────');
      usedRecords.forEach((record, index) => {
        console.log(`${index + 1}. Email: ${record.email}`);
        console.log(`   Name: ${record.fullName}`);
        console.log(`   Created: ${record.createdAt.toLocaleString()}`);
        console.log(`   ID: ${record.id}`);
        console.log('');
      });
    }

    // 8. Recommendations
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════');

    if (orphanedRecords.length > 0) {
      console.log('⚠️  CRITICAL: Found orphaned records blocking re-registration!');
      console.log('   These records are preventing users from registering again.');
      console.log('   Recommended actions:');
      console.log('   1. Run cleanup script to delete orphaned records');
      console.log('   2. Implement better error handling in rollback logic');
      console.log('   3. Add status column to track registration state');
      console.log('');
    }

    if (expiredRecords.length > 0) {
      console.log('⏰ Found expired records that should be cleaned up.');
      console.log('   Run: npm run cleanup:pending-registrations');
      console.log('');
    }

    if (usedRecords.length > 0) {
      console.log('✔️  Found used records that should be deleted.');
      console.log('   These records were verified but not cleaned up.');
      console.log('   Run: npm run cleanup:pending-registrations');
      console.log('');
    }

    if (orphanedRecords.length === 0 && expiredRecords.length === 0 && usedRecords.length === 0) {
      console.log('✅ No issues found! All pending registrations are valid.');
      console.log('');
    }

    // 9. Export to JSON for further analysis
    const report = {
      timestamp: now.toISOString(),
      summary: {
        total: allRecords.length,
        active: activeRecords.length,
        orphaned: orphanedRecords.length,
        expired: expiredRecords.length,
        used: usedRecords.length
      },
      activeRecords,
      orphanedRecords,
      expiredRecords,
      usedRecords
    };

    const reportPath = path.join(__dirname, `orphaned-report-${Date.now()}.json`);
    const fs = require('fs');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}\n`);

  } catch (error: any) {
    console.error('❌ Error checking orphaned records:', error.message);
    process.exit(1);
  }
}

// Run the check
checkOrphanedRecords()
  .then(() => {
    console.log('✅ Check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
