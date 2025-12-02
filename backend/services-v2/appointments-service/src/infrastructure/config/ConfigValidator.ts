/**
 * Configuration Validator
 * Validates environment variables and configuration
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

export interface AppConfig {
  // Service
  nodeEnv: string;
  port: number;
  serviceName: string;

  // Supabase
  supabase: {
    url: string;
    serviceRoleKey: string;
    jwtSecret: string;
  };

  // External Services
  services: {
    patientServiceUrl: string;
    providerServiceUrl: string;
    providerInternalToken?: string;
    schedulerServiceUrl: string;
    schedulerApiKey: string; // Required for scheduler integration
    billingServiceUrl: string; // Required for payment link creation
  };

  // CORS
  cors: {
    origin: string | string[];
  };

  // RabbitMQ
  rabbitmq: {
    url: string;
    exchange: string;
  };

  // Redis
  redis: {
    url: string;
    password?: string;
    db: number;
    keyPrefix: string;
  };

  // CQRS
  cqrs: {
    enableReadModelSync: boolean;
    readModelSyncTimeout: number;
  };

  // Outbox
  outbox: {
    pollIntervalMs: number;
    batchSize: number;
    baseDelayMs: number;
    maxDelayMs: number;
    reservedTimeoutMinutes: number;
  };

  // Tenant
  tenantId: string;

  // Logging
  logging: {
    level: string;
    enableRequestLogging: boolean;
    enableErrorTracking: boolean;
  };

  // Health Check
  healthCheck: {
    timeoutMs: number;
    enableDetailedCheck: boolean;
  };

  // Feature Flags
  features: {
    enableScheduler: boolean;
  };
}

/**
 * Validate and load configuration from environment variables
 */
export function loadConfig(): AppConfig {
  // Required variables
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    // SCHEDULER_API_KEY is now optional - scheduler merged into notifications-service
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  // Build config
  const config: AppConfig = {
    // Service
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3004", 10),
    serviceName: process.env.SERVICE_NAME || "appointments-service",

    // Supabase
    supabase: {
      url: process.env.SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      jwtSecret: process.env.SUPABASE_JWT_SECRET || "",
    },

    // External Services
    services: {
      patientServiceUrl:
        process.env.PATIENT_SERVICE_URL || "http://localhost:3002",
      providerServiceUrl:
        process.env.PROVIDER_SERVICE_URL || "http://localhost:3003",
      providerInternalToken:
        process.env.PROVIDER_INTERNAL_TOKEN ||
        process.env.INTERNAL_SERVICE_TOKEN ||
        "",
      schedulerServiceUrl:
        process.env.SCHEDULER_SERVICE_URL || "http://localhost:3011", // Scheduler merged into notifications-service
      schedulerApiKey: process.env.SCHEDULER_API_KEY || "default-scheduler-key", // Optional now
      billingServiceUrl:
        process.env.BILLING_SERVICE_URL || "http://localhost:3009",
    },

    // CORS
    cors: {
      origin: process.env.CORS_ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
        "http://localhost:3101",
      ],
    },

    // RabbitMQ
    rabbitmq: {
      url: process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5673",
      exchange: process.env.RABBITMQ_EXCHANGE || "hospital.events",
    },

    // Redis
    redis: {
      url: process.env.REDIS_URL || "redis://localhost:6380",
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0", 10),
      keyPrefix: process.env.REDIS_KEY_PREFIX || "appointments:",
    },

    // CQRS
    cqrs: {
      enableReadModelSync: process.env.ENABLE_READ_MODEL_SYNC !== "false",
      readModelSyncTimeout: parseInt(
        process.env.READ_MODEL_SYNC_TIMEOUT || "5000",
        10,
      ),
    },

    // Outbox
    outbox: {
      pollIntervalMs: parseInt(
        process.env.OUTBOX_POLL_INTERVAL_MS || "5000",
        10,
      ),
      batchSize: parseInt(process.env.OUTBOX_BATCH_SIZE || "50", 10),
      baseDelayMs: parseInt(process.env.OUTBOX_BASE_DELAY_MS || "5000", 10),
      maxDelayMs: parseInt(process.env.OUTBOX_MAX_DELAY_MS || "600000", 10),
      reservedTimeoutMinutes: parseInt(
        process.env.OUTBOX_RESERVED_TIMEOUT_MINUTES || "5",
        10,
      ),
    },

    // Tenant
    tenantId: process.env.TENANT_ID || "hospital-1",

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || "info",
      enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== "false",
      enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== "false",
    },

    // Health Check
    healthCheck: {
      timeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || "2000", 10),
      enableDetailedCheck: process.env.ENABLE_DETAILED_HEALTH_CHECK === "true",
    },

    // Feature Flags
    features: {
      // Default OFF. To enable, set ENABLE_SCHEDULER=true and SCHEDULER_DISABLED=false.
      enableScheduler: (() => {
        const schedulerDisabled =
          (process.env.SCHEDULER_DISABLED || "true").toLowerCase() === "true";
        const enableEnv =
          (process.env.ENABLE_SCHEDULER || "false").toLowerCase() === "true";
        return enableEnv && !schedulerDisabled;
      })(),
    },
  };

  // Validate config
  validateConfig(config);

  return config;
}

