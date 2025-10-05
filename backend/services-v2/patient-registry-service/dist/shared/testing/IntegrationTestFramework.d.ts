/**
 * IntegrationTestFramework - Cross-Service Integration Testing Framework
 * Comprehensive integration testing for Hospital Management System V2 microservices
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, HIPAA, Integration Testing Best Practices
 */
export interface TestConfiguration {
    services: {
        apiGateway: string;
        identityService: string;
        patientRegistryService: string;
        providerStaffService: string;
        schedulingService: string;
        clinicalEMRService: string;
        billingService: string;
        notificationsService: string;
    };
    database: {
        supabaseUrl: string;
        supabaseKey: string;
    };
    testing: {
        timeout: number;
        retries: number;
        parallelTests: boolean;
        cleanupAfterTests: boolean;
        generateReports: boolean;
    };
    vietnamese: {
        language: string;
        timezone: string;
        currency: string;
        healthcareStandards: string;
    };
}
export interface TestResult {
    testId: string;
    testName: string;
    vietnameseTestName: string;
    status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR';
    executionTime: number;
    startTime: Date;
    endTime: Date;
    assertions: Array<{
        description: string;
        vietnameseDescription: string;
        expected: any;
        actual: any;
        passed: boolean;
    }>;
    error?: string;
    metadata: {
        serviceName: string;
        testCategory: string;
        healthcareContext: string;
        hipaaCompliant: boolean;
    };
}
export interface TestSuite {
    suiteId: string;
    suiteName: string;
    vietnameseSuiteName: string;
    description: string;
    vietnameseDescription: string;
    tests: TestResult[];
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    executionTime: number;
    coverage: {
        services: number;
        endpoints: number;
        workflows: number;
        healthcareScenarios: number;
    };
}
export declare class IntegrationTestFramework {
    private static instance;
    private config;
    private testResults;
    private testSuites;
    private authTokens;
    private constructor();
    static getInstance(): IntegrationTestFramework;
    /**
     * Load test configuration
     */
    private loadTestConfiguration;
    /**
     * Run complete integration test suite
     */
    runIntegrationTests(): Promise<TestSuite>;
    /**
     * Initialize test environment
     */
    private initializeTestEnvironment;
    /**
     * Setup test authentication
     */
    private setupTestAuthentication;
    /**
     * Verify service connectivity
     */
    private verifyServiceConnectivity;
    /**
     * Setup test data
     */
    private setupTestData;
    /**
     * Run service health tests
     */
    private runServiceHealthTests;
    /**
     * Run authentication tests
     */
    private runAuthenticationTests;
    /**
     * Run patient journey tests
     */
    private runPatientJourneyTests;
    /**
     * Run appointment billing tests
     */
    private runAppointmentBillingTests;
    /**
     * Run notification tests
     */
    private runNotificationTests;
    /**
     * Run workflow integration tests
     */
    private runWorkflowIntegrationTests;
    /**
     * Run Vietnamese healthcare tests
     */
    private runVietnameseHealthcareTests;
    /**
     * Run cross-service communication tests
     */
    private runCrossServiceCommunicationTests;
    /**
     * Execute individual test
     */
    private executeTest;
    /**
     * Calculate endpoint coverage
     */
    private calculateEndpointCoverage;
    /**
     * Calculate workflow coverage
     */
    private calculateWorkflowCoverage;
    /**
     * Calculate healthcare coverage
     */
    private calculateHealthcareCoverage;
    /**
     * Generate test report
     */
    private generateTestReport;
    /**
     * Cleanup test environment
     */
    private cleanupTestEnvironment;
    /**
     * Get integration test framework status
     */
    getFrameworkStatus(): any;
}
//# sourceMappingURL=IntegrationTestFramework.d.ts.map