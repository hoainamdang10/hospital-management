/**
 * EndToEndTestSuite - Complete Patient Journey End-to-End Testing
 * Comprehensive E2E testing for complete healthcare workflows
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, HIPAA, E2E Testing Best Practices
 */
import { TestSuite } from "./IntegrationTestFramework";
export interface E2EScenario {
    scenarioId: string;
    scenarioName: string;
    vietnameseScenarioName: string;
    description: string;
    vietnameseDescription: string;
    steps: E2EStep[];
    expectedOutcome: any;
    healthcareContext: string;
    estimatedDuration: number;
}
export interface E2EStep {
    stepId: string;
    stepName: string;
    vietnameseStepName: string;
    service: string;
    action: string;
    input: any;
    expectedOutput: any;
    timeout: number;
    retries: number;
}
export interface E2EResult {
    scenarioId: string;
    scenarioName: string;
    vietnameseScenarioName: string;
    status: "PASSED" | "FAILED" | "ERROR";
    executionTime: number;
    startTime: Date;
    endTime: Date;
    steps: Array<{
        stepId: string;
        stepName: string;
        status: "PASSED" | "FAILED" | "SKIPPED";
        executionTime: number;
        output?: any;
        error?: string;
    }>;
    finalOutcome: any;
    error?: string;
    healthcareMetrics: {
        patientSatisfaction: number;
        clinicalAccuracy: number;
        billingAccuracy: number;
        notificationDelivery: number;
        vietnameseCompliance: number;
    };
}
export declare class EndToEndTestSuite {
    private static instance;
    private integrationFramework;
    private patientJourneyWorkflow;
    private appointmentBillingWorkflow;
    private notificationTriggerWorkflow;
    private e2eResults;
    private constructor();
    static getInstance(): EndToEndTestSuite;
    /**
     * Run complete E2E test suite
     */
    runEndToEndTests(): Promise<TestSuite>;
    /**
     * Define E2E scenarios
     */
    private defineE2EScenarios;
    /**
     * Define complete patient journey scenario
     */
    private defineCompletePatientJourneyScenario;
    /**
     * Define emergency patient scenario
     */
    private defineEmergencyPatientScenario;
    /**
     * Define insurance patient scenario
     */
    private defineInsurancePatientScenario;
    /**
     * Define follow-up patient scenario
     */
    private defineFollowUpPatientScenario;
    /**
     * Define multiple appointments scenario
     */
    private defineMultipleAppointmentsScenario;
    /**
     * Define billing workflow scenario
     */
    private defineBillingWorkflowScenario;
    /**
     * Define notification workflow scenario
     */
    private defineNotificationWorkflowScenario;
    /**
     * Define Vietnamese healthcare scenario
     */
    private defineVietnameseHealthcareScenario;
    /**
     * Execute E2E scenario
     */
    private executeE2EScenario;
    /**
     * Execute individual E2E step
     */
    private executeE2EStep;
    /**
     * Calculate healthcare metrics
     */
    private calculateHealthcareMetrics;
    /**
     * Calculate E2E endpoint coverage
     */
    private calculateE2EEndpointCoverage;
    /**
     * Calculate E2E workflow coverage
     */
    private calculateE2EWorkflowCoverage;
    /**
     * Get E2E test suite status
     */
    getE2ETestSuiteStatus(): any;
}
//# sourceMappingURL=EndToEndTestSuite.d.ts.map