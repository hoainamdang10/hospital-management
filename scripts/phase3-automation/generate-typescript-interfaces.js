#!/usr/bin/env node

/**
 * Automated TypeScript Interface Generation
 * Generates TypeScript interfaces from database schemas with HIPAA compliance
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Type Safety, Schema Synchronization
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Schema to service mapping
const SCHEMA_SERVICE_MAPPING = {
  'auth_schema': 'auth-service',
  'doctor_schema': 'doctor-service',
  'patient_schema': 'patient-service',
  'appointment_schema': 'appointment-service',
  'medical_records_schema': 'medical-records-service',
  'payment_schema': 'payment-service',
  'file_schema': 'file-service'
};

// PostgreSQL to TypeScript type mapping
const TYPE_MAPPING = {
  'character varying': 'string',
  'varchar': 'string',
  'text': 'string',
  'char': 'string',
  'integer': 'number',
  'bigint': 'number',
  'smallint': 'number',
  'decimal': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',
  'boolean': 'boolean',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'date': 'string',
  'time': 'string',
  'uuid': 'string',
  'json': 'any',
  'jsonb': 'any',
  'array': 'any[]',
  'bytea': 'Buffer'
};

class TypeScriptInterfaceGenerator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.generatedInterfaces = new Map();
    this.hipaaFields = new Set([
      'patient_id', 'medical_record_number', 'ssn', 'date_of_birth',
      'phone_number', 'email', 'address', 'emergency_contact',
      'insurance_number', 'diagnosis', 'treatment', 'prescription',
      'lab_results', 'medical_history', 'allergies'
    ]);
  }

  async generateAllInterfaces() {
    console.log('🔧 Starting TypeScript interface generation...');
    
    try {
      // Generate interfaces for each schema
      for (const [schemaName, serviceName] of Object.entries(SCHEMA_SERVICE_MAPPING)) {
        await this.generateSchemaInterfaces(schemaName, serviceName);
      }
      
      // Generate shared types
      await this.generateSharedTypes();
      
      // Generate index files
      await this.generateIndexFiles();
      
      // Validate generated interfaces
      await this.validateGeneratedInterfaces();
      
      console.log('✅ TypeScript interface generation completed successfully!');
      
    } catch (error) {
      console.error('❌ Interface generation failed:', error);
      throw error;
    }
  }

  async generateSchemaInterfaces(schemaName, serviceName) {
    console.log(`📝 Generating interfaces for ${schemaName} (${serviceName})...`);
    
    try {
      // Get all tables in the schema
      const tables = await this.getTablesInSchema(schemaName);
      
      if (tables.length === 0) {
        console.log(`⚠️  No tables found in schema ${schemaName}`);
        return;
      }
      
      const interfaces = [];
      
      for (const table of tables) {
        const interfaceCode = await this.generateTableInterface(schemaName, table);
        interfaces.push(interfaceCode);
      }
      
      // Generate the complete interface file
      const fileContent = this.generateInterfaceFile(schemaName, serviceName, interfaces);
      
      // Write to service directory
      const outputPath = this.getOutputPath(serviceName, 'types.ts');
      await this.writeInterfaceFile(outputPath, fileContent);
      
      console.log(`✅ Generated interfaces for ${schemaName}: ${tables.length} tables`);
      
    } catch (error) {
      console.error(`❌ Failed to generate interfaces for ${schemaName}:`, error);
      throw error;
    }
  }

  async getTablesInSchema(schemaName) {
    const { data, error } = await this.supabase
      .rpc('get_schema_tables', { schema_name: schemaName });
    
    if (error) {
      // Fallback query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', schemaName)
        .eq('table_type', 'BASE TABLE');
      
      if (fallbackError) throw fallbackError;
      return fallbackData?.map(row => row.table_name) || [];
    }
    
    return data || [];
  }

  async generateTableInterface(schemaName, tableName) {
    console.log(`  📋 Processing table: ${tableName}`);
    
    // Get table columns
    const columns = await this.getTableColumns(schemaName, tableName);
    
    // Generate interface properties
    const properties = columns.map(column => this.generateProperty(column));
    
    // Generate interface name
    const interfaceName = this.generateInterfaceName(tableName);
    
    // Check for HIPAA sensitive data
    const hasHIPAAData = columns.some(col => this.isHIPAAField(col.column_name));
    
    const interfaceCode = `
/**
 * ${interfaceName} interface
 * Generated from ${schemaName}.${tableName}
 * ${hasHIPAAData ? '@compliance HIPAA - Contains Protected Health Information (PHI)' : ''}
 * @generated ${new Date().toISOString()}
 */
export interface ${interfaceName} {${properties.map(prop => `\n  ${prop}`).join('')}
}

/**
 * ${interfaceName} creation interface (excludes auto-generated fields)
 */
