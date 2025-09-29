#!/usr/bin/env node

/**
 * Service Generator Script - Clean Architecture
 * Generates new microservice with Clean Architecture structure and patterns
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Healthcare Standards
 */

const fs = require("fs");
const path = require("path");

/**
 * Service Configuration
 */
const SERVICE_CONFIGS = {
  "identity-service": {
    port: 3021, // External: 3021, Internal: 3001
    internalPort: 3001,
    schema: "identity_schema",
    domain: "Identity & Access",
    patterns: ["Strategy", "Decorator", "Repository"],
    features: [
      "Authentication",
      "Authorization",
      "Session Management",
      "Role Management",
    ],
  },
  "patient-registry-service": {
    port: 3023, // External: 3023, Internal: 3003
    internalPort: 3003,
    schema: "patient_schema",
    domain: "Patient Registry",
    patterns: ["Repository", "Domain Events", "CQRS"],
    features: [
      "Patient Registration",
      "Demographics",
      "Contact Management",
      "Insurance Info",
    ],
  },
  "provider-staff-service": {
    port: 3022, // External: 3022, Internal: 3002
    internalPort: 3002,
    schema: "provider_schema",
    domain: "Provider/Staff",
    patterns: ["Aggregate", "Event Sourcing", "Saga"],
    features: [
      "Doctor Management",
      "Staff Management",
      "Schedules",
      "Departments",
    ],
  },
  "scheduling-service": {
    port: 3024, // External: 3024, Internal: 3004
    internalPort: 3004,
    schema: "scheduling_schema",
    domain: "Scheduling",
    patterns: ["Command", "Event-Driven", "Workflow"],
    features: ["Appointments", "Slots", "Availability", "Queue Management"],
  },
  "clinical-emr-service": {
    port: 3027, // External: 3027, Internal: 3007
    internalPort: 3007,
    schema: "clinical_schema",
    domain: "Clinical/EMR",
    patterns: ["Medical Workflow", "FHIR Compliance", "Audit Trail"],
    features: ["Medical Records", "Encounters", "Diagnoses", "Prescriptions"],
  },
  "billing-service": {
    port: 3029, // External: 3029, Internal: 3009
    internalPort: 3009,
    schema: "billing_schema",
    domain: "Billing",
    patterns: ["Strategy", "Outbox", "Payment Gateway"],
    features: ["Invoices", "Payments", "Insurance Claims", "PayOS Integration"],
  },
  "notifications-service": {
    port: 3031, // External: 3031, Internal: 3011
    internalPort: 3011,
    schema: "notification_schema",
    domain: "Notifications",
    patterns: ["Observer", "Template Method", "Circuit Breaker"],
    features: ["Email", "SMS", "Push Notifications", "Templates"],
  },
};

/**
 * Generate service structure
 */
function generateService(serviceName) {
  const config = SERVICE_CONFIGS[serviceName];
  if (!config) {
    console.error(`❌ Unknown service: ${serviceName}`);
    console.log("Available services:", Object.keys(SERVICE_CONFIGS).join(", "));
    process.exit(1);
  }

  console.log(`🚀 Generating ${serviceName}...`);

  const serviceDir = path.join(__dirname, "..", serviceName);

  // Create directory structure
  createDirectoryStructure(serviceDir);

  // Generate files
  generatePackageJson(serviceDir, serviceName, config);
  generateDockerfile(serviceDir, serviceName, config);
  generateMainIndex(serviceDir, serviceName, config);
  generateDomainLayer(serviceDir, serviceName, config);
  generateApplicationLayer(serviceDir, serviceName, config);
  generateInfrastructureLayer(serviceDir, serviceName, config);
  generatePresentationLayer(serviceDir, serviceName, config);
  generateTests(serviceDir, serviceName, config);
  generateReadme(serviceDir, serviceName, config);

  console.log(`✅ Service ${serviceName} generated successfully!`);
  console.log(`📁 Location: ${serviceDir}`);
  console.log(`🔧 Next steps:`);
  console.log(`   cd ${serviceName}`);
  console.log(`   npm install`);
  console.log(`   npm run dev`);
}

/**
 * Create directory structure
 */
function createDirectoryStructure(serviceDir) {
  const dirs = [
    "src/domain/aggregates",
    "src/domain/entities",
    "src/domain/value-objects",
    "src/domain/events",
    "src/domain/services",
    "src/domain/repositories",
    "src/application/use-cases",
    "src/application/services",
    "src/application/handlers",
    "src/infrastructure/persistence",
    "src/infrastructure/messaging",
    "src/infrastructure/external",
    "src/presentation/controllers",
    "src/presentation/middleware",
    "src/presentation/dto",
    "src/presentation/routes",
    "tests/unit",
    "tests/integration",
    "tests/e2e",
  ];

  dirs.forEach((dir) => {
    const fullPath = path.join(serviceDir, dir);
    fs.mkdirSync(fullPath, { recursive: true });
  });
}

/**
 * Generate package.json
 */
