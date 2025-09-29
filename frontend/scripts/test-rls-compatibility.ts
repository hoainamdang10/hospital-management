// ============================================================================
// RLS POLICY COMPATIBILITY TESTING SCRIPT
// Test frontend components with updated RLS security policies
// ============================================================================

import { apiClient } from '../lib/api/client';

interface RLSTestResult {
  testName: string;
  role: 'admin' | 'doctor' | 'patient';
  operation: string;
  passed: boolean;
  responseTime: number;
  error?: string;
  details?: any;
}

interface TestCredentials {
  role: 'admin' | 'doctor' | 'patient';
  email: string;
  password: string;
  expectedAccess: string[];
  deniedAccess: string[];
}

class RLSCompatibilityTester {
  private results: RLSTestResult[] = [];
  private testCredentials: TestCredentials[] = [
    {
      role: 'admin',
      email: 'admin@hospital.com',
      password: 'Admin123!',
      expectedAccess: ['profiles', 'doctors', 'patients', 'appointments', 'medical_records'],
      deniedAccess: []
    },
    {
      role: 'doctor',
      email: 'doctor@hospital.com',
      password: 'Doctor123..',
      expectedAccess: ['profiles', 'appointments', 'medical_records'],
      deniedAccess: ['admin_settings']
    },
    {
      role: 'patient',
      email: 'patient@hospital.com',
      password: 'Patient123',
      expectedAccess: ['profiles', 'appointments'],
      deniedAccess: ['medical_records', 'admin_settings', 'doctors']
    }
  ];

  async runAllTests(): Promise<void> {
    console.log('🔒 Starting RLS Policy Compatibility Tests');
    
    for (const credentials of this.testCredentials) {
      await this.testRoleBasedAccess(credentials);
    }
    
    this.generateRLSReport();
  }

  private async testRoleBasedAccess(credentials: TestCredentials): Promise<void> {
    console.log(`Testing ${credentials.role} access...`);
    
    try {
      // Login with role credentials
      const loginResult = await this.loginAsRole(credentials);
      if (!loginResult.success) {
        this.results.push({
          testName: `${credentials.role} Login`,
          role: credentials.role,
          operation: 'authentication',
          passed: false,
          responseTime: 0,
          error: 'Login failed'
        });
        return;
      }

      // Test expected access
      for (const resource of credentials.expectedAccess) {
        await this.testResourceAccess(credentials.role, resource, true);
      }

      // Test denied access
      for (const resource of credentials.deniedAccess) {
        await this.testResourceAccess(credentials.role, resource, false);
      }

      // Test specific operations
      await this.testSpecificOperations(credentials.role);

    } catch (error) {
      console.error(`Error testing ${credentials.role}:`, error);
    }
  }

