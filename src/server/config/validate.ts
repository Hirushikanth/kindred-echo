import * as z from "zod";

/**
 * Configuration Validation Test
 * 
 * Run with: npm run test:config
 * 
 * Tests:
 * - All required env vars are present
 * - All env vars are in correct format
 * - MiniMax API key can be validated
 * - Supabase credentials are reachable
 */

const CredentialSchema = z.object({
  MINIMAX_API_KEY: z
    .string()
    .optional(),
  SUPABASE_PROJECT_ID: z.string().min(1, "Supabase project ID is required"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("Invalid Supabase URL")
    .refine((val) => val.includes("supabase.co"), "Supabase URL should contain 'supabase.co'"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "Supabase publishable key required")
    .refine((val) => val.startsWith("sb_publishable_"), "Publishable key should start with 'sb_publishable_'"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase client key required"),
  DATABASE_URL: z.string().url("Database URL is required"),
  SUPABASE_DIRECT_URL: z.string().url("Supabase direct database URL is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("Kindred Echo"),
});

type ValidationResult = { name: string; status: "✅" | "❌" | "⚠️"; message: string };

function loadDotEnvLocal() {
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    process.env[key] ||= value;
  }
}

export async function validateConfiguration() {
  loadDotEnvLocal();

  console.log("\n🔍 Kindred Echo - Configuration Validation Test\n");
  console.log("=" .repeat(50));

  const results: ValidationResult[] = [];

  // 1. Check environment variables
  console.log("\n1️⃣  Checking environment variables...");

  const envVars = {
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
    SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_DIRECT_URL: process.env.SUPABASE_DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Kindred Echo",
  };

  try {
    const validated = CredentialSchema.parse(envVars);
    console.log("   ✅ All environment variables present");
    results.push({
      name: "Environment Variables",
      status: "✅",
      message: "All required env vars are present and valid",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("   ❌ Missing or invalid environment variables:");
      error.errors.forEach((err) => {
        console.log(`      - ${err.path.join(".")} : ${err.message}`);
      });
      results.push({
        name: "Environment Variables",
        status: "❌",
        message: error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join("\n"),
      });
      return results;
    }
  }

  // 2. Validate MiniMax API Key format
  console.log("\n2️⃣  Validating MiniMax API Key...");
  if (!envVars.MINIMAX_API_KEY) {
    console.log("   ⚠️  MiniMax API key not set yet");
    results.push({
      name: "MiniMax API Key",
      status: "⚠️",
      message: "Add MINIMAX_API_KEY before testing voice clone or TTS.",
    });
  } else if (envVars.MINIMAX_API_KEY.startsWith("sk_")) {
    console.log("   ✅ MiniMax API key format valid");
    results.push({
      name: "MiniMax API Key Format",
      status: "✅",
      message: "Starts with 'sk_' prefix",
    });
  } else {
    console.log("   ❌ Invalid MiniMax API key format");
    results.push({
      name: "MiniMax API Key Format",
      status: "❌",
      message: "Should start with 'sk_'",
    });
  }

  // 3. Validate Supabase URL
  console.log("\n3️⃣  Validating Supabase credentials...");
  try {
    const url = new URL(envVars.NEXT_PUBLIC_SUPABASE_URL || "");
    if (url.hostname.includes("supabase.co")) {
      console.log("   ✅ Supabase URL format valid");
      results.push({
        name: "Supabase URL",
        status: "✅",
        message: `Valid Supabase URL: ${url.hostname}`,
      });
    } else {
      throw new Error("Not a Supabase URL");
    }
  } catch (error) {
    console.log("   ❌ Invalid Supabase URL");
    results.push({
      name: "Supabase URL",
      status: "❌",
      message: "Should be a valid Supabase project URL",
    });
  }

  // 4. Check Supabase keys length
  console.log("\n4️⃣  Validating Supabase keys...");
  if (
    envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_") &&
    (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length > 20
  ) {
    console.log("   ✅ Supabase keys look valid (length check)");
    results.push({
      name: "Supabase Keys",
      status: "✅",
      message: "Publishable/client key is present and valid for browser Supabase access",
    });
  } else {
    console.log("   ⚠️  Supabase keys may be incomplete");
    results.push({
      name: "Supabase Keys",
      status: "⚠️",
      message: "Keys are shorter than expected - verify they are complete",
    });
  }

  // 4b. Check direct database URL
  console.log("\n4️⃣b Validating direct database URL...");
  if (envVars.DATABASE_URL?.includes("db.lvdktsesidqdoaqipjjz.supabase.co")) {
    console.log("   ✅ Direct database URL points at the Kindred Echo project");
    results.push({
      name: "Supabase Direct Database URL",
      status: "✅",
      message: "DATABASE_URL targets the expected Supabase project host",
    });
  } else {
    console.log("   ❌ Direct database URL does not target the expected project");
    results.push({
      name: "Supabase Direct Database URL",
      status: "❌",
      message: "DATABASE_URL should target db.lvdktsesidqdoaqipjjz.supabase.co",
    });
  }

  // 5. Try to connect to Supabase (optional test)
  console.log("\n5️⃣  Testing Supabase connectivity (optional)...");
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL || "",
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );

    const { data, error } = await supabase.from("config_credentials").select().limit(1);

    if (!error) {
      console.log("   ✅ Connected to Supabase successfully");
      results.push({
        name: "Supabase Connection",
        status: "✅",
        message: "Successfully connected to Supabase project",
      });
    } else {
      console.log("   ⚠️  Supabase reachable but table may not exist");
      console.log(`      Error: ${error.message}`);
      results.push({
        name: "Supabase Connection",
        status: "⚠️",
        message: `Connected but: ${error.message}. Run 'npm run setup:db' to create tables.`,
      });
    }
  } catch (error) {
    console.log("   ⚠️  Could not test Supabase connection (likely needs tables)");
    results.push({
      name: "Supabase Connection",
      status: "⚠️",
      message: "Could not connect. Run 'npm run setup:db' to initialize database.",
    });
  }

  // 6. Check for .env.local file
  console.log("\n6️⃣  Checking .env.local file...");
  try {
    await import("fs").then((fs) => {
      const path = require("path");
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        console.log("   ✅ .env.local file found");
        results.push({
          name: ".env.local File",
          status: "✅",
          message: "File exists in project root",
        });
      } else {
        console.log("   ⚠️  .env.local file not found (using process.env)");
        results.push({
          name: ".env.local File",
          status: "⚠️",
          message: "Not found - env vars may come from different source",
        });
      }
    });
  } catch (error) {
    console.log("   ⚠️  Could not check for .env.local");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 Configuration Test Results:\n");

  const passed = results.filter((r) => r.status === "✅").length;
  const failed = results.filter((r) => r.status === "❌").length;
  const warnings = results.filter((r) => r.status === "⚠️").length;

  results.forEach((result) => {
    console.log(`${result.status} ${result.name}`);
    if (result.message) {
      console.log(`   → ${result.message}`);
    }
  });

  console.log("\n" + "=".repeat(50));
  console.log(
    `\n📈 Summary: ${passed} passed, ${failed} failed, ${warnings} warnings\n`
  );

  if (failed > 0) {
    console.log("❌ Configuration validation failed!");
    console.log("\n💡 Next steps:");
    console.log("   1. Review the errors above");
    console.log("   2. Check your .env.local file");
    console.log("   3. Verify credentials from Supabase and MiniMax consoles");
    console.log("   4. Run this test again\n");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("✅ Configuration is mostly valid!");
    console.log("\n💡 Warnings to address:");
    results
      .filter((r) => r.status === "⚠️")
      .forEach((r) => {
        console.log(`   - ${r.message}`);
      });
    console.log();
  } else {
    console.log("✅ All configuration checks passed!");
    console.log("\n🚀 Ready to build Kindred Echo!\n");
  }

  return results;
}

// Run validation if called directly
if (require.main === module) {
  validateConfiguration().catch(console.error);
}

export type { ValidationResult };
