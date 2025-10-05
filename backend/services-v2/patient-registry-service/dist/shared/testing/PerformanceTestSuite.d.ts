/**
 * PerformanceTestSuite - Healthcare Performance Testing Suite
 * Comprehensive performance testing for Hospital Management System V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Performance Testing Best Practices
 */
export interface PerformanceTestConfig {
    baseUrl: string;
    concurrentUsers: number;
    testDuration: number;
    rampUpTime: number;
    thresholds: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        cpuUsage: number;
        memoryUsage: number;
    };
    healthcareScenarios: {
        patientRegistration: number;
        appointmentScheduling: number;
        billingProcessing: number;
        notificationSending: number;
        emergencyScenarios: number;
    };
}
export interface PerformanceMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    concurrentUsers: number;
    testDuration: number;
    resourceUsage: {
        avgCpuUsage: number;
        maxCpuUsage: number;
        avgMemoryUsage: number;
        maxMemoryUsage: number;
    };
    healthcareMetrics: {
        patientRegistrationPerformance: number;
        appointmentSchedulingPerformance: number;
        billingProcessingPerformance: number;
        notificationDeliveryPerformance: number;
        emergencyResponseTime: number;
    };
}
export interface LoadTestResult {
    testId: string;
    testName: string;
    vietnameseTestName: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    startTime: Date;
    endTime: Date;
    metrics: PerformanceMetrics;
    thresholdViolations: Array<{
        metric: string;
        expected: number;
        actual: number;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }>;
    recommendations: string[];
    vietnameseRecommendations: string[];
}
export declare class PerformanceTestSuite {
    private static instance;
    private config;
    private testResults;
    private activeTests;
    private constructor();
    static getInstance(): PerformanceTestSuite;
    /**
     * Load performance test configuration
     */
    private loadPerformanceConfig;
    /**
     * Run complete performance test suite
     */
    runPerformanceTests(): Promise<LoadTestResult[]>;
    /**
     * Run load test
     */
    private runLoadTest;
    /**
     * Run stress test
     */
    private runStressTest;
    /**
     * Run spike test
     */
    private runSpikeTest;
    /**
     * Run volume test
     */
    private runVolumeTest;
    /**
     * Run endurance test
     */
    private runEnduranceTest;
    /**
     * Run healthcare workflow performance test
     */
    private runHealthcareWorkflowPerformanceTest;
    /**
     * Run Vietnamese data performance test
     */
    private runVietnameseDataPerformanceTest;
    /**
     * Run concurrent user test
     */
    private runConcurrentUserTest;
    /**
     * Execute load test
     */
    private executeLoadTest;
    /**
     * Execute volume test
     */
    private executeVolumeTest;
    /**
     * Execute healthcare workflow test
     */
    private executeHealthcareWorkflowTest;
    /**
     * Execute Vietnamese data test
     */
    private executeVietnameseDataTest;
    /**
     * Check performance thresholds
     */
    private checkThresholds;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Generate Vietnamese recommendations
     */
    private generateVietnameseRecommendations;
    /**
     * Generate healthcare recommendations
     */
    private generateHealthcareRecommendations;
    /**
     * Generate Vietnamese healthcare recommendations
     */
    private generateVietnameseHealthcareRecommendations;
    /**
     * Generate performance report
     */
    private generatePerformanceReport;
    /**
     * Get performance test suite status
     */
    getPerformanceTestSuiteStatus(): any;
}
//# sourceMappingURL=PerformanceTestSuite.d.ts.map