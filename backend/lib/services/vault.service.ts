/**
 * Vault Service for Hospital Management System
 * Securely retrieves sensitive configuration from Supabase Vault
 */

import { supabaseAdmin } from "../supabase/server";

interface VaultSecret {
  name: string;
  description: string | null;
  decrypted_secret: string;
  created_at: string;
}

class VaultService {
  private cache: Map<string, { value: string; expires: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Retrieve a secret from Vault with caching
   */
  async getSecret(secretName: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.cache.get(secretName);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }

      // Retrieve from Vault
      const { data, error } = await supabaseAdmin
        .from("decrypted_secrets")
        .select("decrypted_secret")
        .eq("name", secretName)
        .single();

      if (error) {
        console.warn(
          `Failed to retrieve secret '${secretName}' from Vault:`,
          error.message
        );
        return null;
      }

      if (!data?.decrypted_secret) {
        console.warn(`Secret '${secretName}' not found in Vault`);
        return null;
      }

      // Cache the result
      this.cache.set(secretName, {
        value: data.decrypted_secret,
        expires: Date.now() + this.CACHE_TTL,
      });

      return data.decrypted_secret;
    } catch (error) {
      console.error(
        `Error retrieving secret '${secretName}' from Vault:`,
        error
      );
      return null;
    }
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(
    secretNames: string[]
  ): Promise<Record<string, string | null>> {
    try {
      const results: Record<string, string | null> = {};

      // Check cache first
      const uncachedNames: string[] = [];
      for (const name of secretNames) {
        const cached = this.cache.get(name);
        if (cached && cached.expires > Date.now()) {
          results[name] = cached.value;
        } else {
          uncachedNames.push(name);
        }
      }

      // Retrieve uncached secrets from Vault
      if (uncachedNames.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("decrypted_secrets")
          .select("name, decrypted_secret")
          .in("name", uncachedNames);

        if (error) {
          console.warn("Failed to retrieve secrets from Vault:", error.message);
          // Set null for all uncached names
          uncachedNames.forEach((name) => (results[name] = null));
        } else {
          // Process retrieved secrets
          data?.forEach((secret: VaultSecret) => {
            results[secret.name] = secret.decrypted_secret;

            // Cache the result
            this.cache.set(secret.name, {
              value: secret.decrypted_secret,
              expires: Date.now() + this.CACHE_TTL,
            });
          });

          // Set null for secrets not found
          uncachedNames.forEach((name) => {
            if (!(name in results)) {
              results[name] = null;
            }
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error retrieving secrets from Vault:", error);
      // Return null for all requested secrets
      const results: Record<string, string | null> = {};
      secretNames.forEach((name) => (results[name] = null));
      return results;
    }
  }

  /**
   * Get configuration with fallback to environment variables
   */
  async getConfig(
    secretName: string,
    envVarName: string
  ): Promise<string | null> {
    // Try Vault first
    const vaultValue = await this.getSecret(secretName);
    if (vaultValue) {
      return vaultValue;
    }

    // Fallback to environment variable
    const envValue = process.env[envVarName];
    if (envValue) {
      console.info(
        `Using environment variable for '${secretName}' (Vault not available)`
      );
      return envValue;
    }

    console.warn(
      `Neither Vault secret '${secretName}' nor environment variable '${envVarName}' available`
    );
    return null;
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats (for monitoring)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const vaultService = new VaultService();
export default vaultService;