function generatePackageJson(serviceDir, serviceName, config) {
  const packageJson = {
    name: serviceName,
    version: "1.0.0",
    description: `${config.domain} Service - Hospital Management System`,
    main: "dist/index.js",
    scripts: {
      dev: "nodemon src/index.ts",
      build: "tsc",
      start: "node dist/index.js",
      test: "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      lint: "eslint src/**/*.ts",
      "lint:fix": "eslint src/**/*.ts --fix",
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      helmet: "^7.0.0",
      morgan: "^1.10.0",
      "@supabase/supabase-js": "^2.38.0",
      uuid: "^9.0.0",
      joi: "^17.9.2",
      winston: "^3.10.0",
    },
    devDependencies: {
      "@types/node": "^20.5.0",
      "@types/express": "^4.17.17",
      "@types/cors": "^2.8.13",
      "@types/morgan": "^1.9.4",
      "@types/uuid": "^9.0.2",
      typescript: "^5.1.6",
      nodemon: "^3.0.1",
      jest: "^29.6.2",
      "@types/jest": "^29.5.3",
      "ts-jest": "^29.1.1",
      eslint: "^8.46.0",
      "@typescript-eslint/eslint-plugin": "^6.2.1",
      "@typescript-eslint/parser": "^6.2.1",
    },
    keywords: [
      "hospital-management",
      "healthcare",
      "microservice",
      "clean-architecture",
      "ddd",
      "cqrs",
      "event-driven",
    ],
  };

  fs.writeFileSync(
    path.join(serviceDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}

/**
 * Generate Dockerfile
 */
function generateDockerfile(serviceDir, serviceName, config) {
  const dockerfile = `# ${serviceName} - Hospital Management System
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE ${config.port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${config.port}/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
`;

  fs.writeFileSync(path.join(serviceDir, "Dockerfile"), dockerfile);
}

/**
 * Generate main index.ts
 */
function generateMainIndex(serviceDir, serviceName, config) {
  const indexContent = `/**
 * ${config.domain} Service - Hospital Management System
 * Clean Architecture + DDD + CQRS + Event-Driven Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @port ${config.port}
 * @schema ${config.schema}
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { DIContainer } from '../shared/infrastructure/di/container';
import { setupDependencies } from './infrastructure/di/setup';
import { setupRoutes } from './presentation/routes';
import { logger } from './infrastructure/logging/logger';

const app = express();
const PORT = process.env.PORT || ${config.port};

// Create DI container
const container = new DIContainer({
  enableHealthcareCompliance: true,
  enableHealthChecks: true,
  enableMetrics: true
});

// Setup dependencies
setupDependencies(container);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup routes
setupRoutes(app, container);

// Health check
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await container.getServiceHealth();
    res.json({
      service: '${serviceName}',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      features: ${JSON.stringify(config.features)},
      patterns: ${JSON.stringify(config.patterns)},
      services: healthStatus
    });
  } catch (error) {
    res.status(503).json({
      service: '${serviceName}',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(\`🏥 \${serviceName} started on port \${PORT}\`);
  logger.info(\`📋 Features: \${config.features.join(', ')}\`);
  logger.info(\`🎯 Patterns: \${config.patterns.join(', ')}\`);
});

export default app;
`;

  fs.writeFileSync(path.join(serviceDir, "src/index.ts"), indexContent);
}

/**
 * Generate domain layer files
 */
function generateDomainLayer(serviceDir, serviceName, config) {
  // Generate aggregate example
  const aggregateContent = `/**
 * ${config.domain} Aggregate - Domain Layer
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { HealthcareAggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';

export interface ${config.domain.replace(/[^a-zA-Z]/g, "")}Props {
  // Define aggregate properties here
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ${config.domain.replace(/[^a-zA-Z]/g, "")}Aggregate extends HealthcareAggregateRoot<${config.domain.replace(/[^a-zA-Z]/g, "")}Props> {
  private constructor(props: ${config.domain.replace(/[^a-zA-Z]/g, "")}Props, id?: string) {
    super(props, id);
  }

  public static create(/* parameters */): ${config.domain.replace(/[^a-zA-Z]/g, "")}Aggregate {
    const props: ${config.domain.replace(/[^a-zA-Z]/g, "")}Props = {
      // Initialize properties
      id: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const aggregate = new ${config.domain.replace(/[^a-zA-Z]/g, "")}Aggregate(props);
    
    // Add domain event
    // aggregate.addDomainEvent(new SomethingCreatedEvent(...));
    
    return aggregate;
  }

  protected validateBusinessInvariants(): void {
    // Implement business rule validations
  }

  protected applyEvent(event: DomainEvent): void {
    // Implement event application logic
  }

  getPatientId(): string | null {
    // Return patient ID if applicable
    return null;
  }

  toPersistence(): any {
    return {
      id: this.id,
      ...this.props
    };
  }
}
`;

  fs.writeFileSync(
    path.join(
      serviceDir,
      `src/domain/aggregates/${serviceName.split("-")[0]}.aggregate.ts`
    ),
    aggregateContent
  );
}

/**
 * Generate application layer files
 */
function generateApplicationLayer(serviceDir, serviceName, config) {
  // Generate use case example
  const useCaseContent = `/**
 * Sample Use Case - Application Layer
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase } from '../../../shared/application/use-cases/base/use-case.interface';

export interface SampleRequest {
  // Define request structure
}

export interface SampleResponse {
  // Define response structure
  success: boolean;
  message: string;
}

export class SampleUseCase extends BaseHealthcareUseCase<SampleRequest, SampleResponse> {
  constructor(
    // Inject dependencies here
  ) {
    super();
  }

  protected async executeInternal(request: SampleRequest): Promise<SampleResponse> {
    // Implement business logic
    return {
      success: true,
      message: 'Operation completed successfully'
    };
  }

  async authorize(request: SampleRequest, userId: string): Promise<boolean> {
    // Implement authorization logic
    return true;
  }

  involvesPHI(request: SampleRequest): boolean {
    // Return true if request involves PHI
    return false;
  }

  getPatientId(request: SampleRequest): string | null {
    // Return patient ID if applicable
    return null;
  }
}
`;

  fs.writeFileSync(
    path.join(serviceDir, "src/application/use-cases/sample.use-case.ts"),
    useCaseContent
  );
}

/**
 * Generate infrastructure layer files
 */
function generateInfrastructureLayer(serviceDir, serviceName, config) {
  // Ensure directory exists
  const diDir = path.join(serviceDir, "src/infrastructure/di");
  fs.mkdirSync(diDir, { recursive: true });

  // Generate DI setup
  const diSetupContent = `/**
 * Dependency Injection Setup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DIContainer, ServiceLifetime } from '../../../shared/infrastructure/di/container';

export function setupDependencies(container: DIContainer): void {
  // Register repositories
  // container.register(ServiceTokens.SAMPLE_REPOSITORY, SampleRepository, ServiceLifetime.SCOPED);

  // Register use cases
  // container.register(ServiceTokens.SAMPLE_USE_CASE, SampleUseCase, ServiceLifetime.TRANSIENT);

  // Register domain services
  // container.register(ServiceTokens.SAMPLE_DOMAIN_SERVICE, SampleDomainService, ServiceLifetime.SINGLETON);
}
`;

  fs.writeFileSync(
    path.join(serviceDir, "src/infrastructure/di/setup.ts"),
    diSetupContent
  );
}

/**
 * Generate presentation layer files
 */
function generatePresentationLayer(serviceDir, serviceName, config) {
  // Ensure directory exists
  const routesDir = path.join(serviceDir, "src/presentation/routes");
  fs.mkdirSync(routesDir, { recursive: true });

  // Generate routes setup
  const routesContent = `/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express } from 'express';
import { DIContainer } from '../../../shared/infrastructure/di/container';

export function setupRoutes(app: Express, container: DIContainer): void {
  // Setup API routes
  app.get('/api/sample', (req, res) => {
    res.json({
      message: '${config.domain} Service API',
      features: ${JSON.stringify(config.features)},
      patterns: ${JSON.stringify(config.patterns)}
    });
  });
}
`;

  fs.writeFileSync(
    path.join(serviceDir, "src/presentation/routes/index.ts"),
    routesContent
  );
}

/**
 * Generate tests
 */
function generateTests(serviceDir, serviceName, config) {
  const testContent = `/**
 * ${config.domain} Service Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

describe('${config.domain} Service', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });
});
`;

  fs.writeFileSync(
    path.join(serviceDir, "tests/unit/service.test.ts"),
    testContent
  );
}

/**
 * Generate README
 */
function generateReadme(serviceDir, serviceName, config) {
  const readmeContent = `# ${config.domain} Service

${config.domain} microservice for Hospital Management System.

## 🏗️ Architecture

- **Clean Architecture** with DDD patterns
- **Port**: ${config.port}
- **Schema**: ${config.schema}
- **Patterns**: ${config.patterns.join(", ")}

## 🚀 Features

${config.features.map((feature) => `- ${feature}`).join("\n")}

## 📦 Installation

\`\`\`bash
npm install
\`\`\`

## 🔧 Development

\`\`\`bash
npm run dev
\`\`\`

## 🧪 Testing

\`\`\`bash
npm test
\`\`\`

## 🐳 Docker

\`\`\`bash
docker build -t ${serviceName} .
docker run -p ${config.port}:${config.port} ${serviceName}
\`\`\`
`;

  fs.writeFileSync(path.join(serviceDir, "README.md"), readmeContent);
}

// Main execution
if (require.main === module) {
  const serviceName = process.argv[2];

  if (!serviceName) {
    console.error("❌ Please provide service name");
    console.log("Usage: node generate-service.js <service-name>");
    console.log("Available services:", Object.keys(SERVICE_CONFIGS).join(", "));
    process.exit(1);
  }

  generateService(serviceName);
}

module.exports = { generateService, SERVICE_CONFIGS };
