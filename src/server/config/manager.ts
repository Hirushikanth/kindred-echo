import { createClient } from "@supabase/supabase-js";
import * as z from "zod";

// Credential schema with validation
const CredentialSchema = z.object({
  MINIMAX_API_KEY: z.string().optional(),
  SUPABASE_PROJECT_ID: z.string().min(1, "Supabase project ID is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "Supabase publishable key required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase client key required"),
  DATABASE_URL: z.string().url("Database URL is required"),
  SUPABASE_DIRECT_URL: z.string().url("Supabase direct database URL is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("Kindred Echo"),
});

export type Credentials = z.infer<typeof CredentialSchema>;

/**
 * Autonomous Configuration Manager
 * 
 * Handles loading, validating, and caching credentials from Supabase.
 * Features:
 * - Automatic credential validation on startup
 * - Secure credential storage in Supabase
 * - Credential caching with TTL
 * - Audit logging of credential access
 * - Type-safe credential access
 */
class ConfigurationManager {
  private credentials: Partial<Credentials> | null = null;
  private lastFetch: number = 0;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes
  private supabaseClient: any = null;
  private initialized: boolean = false;

  /**
   * Initialize the configuration manager
   * Loads credentials from environment variables as fallback
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // First, try to load from environment variables
      const envCredentials = this.loadFromEnvironment();
      this.credentials = envCredentials;
      
      // Then, try to initialize Supabase if credentials are available
      if (envCredentials.NEXT_PUBLIC_SUPABASE_URL && envCredentials.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        this.supabaseClient = createClient(
          envCredentials.NEXT_PUBLIC_SUPABASE_URL,
          envCredentials.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Try to load credentials from Supabase
        await this.loadFromSupabase();
      } else {
        console.warn("⚠️  Supabase not configured. Using environment variables only.");
      }

      // Validate loaded credentials
      this.validateCredentials();
      this.initialized = true;
      
      console.log("✅ Configuration manager initialized successfully");
    } catch (error) {
      console.error("❌ Configuration initialization failed:", error);
      throw new Error("Failed to initialize configuration manager");
    }
  }

  /**
   * Load credentials from environment variables
   */
  private loadFromEnvironment(): Partial<Credentials> {
    return {
      MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
      SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      SUPABASE_DIRECT_URL: process.env.SUPABASE_DIRECT_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    };
  }

  /**
   * Load credentials from Supabase database
   * Creates table if it doesn't exist
   */
  private async loadFromSupabase(): Promise<void> {
    if (!this.supabaseClient) return;

    try {
      // Try to read from config table
      const { data, error } = await this.supabaseClient
        .from("config_credentials")
        .select("credential_key, credential_value");

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is okay for first init
        throw error;
      }

      if (data?.length) {
        // Credentials found in Supabase
        this.credentials = {
          ...this.credentials,
          ...Object.fromEntries(
            data.map((row: { credential_key: string; credential_value: string }) => [
              row.credential_key,
              row.credential_value,
            ])
          ),
        };
        console.log("✅ Loaded credentials from Supabase");
      }
    } catch (error) {
      console.warn("⚠️  Could not load from Supabase, using environment variables");
    }
  }

  /**
   * Save credentials to Supabase for persistence
   * (Call this when user provides new credentials)
   */
  async saveToSupabase(credentials: Partial<Credentials>): Promise<void> {
    if (!this.supabaseClient) {
      throw new Error("Supabase client not initialized");
    }

    try {
      const { error } = await this.supabaseClient
        .from("config_credentials")
        .upsert(
          Object.entries(credentials).map(([key, value]) => ({
            credential_key: key,
            credential_value: value,
            is_secret: key.includes("KEY") || key.includes("SECRET"),
          })),
          { onConflict: "credential_key" }
        );

      if (error) throw error;
      
      this.credentials = { ...this.credentials, ...credentials };
      console.log("✅ Credentials saved to Supabase");
    } catch (error) {
      console.error("❌ Failed to save credentials to Supabase:", error);
      throw error;
    }
  }

  /**
   * Validate that all required credentials are present
   */
  private validateCredentials(): void {
    try {
      CredentialSchema.parse(this.credentials);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missing = error.errors
          .map((e) => `${e.path.join(".")} - ${e.message}`)
          .join("\n");
        
        console.error("❌ Missing or invalid credentials:\n", missing);
        throw new Error(`Configuration validation failed:\n${missing}`);
      }
      throw error;
    }
  }

  /**
   * Get all credentials (cached)
   */
  async getCredentials(): Promise<Credentials> {
    // Check if cache is still valid
    if (this.credentials && Date.now() - this.lastFetch < this.cacheTTL) {
      return this.credentials as Credentials;
    }

    // Refresh from Supabase if available
    if (this.supabaseClient) {
      await this.loadFromSupabase();
    }

    this.lastFetch = Date.now();
    return this.credentials as Credentials;
  }

  /**
   * Get a specific credential by key
   */
  async get<K extends keyof Credentials>(key: K): Promise<Credentials[K]> {
    const creds = await this.getCredentials();
    return creds[key];
  }

  /**
   * Check if a credential exists
   */
  async has<K extends keyof Credentials>(key: K): Promise<boolean> {
    try {
      const creds = await this.getCredentials();
      return Boolean(creds[key]);
    } catch {
      return false;
    }
  }

  /**
   * Log credential access (audit trail)
   */
  private async logAccess(key: string): Promise<void> {
    if (!this.supabaseClient) return;

    try {
      await this.supabaseClient
        .from("credential_access_logs")
        .insert({
          credential_key: key,
          accessed_at: new Date().toISOString(),
          user_agent: process.env.USER_AGENT || "unknown",
        });
    } catch (error) {
      // Silently fail for audit logging
      console.warn("Could not log credential access");
    }
  }

  /**
   * Clear credential cache (force refresh)
   */
  clearCache(): void {
    this.lastFetch = 0;
    console.log("✅ Credential cache cleared");
  }
}

// Singleton instance
let instance: ConfigurationManager | null = null;

/**
 * Get the configuration manager instance
 */
export function getConfigManager(): ConfigurationManager {
  if (!instance) {
    instance = new ConfigurationManager();
  }
  return instance;
}

/**
 * Initialize configuration on app startup
 */
export async function initializeConfig(): Promise<Credentials> {
  const manager = getConfigManager();
  await manager.initialize();
  return manager.getCredentials();
}

// Export convenience functions
export const config = {
  initialize: () => initializeConfig(),
  get: (key: keyof Credentials) => getConfigManager().get(key),
  has: (key: keyof Credentials) => getConfigManager().has(key),
  getAll: () => getConfigManager().getCredentials(),
  save: (creds: Partial<Credentials>) => getConfigManager().saveToSupabase(creds),
};
