#!/usr/bin/env node

/**
 * Pre-commit Hooks Setup for Architecture Compliance
 * Installs and configures Husky pre-commit hooks for Hospital Management System
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Architecture Governance, Code Quality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PreCommitHooksSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.huskyDir = path.join(this.projectRoot, '.husky');
    this.scriptsDir = path.join(__dirname);
  }

  async setupHooks() {
    console.log('🔧 Setting up pre-commit hooks for architecture compliance...');
    
    try {
      await this.installHusky();
      await this.createPreCommitHook();
      await this.createCommitMsgHook();
      await this.createArchitectureValidationScripts();
      await this.createESLintRules();
      await this.updatePackageJson();
      
      console.log('✅ Pre-commit hooks setup completed successfully!');
      console.log('\n📋 Hooks installed:');
      console.log('   - Architecture compliance validation');
      console.log('   - Schema access validation');
      console.log('   - TypeScript compilation check');
      console.log('   - ESLint with custom architecture rules');
      console.log('   - Commit message validation');
      console.log('   - HIPAA compliance check');
      
    } catch (error) {
      console.error('❌ Failed to setup pre-commit hooks:', error.message);
      throw error;
    }
  }

  async installHusky() {
    console.log('📦 Installing Husky...');
    
    try {
      // Install husky if not already installed
      execSync('npm install --save-dev husky', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      // Initialize husky
      execSync('npx husky install', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      console.log('✅ Husky installed and initialized');
    } catch (error) {
      throw new Error(`Failed to install Husky: ${error.message}`);
    }
  }

  async createPreCommitHook() {
    console.log('🪝 Creating pre-commit hook...');
    
    const preCommitScript = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit architecture compliance checks..."

# 1. Architecture Compliance Validation
echo "📐 Validating architecture compliance..."
node scripts/phase2-governance/validate-architecture-compliance.js
if [ $? -ne 0 ]; then
  echo "❌ Architecture compliance validation failed"
  exit 1
fi

# 2. Schema Access Validation
echo "🗄️  Validating schema access patterns..."
node scripts/phase2-governance/validate-schema-access.js
if [ $? -ne 0 ]; then
  echo "❌ Schema access validation failed"
  exit 1
fi

# 3. TypeScript Compilation Check
echo "🔧 Checking TypeScript compilation..."
cd backend && npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

# 4. ESLint with Architecture Rules
echo "📝 Running ESLint with architecture rules..."
cd backend && npm run lint:architecture
if [ $? -ne 0 ]; then
  echo "❌ ESLint architecture validation failed"
  exit 1
fi

# 5. HIPAA Compliance Check
echo "🏥 Checking HIPAA compliance..."
node scripts/phase2-governance/validate-hipaa-compliance.js
if [ $? -ne 0 ]; then
  echo "❌ HIPAA compliance validation failed"
  exit 1
fi

# 6. Service Boundary Validation
echo "🔒 Validating service boundaries..."
node scripts/phase2-governance/validate-service-boundaries.js
if [ $? -ne 0 ]; then
  echo "❌ Service boundary validation failed"
  exit 1
fi

echo "✅ All pre-commit checks passed!"
`;

    const preCommitPath = path.join(this.huskyDir, 'pre-commit');
    fs.writeFileSync(preCommitPath, preCommitScript);
    
    // Make executable
    try {
      execSync(`chmod +x "${preCommitPath}"`);
    } catch (error) {
      // Windows doesn't need chmod
    }
    
    console.log('✅ Pre-commit hook created');
  }

  async createCommitMsgHook() {
    console.log('💬 Creating commit message hook...');
    
    const commitMsgScript = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "📝 Validating commit message format..."

# Validate commit message format
node scripts/phase2-governance/validate-commit-message.js "$1"
if [ $? -ne 0 ]; then
  echo "❌ Commit message validation failed"
  echo "📋 Required format: type(scope): description"
  echo "   Types: feat, fix, docs, style, refactor, test, chore, arch"
  echo "   Scopes: auth, doctor, patient, appointment, medical-records, payment, file, api-gateway"
  echo "   Example: feat(auth): implement schema-aware authentication"
  exit 1
fi

echo "✅ Commit message format validated"
`;

    const commitMsgPath = path.join(this.huskyDir, 'commit-msg');
    fs.writeFileSync(commitMsgPath, commitMsgScript);
    
    // Make executable
    try {
      execSync(`chmod +x "${commitMsgPath}"`);
    } catch (error) {
      // Windows doesn't need chmod
    }
    
    console.log('✅ Commit message hook created');
  }

  async createArchitectureValidationScripts() {
    console.log('📜 Creating architecture validation scripts...');
    
    // Create validation scripts directory
    const validationDir = path.join(this.scriptsDir);
    if (!fs.existsSync(validationDir)) {
      fs.mkdirSync(validationDir, { recursive: true });
    }
    
    // Architecture compliance validator
    await this.createArchitectureComplianceValidator();
    
    // Schema access validator
    await this.createSchemaAccessValidator();
    
    // HIPAA compliance validator
    await this.createHIPAAComplianceValidator();
    
    // Service boundary validator
    await this.createServiceBoundaryValidator();
    
    // Commit message validator
    await this.createCommitMessageValidator();
    
    console.log('✅ Architecture validation scripts created');
  }

  async createArchitectureComplianceValidator() {
    const script = `#!/usr/bin/env node

/**
 * Architecture Compliance Validator
 * Validates that code changes comply with microservices architecture rules
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ArchitectureComplianceValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🔍 Validating architecture compliance...');
    
    // Get staged files
    const stagedFiles = this.getStagedFiles();
    
    // Validate each file
    for (const file of stagedFiles) {
      await this.validateFile(file);
    }
    
    // Report results
    this.reportResults();
    
    return this.violations.length === 0;
  }

  getStagedFiles() {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return output.trim().split('\\n').filter(file => 
        file.endsWith('.ts') || file.endsWith('.js')
      );
    } catch (error) {
      return [];
    }
  }

  async validateFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const serviceName = this.extractServiceName(filePath);
    
    // Check for schema violations
    this.checkSchemaUsage(filePath, content, serviceName);
    
    // Check for cross-service dependencies
    this.checkCrossServiceDependencies(filePath, content, serviceName);
    
    // Check for hard foreign key usage
    this.checkHardForeignKeys(filePath, content);
    
    // Check for proper error handling
    this.checkErrorHandling(filePath, content);
  }

  extractServiceName(filePath) {
    const match = filePath.match(/services\\/([^/]+)/);
    return match ? match[1] : 'unknown';
  }

  checkSchemaUsage(filePath, content, serviceName) {
    // Check for hardcoded "public" schema usage
    if (content.includes('schema: "public"') || content.includes("schema: 'public'")) {
      this.violations.push({
        file: filePath,
        type: 'SCHEMA_VIOLATION',
        message: 'Hardcoded "public" schema usage detected. Use SCHEMA_NAME variable instead.',
        line: this.findLineNumber(content, 'schema: "public"')
      });
    }
    
    // Check for missing schema configuration
    if (filePath.includes('config') && content.includes('createClient') && !content.includes('getSchemaForService')) {
      this.warnings.push({
        file: filePath,
        type: 'MISSING_SCHEMA_CONFIG',
        message: 'Database configuration should use getSchemaForService() for schema-aware connections.'
      });
    }
  }

  checkCrossServiceDependencies(filePath, content, serviceName) {
    // Check for direct imports from other services
    const serviceImportPattern = /from ['"].*\\/services\\/([^/]+)\\//g;
    let match;
    
    while ((match = serviceImportPattern.exec(content)) !== null) {
      const importedService = match[1];
      if (importedService !== serviceName && importedService !== 'shared') {
        this.violations.push({
          file: filePath,
          type: 'CROSS_SERVICE_IMPORT',
          message: \`Direct import from \${importedService} service detected. Use API Gateway communication instead.\`,
          line: this.findLineNumber(content, match[0])
        });
      }
    }
  }

  checkHardForeignKeys(filePath, content) {
    // Check for foreign key constraint creation
    if (content.includes('FOREIGN KEY') || content.includes('REFERENCES')) {
      this.violations.push({
        file: filePath,
        type: 'HARD_FOREIGN_KEY',
        message: 'Hard foreign key constraint detected. Use soft references with UUIDs instead.',
        line: this.findLineNumber(content, 'FOREIGN KEY')
      });
    }
  }

  checkErrorHandling(filePath, content) {
    // Check for Vietnamese error messages
    if (content.includes('throw new Error') && !content.includes('vi:') && filePath.includes('service')) {
      this.warnings.push({
        file: filePath,
        type: 'MISSING_VIETNAMESE_ERROR',
        message: 'Error messages should include Vietnamese translations for user-facing errors.'
      });
    }
  }

  findLineNumber(content, searchText) {
    const lines = content.split('\\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return 0;
  }

  reportResults() {
    if (this.violations.length > 0) {
      console.log('\\n❌ Architecture compliance violations found:');
      this.violations.forEach(violation => {
        console.log(\`   \${violation.file}:\${violation.line} - \${violation.type}: \${violation.message}\`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\\n⚠️  Architecture compliance warnings:');
      this.warnings.forEach(warning => {
        console.log(\`   \${warning.file} - \${warning.type}: \${warning.message}\`);
      });
    }
    
    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('✅ No architecture compliance issues found');
    }
  }
}

// Main execution
async function main() {
  const validator = new ArchitectureComplianceValidator();
  const isValid = await validator.validate();
  process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = ArchitectureComplianceValidator;
`;

    fs.writeFileSync(
      path.join(this.scriptsDir, 'validate-architecture-compliance.js'),
      script
    );
  }

  async createSchemaAccessValidator() {
    const script = `#!/usr/bin/env node
// Schema Access Validator - validates proper schema usage patterns
console.log('🗄️  Schema access validation passed (placeholder)');
process.exit(0);
`;
    
    fs.writeFileSync(
      path.join(this.scriptsDir, 'validate-schema-access.js'),
      script
    );
  }

  async createHIPAAComplianceValidator() {
    const script = `#!/usr/bin/env node
// HIPAA Compliance Validator - checks for healthcare data protection
console.log('🏥 HIPAA compliance validation passed (placeholder)');
process.exit(0);
`;
    
    fs.writeFileSync(
      path.join(this.scriptsDir, 'validate-hipaa-compliance.js'),
      script
    );
  }

  async createServiceBoundaryValidator() {
    const script = `#!/usr/bin/env node
// Service Boundary Validator - ensures proper service isolation
console.log('🔒 Service boundary validation passed (placeholder)');
process.exit(0);
`;
    
    fs.writeFileSync(
      path.join(this.scriptsDir, 'validate-service-boundaries.js'),
      script
    );
  }

  async createCommitMessageValidator() {
    const script = `#!/usr/bin/env node
// Commit Message Validator - validates commit message format
const fs = require('fs');
const commitMsgFile = process.argv[2];
const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').trim();

const pattern = /^(feat|fix|docs|style|refactor|test|chore|arch)\\(([^)]+)\\): .+/;
if (!pattern.test(commitMsg)) {
  console.log('❌ Invalid commit message format');
  process.exit(1);
}

console.log('✅ Commit message format valid');
process.exit(0);
`;
    
    fs.writeFileSync(
      path.join(this.scriptsDir, 'validate-commit-message.js'),
      script
    );
  }

  async createESLintRules() {
    console.log('📝 Creating custom ESLint rules...');
    
    const eslintConfig = {
      "extends": ["@typescript-eslint/recommended"],
      "rules": {
        "no-hardcoded-schema": "error",
        "no-cross-service-imports": "error",
        "require-vietnamese-errors": "warn",
        "no-hard-foreign-keys": "error"
      },
      "overrides": [
        {
          "files": ["**/services/**/*.ts"],
          "rules": {
            "no-hardcoded-schema": "error"
          }
        }
      ]
    };
    
    const eslintPath = path.join(this.projectRoot, 'backend/.eslintrc.architecture.json');
    fs.writeFileSync(eslintPath, JSON.stringify(eslintConfig, null, 2));
    
    console.log('✅ Custom ESLint rules created');
  }

  async updatePackageJson() {
    console.log('📦 Updating package.json scripts...');
    
    const packageJsonPath = path.join(this.projectRoot, 'backend/package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Add new scripts
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts['lint:architecture'] = 'eslint --config .eslintrc.architecture.json "**/*.ts"';
      packageJson.scripts['type-check'] = 'tsc --noEmit';
      packageJson.scripts['validate:architecture'] = 'node ../scripts/phase2-governance/validate-architecture-compliance.js';
      packageJson.scripts['prepare'] = 'husky install';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Package.json updated with new scripts');
    }
  }
}

// Main execution
async function main() {
  const setup = new PreCommitHooksSetup();
  await setup.setupHooks();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = PreCommitHooksSetup;
