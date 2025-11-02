/**
 * End-to-End Flow Test
 * Tests: Identity Service → RabbitMQ → Notifications Service → SendGrid
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase configuration missing in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  END-TO-END FLOW MONITORING                             ║');
console.log('║  Identity → RabbitMQ → Notifications → SendGrid         ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Monitor notifications table for new entries
async function monitorNotifications(duration = 60000) {
  console.log('📊 Monitoring notifications_schema.notifications table...');
  console.log(`   Duration: ${duration/1000} seconds`);
  console.log('   Waiting for new notifications...\n');
  
  const startTime = Date.now();
  let lastCount = 0;
  let notificationFound = false;
  let foundNotification = null;
  
  const interval = setInterval(async () => {
    try {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // Query recent notifications (last 5 minutes)
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('notification_id, template_type, recipient_email, status, channels, created_at, sent_at')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('   ❌ Query error:', error.message);
        return;
      }
      
      const currentCount = notifications?.length || 0;
      
      if (currentCount > lastCount) {
        console.log(`\n   ✅ NEW NOTIFICATION DETECTED! [${elapsed}s]`);
        const newNotif = notifications[0];
        foundNotification = newNotif;
        notificationFound = true;
        
        console.log('\n   📋 Notification Details:');
        console.log('      ID:', newNotif.notification_id);
        console.log('      Template:', newNotif.template_type);
        console.log('      Recipient:', newNotif.recipient_email);
        console.log('      Status:', newNotif.status);
        console.log('      Channels:', newNotif.channels);
        console.log('      Created:', newNotif.created_at);
        
        if (newNotif.sent_at) {
          console.log('      Sent:', newNotif.sent_at);
        }
        
        // Check delivery results
        setTimeout(async () => {
          await checkDeliveryResults(newNotif.notification_id);
        }, 3000);
      } else if (elapsed % 10 === 0) {
        console.log(`   [${elapsed}s] Still waiting... (${currentCount} notifications in last 5 min)`);
      }
      
      lastCount = currentCount;
      
    } catch (err) {
      console.error('   ❌ Monitoring error:', err.message);
    }
  }, 2000); // Check every 2 seconds
  
  // Stop monitoring after duration
  setTimeout(() => {
    clearInterval(interval);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (notificationFound) {
      console.log('✅ E2E TEST SUCCESSFUL!');
      console.log('   Notification was created and processed.\n');
      console.log('📧 Check email inbox:', foundNotification?.recipient_email);
      console.log('   You should have received the notification email.\n');
    } else {
      console.log('⚠️  NO NEW NOTIFICATIONS DETECTED');
      console.log('   Possible reasons:');
      console.log('   1. User registration event was not triggered');
      console.log('   2. RabbitMQ consumer is not running');
      console.log('   3. Event handler failed to create notification');
      console.log('   4. Check notifications-service logs for errors\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(notificationFound ? 0 : 1);
  }, duration);
}

// Check delivery results for a notification
async function checkDeliveryResults(notificationId) {
  console.log('\n   🔍 Checking delivery results...');
  
  try {
    const { data: results, error } = await supabase
      .from('notification_delivery_results')
      .select('*')
      .eq('notification_id', notificationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('      ❌ Query error:', error.message);
      return;
    }
    
    if (!results || results.length === 0) {
      console.log('      ⚠️  No delivery results yet (processing...)');
      
      // Try again after 5 seconds
      setTimeout(async () => {
        await checkDeliveryResults(notificationId);
      }, 5000);
      return;
    }
    
    console.log(`\n      ✅ Found ${results.length} delivery result(s):\n`);
    
    results.forEach((result, idx) => {
      console.log(`      ${idx + 1}. ${result.channel.toUpperCase()}:`);
      console.log(`         Status: ${result.status}`);
      console.log(`         Success: ${result.success ? '✅' : '❌'}`);
      
      if (result.success) {
        console.log(`         Provider ID: ${result.provider_message_id || 'N/A'}`);
        if (result.delivered_at) {
          console.log(`         Delivered: ${result.delivered_at}`);
        }
        if (result.delivery_time_ms) {
          console.log(`         Delivery Time: ${result.delivery_time_ms}ms`);
        }
      } else {
        console.log(`         Error: ${result.error_message || 'Unknown'}`);
        if (result.failure_reason) {
          console.log(`         Reason: ${result.failure_reason}`);
        }
      }
      console.log('');
    });
    
  } catch (err) {
    console.error('      ❌ Error checking results:', err.message);
  }
}

// Show current notifications count
async function showInitialStats() {
  console.log('📊 Initial Database Status:\n');
  
  try {
    // Count notifications by status
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('status', { count: 'exact', head: true });
    
    if (!error) {
      console.log('   Total notifications in database:', notifications?.length || 0);
    }
    
    // Get latest notification
    const { data: latest } = await supabase
      .from('notifications')
      .select('notification_id, template_type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (latest) {
      console.log('   Latest notification:');
      console.log('      ID:', latest.notification_id);
      console.log('      Template:', latest.template_type);
      console.log('      Status:', latest.status);
      console.log('      Created:', latest.created_at);
    } else {
      console.log('   No notifications yet');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (err) {
    console.error('   ❌ Error fetching stats:', err.message);
  }
}

// Instructions
console.log('📋 TEST INSTRUCTIONS:\n');
console.log('   1. Make sure notifications-service consumer is running:');
console.log('      cd backend/services-v2/notifications-service');
console.log('      npm run consumer\n');
console.log('   2. Trigger a user registration from Identity Service:');
console.log('      POST http://localhost:3021/api/auth/register');
console.log('      Body: {');
console.log('        "email": "test@example.com",');
console.log('        "password": "Test123456!",');
console.log('        "firstName": "Test",');
console.log('        "lastName": "User"');
console.log('      }\n');
console.log('   3. This script will monitor the database for new notifications\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Wait for user to be ready
console.log('⏳ Starting monitoring in 5 seconds...');
console.log('   (Press Ctrl+C to cancel)\n');

setTimeout(async () => {
  await showInitialStats();
  await monitorNotifications(120000); // Monitor for 2 minutes
}, 5000);