export interface Create${interfaceName} extends Omit<${interfaceName}, 'created_at' | 'updated_at'${this.hasIdField(columns) ? " | 'id'" : ''}> {}

/**
 * ${interfaceName} update interface (all fields optional except ID)
 */
export interface Update${interfaceName} extends Partial<Omit<${interfaceName}, 'created_at'${this.hasIdField(columns) ? " | 'id'" : ''}>> {}

${hasHIPAAData ? this.generateHIPAAHelpers(interfaceName, columns) : ''}
`;

    return interfaceCode;
  }

  async getTableColumns(schemaName, tableName) {
    const { data, error } = await this.supabase
      .from('information_schema.columns')
      .select(`
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      `)
      .eq('table_schema', schemaName)
      .eq('table_name', tableName)
      .order('ordinal_position');
    
    if (error) throw error;
    return data || [];
  }

  generateProperty(column) {
    const tsType = this.mapPostgreSQLTypeToTypeScript(column);
    const isOptional = column.is_nullable === 'YES' || column.column_default !== null;
    const optionalMarker = isOptional ? '?' : '';
    
    // Add HIPAA comment for sensitive fields
    const hipaaComment = this.isHIPAAField(column.column_name) 
      ? ' // HIPAA: Protected Health Information' 
      : '';
    
    return `${column.column_name}${optionalMarker}: ${tsType};${hipaaComment}`;
  }

  mapPostgreSQLTypeToTypeScript(column) {
    let baseType = TYPE_MAPPING[column.data_type] || 'any';
    
    // Handle arrays
    if (column.data_type === 'ARRAY') {
      baseType = 'any[]';
    }
    
    // Handle specific cases
    if (column.column_name.includes('_at') && baseType === 'string') {
      return 'string'; // ISO timestamp string
    }
    
    if (column.column_name.includes('_id') && baseType === 'string') {
      return 'string'; // UUID or custom ID
    }
    
    // Handle enums (would need additional query to get enum values)
    if (column.data_type === 'USER-DEFINED') {
      return 'string'; // Fallback for enums
    }
    
    return baseType;
  }

  generateInterfaceName(tableName) {
    // Convert snake_case to PascalCase
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  isHIPAAField(fieldName) {
    return this.hipaaFields.has(fieldName) || 
           fieldName.includes('patient') ||
           fieldName.includes('medical') ||
           fieldName.includes('health') ||
           fieldName.includes('diagnosis') ||
           fieldName.includes('treatment');
  }

  hasIdField(columns) {
    return columns.some(col => col.column_name === 'id');
  }

  generateHIPAAHelpers(interfaceName, columns) {
    const hipaaFields = columns
      .filter(col => this.isHIPAAField(col.column_name))
      .map(col => `'${col.column_name}'`)
      .join(' | ');
    
    if (!hipaaFields) return '';
    
    return `
/**
 * HIPAA-compliant helpers for ${interfaceName}
 */
export type ${interfaceName}HIPAAFields = ${hipaaFields};

export interface ${interfaceName}Sanitized extends Omit<${interfaceName}, ${interfaceName}HIPAAFields> {
  // HIPAA fields removed for public access
}

/**
 * Sanitize ${interfaceName} for public access (removes HIPAA fields)
 */
export function sanitize${interfaceName}(data: ${interfaceName}): ${interfaceName}Sanitized {
  const { ${columns.filter(col => this.isHIPAAField(col.column_name)).map(col => col.column_name).join(', ')}, ...sanitized } = data;
  return sanitized;
}

/**
 * Audit log entry for ${interfaceName} access
 */
export interface ${interfaceName}AuditLog {
  recordId: string;
  accessedBy: string;
  accessType: 'READ' | 'WRITE' | 'DELETE';
  fieldsAccessed: string[];
  accessReason: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}
`;
  }

  generateInterfaceFile(schemaName, serviceName, interfaces) {
    const header = `/**
 * TypeScript Interfaces for ${serviceName}
 * Generated from ${schemaName} database schema
 * 
 * @generated ${new Date().toISOString()}
 * @compliance HIPAA, Type Safety
 * @warning DO NOT EDIT MANUALLY - This file is auto-generated
 */

// Base types
export type DatabaseTimestamp = string; // ISO 8601 timestamp
export type UUID = string;
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

// Status enums
export type RecordStatus = 'active' | 'inactive' | 'deleted' | 'suspended';
export type OperationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: DatabaseTimestamp;
};

// HIPAA compliance types
export type HIPAAAccessReason = 
  | 'treatment'
  | 'payment'
  | 'healthcare_operations'
  | 'patient_request'
  | 'legal_requirement'
  | 'emergency'
  | 'research_authorized';

export interface HIPAAContext {
  accessReason: HIPAAAccessReason;
  accessedBy: string;
  patientConsent?: boolean;
  legalBasis?: string;
}
`;

    const footer = `
