/**
 * TestSuiteOrchestrator - Comprehensive Testing Orchestration
 * Central orchestrator for all testing suites in Hospital Management System V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, HIPAA, Testing Best Practices
 */
export interface TestExecutionPlan {
    planId: string;
    planName: string;
    vietnamesePlanName: string;
    description: string;
    vietnameseDescription: string;
    testSuites: Array<{
        suiteType: 'INTEGRATION' | 'END_TO_END' | 'PERFORMANCE' | 'SECURITY' | 'COMPLIANCE';
        enabled: boolean;
        priority: number;
        parallelExecution: boolean;
        timeout: number;
    }>;
    healthcareCompliance: {
        hipaaRequired: boolean;
        vietnameseStandardsRequired: boolean;
        mohReportingRequired: boolean;
        bhytIntegrationRequired: boolean;
    };
    executionSettings: {
        stopOnFailure: boolean;
        generateReports: boolean;
        cleanupAfterTests: boolean;
        notifyOnCompletion: boolean;
    };
}
export interface TestExecutionResult {
    planId: string;
    planName: string;
    vietnamesePlanName: string;
    status: 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'CANCELLED';
    startTime: Date;
    endTime: Date;
    totalExecutionTime: number;
    suiteResults: Array<{
        suiteType: string;
        suiteName: string;
        status: 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED';
        executionTime: number;
        testCount: number;
        passedTests: number;
        failedTests: number;
        coverage: any;
    }>;
    overallMetrics: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        skippedTests: number;
        overallCoverage: {
            services: number;
            endpoints: number;
            workflows: number;
            healthcareScenarios: number;
        };
        healthcareCompliance: {
            hipaaCompliance: number;
            vietnameseStandardsCompliance: number;
            mohReportingCompliance: number;
            bhytIntegrationCompliance: number;
        };
    };
    recommendations: string[];
    vietnameseRecommendations: string[];
    reportPaths: string[];
}
export declare class TestSuiteOrchestrator {
    private static instance;
    private integrationFramework;
    private endToEndSuite;
    private performanceSuite;
    private executionResults;
    private activeExecutions;
    private constructor();
    static getInstance(): TestSuiteOrchestrator;
    /**
     * Execute comprehensive test plan
     */
    executeTestPlan(plan: TestExecutionPlan): Promise<TestExecutionResult>;
    /**
     * Execute individual test suite
     */
    private executeSuite;
    /**
     * Execute security tests (placeholder)
     */
    private executeSecurityTests;
    /**
     * Execute compliance tests (placeholder)
     */
    private executeComplianceTests;
    /**
     * Validate test environment
     */
    private validateTestEnvironment;
    /**
     * Calculate overall metrics
     */
    private calculateOverallMetrics;
    /**
     * Generate overall recommendations
     */
    private generateOverallRecommendations;
    /**
     * Generate Vietnamese overall recommendations
     */
    private generateVietnameseOverallRecommendations;
    /**
     * Generate comprehensive report
     */
    private generateComprehensiveReport;
    /**
     * Cleanup test environment
     */
    private cleanupTestEnvironment;
    /**
     * Notify test completion
     */
    private notifyTestCompletion;
    /**
     * Create default test execution plan
     */
    createDefaultTestPlan(): TestExecutionPlan;
    /**
     * Get test orchestrator status
     */
    getOrchestratorStatus(): any;
}
//# sourceMappingURL=TestSuiteOrchestrator.d.ts.map