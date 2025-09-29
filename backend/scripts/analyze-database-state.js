/**
 * Analyze Current Supabase Database State
 * Deep dive analysis of database schemas, tables, data volume, and usage
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Database Analysis Results
 */
const analysisResults = {
  projectInfo: {},
  schemas: {},
  tables: {},
  dataVolume: {},
  usage: {},
  recommendations: [],
  timestamp: new Date().toISOString(),
};

/**
 * Analyze database schemas using direct SQL queries
 */
async function analyzeSchemas() {
  console.log("🔍 Analyzing database schemas...");

  try {
    // Use raw SQL to query pg_namespace for schemas
    const { data: schemas, error } = await supabase.rpc("exec_sql", {
      query: `
        SELECT nspname as schema_name
        FROM pg_namespace
        WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
        AND nspname NOT LIKE 'pg_%'
        ORDER BY nspname;
      `,
    });

    if (error) {
      console.warn(
        "⚠️ Could not fetch schema info via RPC, trying alternative method:",
        error.message
      );

      // Alternative: Check for known schemas by trying to access them
      const knownSchemas = [
        "public",
        "auth_schema",
        "patient_schema",
        "doctor_schema",
        "appointment_schema",
        "medical_records_schema",
        "payment_schema",
        "file_schema",
      ];
      const existingSchemas = [];

      for (const schemaName of knownSchemas) {
        try {
          // Try to query a system table in each schema
          const testClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            db: { schema: schemaName },
          });

          const { data, error: testError } = await testClient
            .from("pg_tables")
            .select("tablename")
            .limit(1);

          if (!testError) {
            existingSchemas.push({ schema_name: schemaName });
            console.log(`  ✅ Found schema: ${schemaName}`);
          }
        } catch (e) {
          // Schema doesn't exist or no access
        }
      }

      analysisResults.schemas = existingSchemas;
    } else {
      analysisResults.schemas = schemas || [];
    }

    console.log(`✅ Found ${analysisResults.schemas.length} schemas`);
  } catch (error) {
    console.warn("⚠️ Schema analysis failed:", error.message);
  }
}

/**
 * Analyze tables in each schema
 */
async function analyzeTables() {
  console.log("🔍 Analyzing database tables...");

  const expectedSchemas = [
    "public",
    "auth_schema",
    "patient_schema",
    "doctor_schema",
    "appointment_schema",
    "medical_records_schema",
    "payment_schema",
    "file_schema",
  ];

  for (const schemaName of expectedSchemas) {
    try {
      console.log(`  📋 Checking schema: ${schemaName}`);

      // Get tables in schema
      const { data: tables, error } = await supabase
        .from("information_schema.tables")
        .select("table_name, table_type")
        .eq("table_schema", schemaName)
        .eq("table_type", "BASE TABLE");

      if (error) {
        console.warn(
          `    ⚠️ Could not fetch tables for ${schemaName}:`,
          error.message
        );
        continue;
      }

      analysisResults.tables[schemaName] = tables || [];
      console.log(
        `    ✅ Found ${tables?.length || 0} tables in ${schemaName}`
      );

      // Get row counts for each table
      for (const table of tables || []) {
        try {
          const { count, error: countError } = await supabase
            .from(`${schemaName}.${table.table_name}`)
            .select("*", { count: "exact", head: true });

          if (!countError) {
            if (!analysisResults.dataVolume[schemaName]) {
              analysisResults.dataVolume[schemaName] = {};
            }
            analysisResults.dataVolume[schemaName][table.table_name] =
              count || 0;
          }
        } catch (countError) {
          // Skip count if table doesn't exist or access denied
          console.log(
            `    📊 Could not count rows in ${schemaName}.${table.table_name}`
          );
        }
      }
    } catch (error) {
      console.warn(`  ⚠️ Error analyzing schema ${schemaName}:`, error.message);
    }
  }
}

/**
 * Analyze database usage and storage
 */
