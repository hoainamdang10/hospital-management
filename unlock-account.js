#!/usr/bin/env node
/**
 * Unlock Account Script
 * Clears failed login attempts for a given email
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/services-v2/.env' });

const email = process.argv[2];

if (!email) {
  console.error('Usage: node unlock-account.js <email>');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function unlockAccount(email) {
  try {
    console.log(`🔓 Unlocking account for: ${email}`);

    // Delete failed login attempts
    const { error: deleteError } = await supabase
      .from('login_attempts')
      .delete()
      .eq('email', email)
      .eq('success', false);

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      process.exit(1);
    }

    console.log(`✅ Account unlocked! Failed login attempts cleared.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

unlockAccount(email);