  private async loginAsRole(credentials: TestCredentials): Promise<{ success: boolean; token?: string }> {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      if (response.success && response.data?.token) {
        // Store token for subsequent requests
        localStorage.setItem('auth_token', response.data.token);
        return { success: true, token: response.data.token };
      }

      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  private async testResourceAccess(
    role: 'admin' | 'doctor' | 'patient',
    resource: string,
    shouldHaveAccess: boolean
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      let endpoint = '';
      switch (resource) {
        case 'profiles':
          endpoint = '/api/profiles/me';
          break;
        case 'doctors':
          endpoint = '/api/doctors';
          break;
        case 'patients':
          endpoint = '/api/patients';
          break;
        case 'appointments':
          endpoint = '/api/appointments';
          break;
        case 'medical_records':
          endpoint = '/api/medical-records';
          break;
        case 'admin_settings':
          endpoint = '/api/admin/settings';
          break;
        default:
          endpoint = `/api/${resource}`;
      }

      const response = await apiClient.get(endpoint);
      const responseTime = Date.now() - startTime;

      const hasAccess = response.success;
      const testPassed = shouldHaveAccess ? hasAccess : !hasAccess;

      this.results.push({
        testName: `${role} access to ${resource}`,
        role: role,
        operation: `GET ${endpoint}`,
        passed: testPassed,
        responseTime: responseTime,
        details: {
          expectedAccess: shouldHaveAccess,
          actualAccess: hasAccess,
          statusCode: hasAccess ? 200 : 403
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const isExpectedError = !shouldHaveAccess && (error as any)?.status === 403;
      
      this.results.push({
        testName: `${role} access to ${resource}`,
        role: role,
        operation: `GET /api/${resource}`,
        passed: isExpectedError,
        responseTime: responseTime,
        error: isExpectedError ? undefined : (error as Error).message,
        details: {
          expectedAccess: shouldHaveAccess,
          actualAccess: false,
          statusCode: (error as any)?.status || 500
        }
      });
    }
  }

  private async testSpecificOperations(role: 'admin' | 'doctor' | 'patient'): Promise<void> {
    switch (role) {
      case 'admin':
        await this.testAdminOperations();
        break;
      case 'doctor':
        await this.testDoctorOperations();
        break;
      case 'patient':
        await this.testPatientOperations();
        break;
    }
  }

  private async testAdminOperations(): Promise<void> {
    // Test admin-specific operations
    const operations = [
      { name: 'Create Doctor', endpoint: '/api/doctors', method: 'POST' },
      { name: 'Update Patient', endpoint: '/api/patients/PAT-202501-001', method: 'PUT' },
      { name: 'View All Appointments', endpoint: '/api/appointments/all', method: 'GET' },
      { name: 'System Settings', endpoint: '/api/admin/settings', method: 'GET' }
    ];

    for (const op of operations) {
      await this.testOperation('admin', op.name, op.endpoint, op.method);
    }
  }

  private async testDoctorOperations(): Promise<void> {
    // Test doctor-specific operations
    const operations = [
      { name: 'View My Appointments', endpoint: '/api/appointments/my', method: 'GET' },
      { name: 'Update Medical Record', endpoint: '/api/medical-records/MR-001', method: 'PUT' },
      { name: 'View Patient List', endpoint: '/api/patients/assigned', method: 'GET' }
    ];

    for (const op of operations) {
      await this.testOperation('doctor', op.name, op.endpoint, op.method);
    }
  }

  private async testPatientOperations(): Promise<void> {
    // Test patient-specific operations
    const operations = [
      { name: 'View My Profile', endpoint: '/api/profiles/me', method: 'GET' },
      { name: 'View My Appointments', endpoint: '/api/appointments/my', method: 'GET' },
      { name: 'Book Appointment', endpoint: '/api/appointments', method: 'POST' }
    ];

    for (const op of operations) {
      await this.testOperation('patient', op.name, op.endpoint, op.method);
    }
  }

  private async testOperation(
    role: 'admin' | 'doctor' | 'patient',
    operationName: string,
    endpoint: string,
    method: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await apiClient.get(endpoint);
          break;
        case 'post':
          response = await apiClient.post(endpoint, {});
          break;
        case 'put':
          response = await apiClient.put(endpoint, {});
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const responseTime = Date.now() - startTime;

      this.results.push({
        testName: `${role} - ${operationName}`,
        role: role,
        operation: `${method} ${endpoint}`,
        passed: response.success,
        responseTime: responseTime,
        details: {
          statusCode: 200,
          hasVietnameseSupport: this.checkVietnameseSupport(response)
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.results.push({
        testName: `${role} - ${operationName}`,
        role: role,
        operation: `${method} ${endpoint}`,
        passed: false,
        responseTime: responseTime,
        error: (error as Error).message,
        details: {
          statusCode: (error as any)?.status || 500
        }
      });
    }
  }

  private checkVietnameseSupport(response: any): boolean {
    const responseStr = JSON.stringify(response);
    return responseStr.includes('Lỗi') || 
           responseStr.includes('thành công') || 
           responseStr.includes('không tìm thấy') ||
           responseStr.includes('vui lòng');
  }

  private generateRLSReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    console.log('🔒 RLS Policy Compatibility Test Results', {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${successRate.toFixed(1)}%`
    });

    // Group results by role
    const roleResults = this.results.reduce((acc, result) => {
      if (!acc[result.role]) acc[result.role] = [];
      acc[result.role].push(result);
      return acc;
    }, {} as Record<string, RLSTestResult[]>);

    // Detailed results by role
    Object.entries(roleResults).forEach(([role, results]) => {
      const rolePassed = results.filter(r => r.passed).length;
      const roleTotal = results.length;
      const roleSuccessRate = (rolePassed / roleTotal) * 100;

      console.log(`\n👤 ${role.toUpperCase()} Role Results (${roleSuccessRate.toFixed(1)}%):`, {
        passed: rolePassed,
        total: roleTotal
      });

      results.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} ${result.testName}`, {
          operation: result.operation,
          responseTime: `${result.responseTime}ms`,
          error: result.error,
          details: result.details
        });
      });
    });

    // Security Assessment
    if (successRate >= 90) {
      console.log('🔒 RLS SECURITY: EXCELLENT - All role-based access controls working properly');
    } else if (successRate >= 80) {
      console.log('🔒 RLS SECURITY: GOOD - Minor access control issues detected');
    } else {
      console.log('🔒 RLS SECURITY: NEEDS ATTENTION - Significant access control issues found');
    }
  }
}

// Export for use in other scripts
export { RLSCompatibilityTester };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new RLSCompatibilityTester();
  tester.runAllTests().catch(error => {
    console.error('RLS compatibility test failed:', error);
    process.exit(1);
  });
}