async function analyzeUsage() {
  console.log("🔍 Analyzing database usage...");

  try {
    // Get database size information
    const { data: dbSize, error: sizeError } =
      await supabase.rpc("get_database_size");

    if (!sizeError && dbSize) {
      analysisResults.usage.databaseSize = dbSize;
    }

    // Calculate total row counts
    let totalRows = 0;
    for (const schema in analysisResults.dataVolume) {
      for (const table in analysisResults.dataVolume[schema]) {
        totalRows += analysisResults.dataVolume[schema][table];
      }
    }

    analysisResults.usage.totalRows = totalRows;
    analysisResults.usage.estimatedSizeMB = Math.ceil(totalRows * 0.001); // Rough estimate

    console.log(`📊 Total rows: ${totalRows}`);
    console.log(
      `📊 Estimated size: ${analysisResults.usage.estimatedSizeMB}MB`
    );
  } catch (error) {
    console.warn("⚠️ Usage analysis failed:", error.message);
  }
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations() {
  console.log("💡 Generating recommendations...");

  const recommendations = [];

  // Check schema-per-service compliance
  const expectedSchemas = [
    "auth_schema",
    "patient_schema",
    "doctor_schema",
    "appointment_schema",
    "medical_records_schema",
    "payment_schema",
    "file_schema",
  ];
  const foundSchemas = Object.keys(analysisResults.tables);

  const missingSchemas = expectedSchemas.filter(
    (schema) => !foundSchemas.includes(schema)
  );
  if (missingSchemas.length > 0) {
    recommendations.push({
      type: "CRITICAL",
      category: "Schema Architecture",
      issue: `Missing schemas: ${missingSchemas.join(", ")}`,
      action: "Create missing schemas for proper microservices isolation",
      priority: "HIGH",
    });
  }

  // Check for public schema usage (should be minimal)
  const publicTables = analysisResults.tables.public || [];
  if (publicTables.length > 5) {
    recommendations.push({
      type: "WARNING",
      category: "Schema Architecture",
      issue: `Too many tables in public schema (${publicTables.length})`,
      action: "Migrate tables to appropriate service schemas",
      priority: "MEDIUM",
    });
  }

  // Check data volume for free tier
  const estimatedSize = analysisResults.usage.estimatedSizeMB || 0;
  if (estimatedSize > 400) {
    // 80% of 500MB limit
    recommendations.push({
      type: "WARNING",
      category: "Storage Usage",
      issue: `Database size approaching free tier limit (${estimatedSize}MB / 500MB)`,
      action: "Implement data archiving or upgrade to Pro plan",
      priority: "HIGH",
    });
  } else if (estimatedSize > 250) {
    // 50% of limit
    recommendations.push({
      type: "INFO",
      category: "Storage Usage",
      issue: `Database size at ${estimatedSize}MB (50% of free tier limit)`,
      action: "Monitor growth and plan optimization strategies",
      priority: "MEDIUM",
    });
  }

  // Check for empty schemas (V2 system readiness)
  const emptySchemas = [];
  for (const schema in analysisResults.tables) {
    if (analysisResults.tables[schema].length === 0) {
      emptySchemas.push(schema);
    }
  }

  if (emptySchemas.length > 0) {
    recommendations.push({
      type: "INFO",
      category: "V2 System Readiness",
      issue: `Empty schemas ready for V2 implementation: ${emptySchemas.join(", ")}`,
      action: "Implement V2 services for these schemas",
      priority: "LOW",
    });
  }

  // V2 system recommendations
  recommendations.push({
    type: "RECOMMENDATION",
    category: "V2 System Implementation",
    issue: "Clean Architecture V2 system is ready for implementation",
    action:
      "Start with Identity Service implementation using optimized Supabase client",
    priority: "HIGH",
  });

  recommendations.push({
    type: "RECOMMENDATION",
    category: "Free Tier Optimization",
    issue: "Implement Supabase free tier optimizations",
    action:
      "Use connection pooling, caching, and compression to maximize efficiency",
    priority: "HIGH",
  });

  analysisResults.recommendations = recommendations;
}

/**
 * Display analysis results
 */
function displayResults() {
  console.log("\n" + "=".repeat(80));
  console.log("📊 SUPABASE DATABASE ANALYSIS RESULTS");
  console.log("=".repeat(80));

  // Project Info
  console.log("\n🏥 PROJECT INFORMATION:");
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Project ID: ${supabaseUrl.split("//")[1].split(".")[0]}`);
  console.log(`   Analysis Time: ${analysisResults.timestamp}`);

  // Schemas
  console.log("\n📋 SCHEMAS FOUND:");
  for (const schema in analysisResults.tables) {
    const tableCount = analysisResults.tables[schema].length;
    const rowCount = Object.values(
      analysisResults.dataVolume[schema] || {}
    ).reduce((sum, count) => sum + count, 0);
    console.log(`   ${schema}: ${tableCount} tables, ${rowCount} rows`);
  }

  // Usage Summary
  console.log("\n📊 USAGE SUMMARY:");
  console.log(`   Total Rows: ${analysisResults.usage.totalRows || 0}`);
  console.log(
    `   Estimated Size: ${analysisResults.usage.estimatedSizeMB || 0}MB / 500MB (${Math.round(((analysisResults.usage.estimatedSizeMB || 0) / 500) * 100)}%)`
  );
  console.log(
    `   Free Tier Status: ${(analysisResults.usage.estimatedSizeMB || 0) < 400 ? "✅ SAFE" : "⚠️ APPROACHING LIMIT"}`
  );

  // Recommendations
  console.log("\n💡 RECOMMENDATIONS:");
  analysisResults.recommendations.forEach((rec, index) => {
    const icon =
      rec.type === "CRITICAL"
        ? "🚨"
        : rec.type === "WARNING"
          ? "⚠️"
          : rec.type === "INFO"
            ? "ℹ️"
            : "💡";
    console.log(`   ${index + 1}. ${icon} [${rec.priority}] ${rec.category}`);
    console.log(`      Issue: ${rec.issue}`);
    console.log(`      Action: ${rec.action}`);
    console.log("");
  });

  // Next Steps
  console.log("\n🚀 RECOMMENDED NEXT STEPS:");
  console.log("   1. ✅ Supabase Free Tier is suitable for V2 system");
  console.log(
    "   2. 🔧 Implement optimized Supabase clients for all V2 services"
  );
  console.log("   3. 📊 Start with Identity Service database integration");
  console.log(
    "   4. 🏥 Migrate legacy data to schema-per-service architecture"
  );
  console.log("   5. 📈 Monitor usage and implement caching strategies");
}

/**
 * Save results to file
 */
function saveResults() {
  const outputPath = path.join(
    __dirname,
    "../docs/database-analysis-report.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(analysisResults, null, 2));
  console.log(`\n💾 Analysis results saved to: ${outputPath}`);
}

/**
 * Main analysis function
 */
async function main() {
  console.log("🔍 Starting Supabase Database Analysis...\n");

  try {
    await analyzeSchemas();
    await analyzeTables();
    await analyzeUsage();
    generateRecommendations();
    displayResults();
    saveResults();

    console.log("\n✅ Database analysis completed successfully!");
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    process.exit(1);
  }
}

// Run analysis
if (require.main === module) {
  main();
}

module.exports = { main, analysisResults };