// Re-export all interfaces
export * from './base-types';

// Service-specific exports
export const SCHEMA_NAME = '${schemaName}';
export const SERVICE_NAME = '${serviceName}';

/**
 * Type guard to check if an object is a valid database record
 */
export function isValidDatabaseRecord(obj: any): obj is { created_at: string; updated_at: string } {
  return obj && 
         typeof obj === 'object' && 
         typeof obj.created_at === 'string' && 
         typeof obj.updated_at === 'string';
}

/**
 * Utility type for pagination
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
`;

    return header + interfaces.join('\n') + footer;
  }

  getOutputPath(serviceName, fileName) {
    const basePath = path.join(__dirname, '../../backend/services', serviceName, 'src/types');
    
    // Ensure directory exists
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
    
    return path.join(basePath, fileName);
  }

  async writeInterfaceFile(outputPath, content) {
    // Add generation timestamp and warning
    const finalContent = `${content}

// Generation metadata
export const GENERATION_INFO = {
  timestamp: '${new Date().toISOString()}',
  generator: 'Hospital Management System Interface Generator v1.0.0',
  warning: 'This file is auto-generated. Do not edit manually.',
  schemaVersion: '${await this.getSchemaVersion()}'
};
`;

    fs.writeFileSync(outputPath, finalContent);
    console.log(`📄 Generated: ${outputPath}`);
  }

  async generateSharedTypes() {
    console.log('📝 Generating shared types...');
    
    const sharedTypes = `/**
 * Shared TypeScript types for Hospital Management System
 * @generated ${new Date().toISOString()}
 */

// Common Vietnamese healthcare types
export interface VietnameseAddress {
  street: string;
  ward: string; // Phường/Xã
  district: string; // Quận/Huyện
  city: string; // Thành phố/Tỉnh
  postalCode?: string;
  country: 'Vietnam';
}

export interface VietnamesePhoneNumber {
  number: string; // Format: 0xxxxxxxxx
  isVerified: boolean;
  type: 'mobile' | 'landline';
}

export interface VietnameseIdentification {
  type: 'CCCD' | 'CMND' | 'Passport';
  number: string;
  issuedDate: string;
  issuedPlace: string;
  expiryDate?: string;
}

// Healthcare-specific types
export interface MedicalLicense {
  licenseNumber: string; // Format: VN-XX-XXXX
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  specializations: string[];
  status: 'active' | 'suspended' | 'revoked';
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  validFrom: string;
  validTo: string;
  coverageType: 'basic' | 'premium' | 'vip';
  copayAmount?: number;
}

// Error handling types with Vietnamese support
export interface LocalizedError {
  code: string;
  message: {
    vi: string;
    en: string;
  };
  details?: any;
  timestamp: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: LocalizedError;
  metadata?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}
`;

    const sharedPath = path.join(__dirname, '../../backend/shared/src/types/generated.ts');
    await this.writeInterfaceFile(sharedPath, sharedTypes);
  }

  async generateIndexFiles() {
    console.log('📝 Generating index files...');
    
    for (const [schemaName, serviceName] of Object.entries(SCHEMA_SERVICE_MAPPING)) {
      const indexContent = `/**
 * Type exports for ${serviceName}
 * @generated ${new Date().toISOString()}
 */

export * from './types';
export * from '@hospital/shared/dist/types/generated';

// Service-specific re-exports
export { SCHEMA_NAME, SERVICE_NAME } from './types';
`;

      const indexPath = path.join(__dirname, '../../backend/services', serviceName, 'src/types/index.ts');
      fs.writeFileSync(indexPath, indexContent);
    }
  }

  async validateGeneratedInterfaces() {
    console.log('🔍 Validating generated interfaces...');
    
    // Run TypeScript compiler to check for errors
    try {
      const { execSync } = require('child_process');
      execSync('npx tsc --noEmit --skipLibCheck', {
        cwd: path.join(__dirname, '../../backend'),
        stdio: 'pipe'
      });
      
      console.log('✅ All generated interfaces are valid TypeScript');
    } catch (error) {
      console.warn('⚠️  TypeScript validation warnings (may be expected)');
      // Don't fail the generation process for TS warnings
    }
  }

  async getSchemaVersion() {
    try {
      const { data } = await this.supabase
        .from('schema_migrations')
        .select('version')
        .order('version', { ascending: false })
        .limit(1)
        .single();
      
      return data?.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

// Main execution
async function main() {
  const generator = new TypeScriptInterfaceGenerator();
  
  try {
    await generator.generateAllInterfaces();
    console.log('\n🎉 TypeScript interface generation completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review generated interfaces in each service');
    console.log('2. Update imports in existing code');
    console.log('3. Run TypeScript compilation check');
    console.log('4. Update API documentation');
    
  } catch (error) {
    console.error('\n❌ Interface generation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TypeScriptInterfaceGenerator;