/**
 * Validate configuration values
 */
function validateConfig(config: AppConfig): void {
  // Validate port
  if (config.port < 1 || config.port > 65535) {
    throw new Error(
      `Invalid port: ${config.port}. Must be between 1 and 65535`,
    );
  }

  // Validate URLs
  if (!isValidUrl(config.supabase.url)) {
    throw new Error(`Invalid Supabase URL: ${config.supabase.url}`);
  }

  if (!isValidUrl(config.services.patientServiceUrl)) {
    throw new Error(
      `Invalid Patient Service URL: ${config.services.patientServiceUrl}`,
    );
  }

  if (!isValidUrl(config.services.providerServiceUrl)) {
    throw new Error(
      `Invalid Provider Service URL: ${config.services.providerServiceUrl}`,
    );
  }

  if (config.features.enableScheduler) {
    if (!isValidUrl(config.services.schedulerServiceUrl)) {
      throw new Error(
        `Invalid Scheduler Service URL: ${config.services.schedulerServiceUrl}`,
      );
    }
  }

  // Validate RabbitMQ URL
  if (
    !config.rabbitmq.url.startsWith("amqp://") &&
    !config.rabbitmq.url.startsWith("amqps://")
  ) {
    throw new Error(
      `Invalid RabbitMQ URL: ${config.rabbitmq.url}. Must start with amqp:// or amqps://`,
    );
  }

  // Validate Redis URL
  if (
    !config.redis.url.startsWith("redis://") &&
    !config.redis.url.startsWith("rediss://")
  ) {
    throw new Error(
      `Invalid Redis URL: ${config.redis.url}. Must start with redis:// or rediss://`,
    );
  }

  // Validate timeouts
  if (config.cqrs.readModelSyncTimeout < 0) {
    throw new Error(
      `Invalid read model sync timeout: ${config.cqrs.readModelSyncTimeout}. Must be >= 0`,
    );
  }

  if (config.healthCheck.timeoutMs < 0) {
    throw new Error(
      `Invalid health check timeout: ${config.healthCheck.timeoutMs}. Must be >= 0`,
    );
  }

  // Validate outbox config
  if (config.outbox.pollIntervalMs < 1000) {
    console.warn(
      `[Config] Outbox poll interval is very low: ${config.outbox.pollIntervalMs}ms. Recommended: >= 1000ms`,
    );
  }

  if (config.outbox.batchSize < 1 || config.outbox.batchSize > 1000) {
    throw new Error(
      `Invalid outbox batch size: ${config.outbox.batchSize}. Must be between 1 and 1000`,
    );
  }

  if (
    config.outbox.reservedTimeoutMinutes < 1 ||
    config.outbox.reservedTimeoutMinutes > 60
  ) {
    throw new Error(
      `Invalid outbox reserved timeout: ${config.outbox.reservedTimeoutMinutes}. Must be between 1 and 60 minutes`,
    );
  }

  // Validate scheduler API key (must not be empty)
  if (config.features.enableScheduler) {
    if (
      !config.services.schedulerApiKey ||
      config.services.schedulerApiKey.trim().length === 0
    ) {
      throw new Error(
        "Scheduler API key is required but empty. Please set SCHEDULER_API_KEY environment variable.",
      );
    }

    console.log("[Config] ✅ Scheduler API key validated");
  } else {
    console.log(
      "[Config] ⚠️ Scheduler integration disabled (ENABLE_SCHEDULER=false)",
    );
  }
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get configuration summary for logging
 */
export function getConfigSummary(config: AppConfig): string {
  return `
=============================================================================
CONFIGURATION SUMMARY
=============================================================================
Service:
  - Name: ${config.serviceName}
  - Environment: ${config.nodeEnv}
  - Port: ${config.port}

External Services:
  - Patient Service: ${config.services.patientServiceUrl}
  - Provider Service: ${config.services.providerServiceUrl}
  - Scheduler Service: ${config.services.schedulerServiceUrl}
  - Scheduler Enabled: ${config.features.enableScheduler ? "Yes" : "No"}

Infrastructure:
  - RabbitMQ: ${maskUrl(config.rabbitmq.url)}
  - Redis: ${maskUrl(config.redis.url)}
  - Supabase: ${maskUrl(config.supabase.url)}

Features:
  - Read Model Sync: ${config.cqrs.enableReadModelSync ? "Enabled" : "Disabled"}
  - Request Logging: ${config.logging.enableRequestLogging ? "Enabled" : "Disabled"}
  - Error Tracking: ${config.logging.enableErrorTracking ? "Enabled" : "Disabled"}
  - Detailed Health Check: ${config.healthCheck.enableDetailedCheck ? "Enabled" : "Disabled"}

Outbox:
  - Poll Interval: ${config.outbox.pollIntervalMs}ms
  - Batch Size: ${config.outbox.batchSize}
  - Reserved Timeout: ${config.outbox.reservedTimeoutMinutes}m
=============================================================================
`;
}

/**
 * Mask sensitive parts of URL
 */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    if (parsed.username && parsed.username !== "admin") {
      parsed.username = "***";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
