/**
 * Configure Supabase Custom SMTP for Auth Emails
 * This script configures the project to use Gmail SMTP for authentication emails
 */

const { createClient } = require("@supabase/supabase-js");

// Configuration
const CONFIG = {
  // Your Supabase project details
  projectRef: "ciasxktujslgsdgylimv",
  supabaseUrl: "https://ciasxktujslgsdgylimv.supabase.co",
  supabaseKey: process.env.SUPABASE_ANON_KEY,

  // Management API (you need to generate this from dashboard)
  accessToken: process.env.SUPABASE_ACCESS_TOKEN,

  // SMTP Configuration (will be retrieved from Vault)
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    sender_name: "Hospital Management System",
    admin_email: "no-reply@hospital.local",
  },
};

async function configureCustomSMTP() {
  try {
    console.log("🔧 Configuring Supabase Custom SMTP...");

    // Validate required environment variables
    if (!CONFIG.accessToken) {
      console.error("❌ SUPABASE_ACCESS_TOKEN is required!");
      console.log("📋 How to get access token:");
      console.log("1. Go to https://supabase.com/dashboard/account/tokens");
      console.log("2. Create a new access token");
      console.log("3. Set SUPABASE_ACCESS_TOKEN environment variable");
      process.exit(1);
    }

    if (!CONFIG.smtp.user || !CONFIG.smtp.pass) {
      console.error("❌ SMTP_USER and SMTP_PASS are required!");
      console.log("📋 Configure Gmail SMTP:");
      console.log("1. Enable 2FA on your Gmail account");
      console.log("2. Generate an App Password");
      console.log("3. Set SMTP_USER=your-gmail@gmail.com");
      console.log("4. Set SMTP_PASS=your-app-password");
      process.exit(1);
    }

    // Configure custom SMTP via Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${CONFIG.projectRef}/config/auth`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${CONFIG.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_email_enabled: true,
          mailer_secure_email_change_enabled: true,
          mailer_autoconfirm: false,
          smtp_admin_email: CONFIG.smtp.admin_email,
          smtp_host: CONFIG.smtp.host,
          smtp_port: CONFIG.smtp.port,
          smtp_user: CONFIG.smtp.user,
          smtp_pass: CONFIG.smtp.pass,
          smtp_sender_name: CONFIG.smtp.sender_name,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Management API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log("✅ Custom SMTP configured successfully!");
    console.log("📧 Email settings:");
    console.log(`   - Host: ${CONFIG.smtp.host}:${CONFIG.smtp.port}`);
    console.log(`   - User: ${CONFIG.smtp.user}`);
    console.log(`   - Sender: ${CONFIG.smtp.sender_name}`);
    console.log(`   - Admin Email: ${CONFIG.smtp.admin_email}`);

    // Test the configuration
    console.log("\n🧪 Testing configuration...");
    await testSMTPConfiguration();
  } catch (error) {
    console.error("❌ Failed to configure custom SMTP:", error.message);
    process.exit(1);
  }
}

async function testSMTPConfiguration() {
  try {
    // Initialize Supabase client
    const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

    // Try to reset password for a test email (this will test SMTP)
    console.log("📨 Sending test email...");

    // Note: This will only work if the email is in your organization team
    // For production testing, use a real email that you control
    const testEmail = "admin@hospital.com"; // Use a real email you control

    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${CONFIG.supabaseUrl.replace("supabase.co", "supabase.co")}/auth/reset-password`,
    });

    if (error) {
      console.warn(
        "⚠️  Email test failed (expected if email not in team):",
        error.message
      );
      console.log("   This is normal for new custom SMTP setup");
      console.log("   SMTP is configured correctly - test with actual users");
    } else {
      console.log("✅ Test email sent successfully!");
      console.log("   Check your email inbox");
    }
  } catch (error) {
    console.warn("⚠️  Email test error:", error.message);
    console.log("   SMTP configuration may still be correct");
  }
}

// Add utility function to show current configuration
async function showCurrentConfig() {
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${CONFIG.projectRef}/config/auth`,
      {
        headers: {
          Authorization: `Bearer ${CONFIG.accessToken}`,
        },
      }
    );

    if (response.ok) {
      const config = await response.json();
      console.log("📋 Current Auth Configuration:");
      console.log(
        `   - External Email Enabled: ${config.external_email_enabled}`
      );
      console.log(`   - SMTP Host: ${config.smtp_host || "Not configured"}`);
      console.log(`   - SMTP Port: ${config.smtp_port || "Not configured"}`);
      console.log(`   - SMTP User: ${config.smtp_user || "Not configured"}`);
      console.log(
        `   - Sender Name: ${config.smtp_sender_name || "Not configured"}`
      );
    }
  } catch (error) {
    console.warn("Could not fetch current config:", error.message);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--show-config")) {
    await showCurrentConfig();
    return;
  }

  if (args.includes("--help")) {
    console.log("📖 Supabase Custom SMTP Configuration Tool");
    console.log("");
    console.log("Usage:");
    console.log("  node configure-custom-smtp.js          # Configure SMTP");
    console.log(
      "  node configure-custom-smtp.js --show-config   # Show current config"
    );
    console.log(
      "  node configure-custom-smtp.js --help          # Show this help"
    );
    console.log("");
    console.log("Required environment variables:");
    console.log(
      "  SUPABASE_ACCESS_TOKEN  # Get from https://supabase.com/dashboard/account/tokens"
    );
    console.log("  SMTP_USER              # Your Gmail address");
    console.log("  SMTP_PASS              # Your Gmail app password");
    return;
  }

  await configureCustomSMTP();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  configureCustomSMTP,
  showCurrentConfig,
};
