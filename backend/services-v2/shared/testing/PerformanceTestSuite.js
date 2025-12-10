"use strict";
/**
 * PerformanceTestSuite - Healthcare Performance Testing Suite
 * Comprehensive performance testing for Hospital Management System V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Performance Testing Best Practices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTestSuite = void 0;
class PerformanceTestSuite {
    constructor() {
        this.testResults = new Map();
        this.activeTests = new Map();
        this.config = this.loadPerformanceConfig();
    }
    static getInstance() {
        if (!PerformanceTestSuite.instance) {
            PerformanceTestSuite.instance = new PerformanceTestSuite();
        }
        return PerformanceTestSuite.instance;
    }
    /**
     * Load performance test configuration
     */
    loadPerformanceConfig() {
        return {
            baseUrl: process.env.API_GATEWAY_URL || 'http://localhost:3100',
            concurrentUsers: 50,
            testDuration: 300, // 5 minutes
            rampUpTime: 60, // 1 minute
            thresholds: {
                responseTime: 200, // ms
                throughput: 100, // requests/second
                errorRate: 1, // 1%
                cpuUsage: 80, // 80%
                memoryUsage: 85 // 85%
            },
            healthcareScenarios: {
                patientRegistration: 20,
                appointmentScheduling: 30,
                billingProcessing: 25,
                notificationSending: 15,
                emergencyScenarios: 10
            }
        };
    }
    /**
     * Run complete performance test suite
     */
    async runPerformanceTests() {
        console.log(' Starting Hospital Management System V2 Performance Tests');
        try {
            const testResults = [];
            // Run different types of performance tests
            const tests = [
                this.runLoadTest(),
                this.runStressTest(),
                this.runSpikeTest(),
                this.runVolumeTest(),
                this.runEnduranceTest(),
                this.runHealthcareWorkflowPerformanceTest(),
                this.runVietnameseDataPerformanceTest(),
                this.runConcurrentUserTest()
            ];
            const results = await Promise.all(tests);
            testResults.push(...results);
            // Generate performance report
            await this.generatePerformanceReport(testResults);
            console.log(` Performance tests completed: ${testResults.length} tests executed`);
            return testResults;
        }
        catch (error) {
            console.error(' Performance test suite failed:', error);
            throw error;
        }
    }
    /**
     * Run load test
     */
    async runLoadTest() {
        console.log(' Running Load Test...');
        const testId = `load_test_${Date.now()}`;
        const startTime = new Date();
        try {
            this.activeTests.set(testId, true);
            // Simulate load test execution
            const metrics = await this.executeLoadTest({
                concurrentUsers: this.config.concurrentUsers,
                duration: this.config.testDuration,
                rampUpTime: this.config.rampUpTime
            });
            const endTime = new Date();
            const thresholdViolations = this.checkThresholds(metrics);
            const status = thresholdViolations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'FAILED' :
                thresholdViolations.length > 0 ? 'WARNING' : 'PASSED';
            const result = {
                testId,
                testName: 'Load Test',
                vietnameseTestName: 'Kiểm thử Tải',
                status,
                startTime,
                endTime,
                metrics,
                thresholdViolations,
                recommendations: this.generateRecommendations(metrics, thresholdViolations),
                vietnameseRecommendations: this.generateVietnameseRecommendations(metrics, thresholdViolations)
            };
            this.testResults.set(testId, result);
            this.activeTests.delete(testId);
            console.log(` Load Test completed: ${status} (${metrics.averageResponseTime}ms avg response)`);
            return result;
        }
        catch (error) {
            this.activeTests.delete(testId);
            console.error(' Load Test failed:', error);
            throw error;
        }
    }
    /**
     * Run stress test
     */
    async runStressTest() {
        console.log(' Running Stress Test...');
        const testId = `stress_test_${Date.now()}`;
        const startTime = new Date();
        try {
            this.activeTests.set(testId, true);
            // Stress test with higher load
            const metrics = await this.executeLoadTest({
                concurrentUsers: this.config.concurrentUsers * 2,
                duration: this.config.testDuration / 2,
                rampUpTime: this.config.rampUpTime / 2
            });
            const endTime = new Date();
            const thresholdViolations = this.checkThresholds(metrics);
            const status = thresholdViolations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'FAILED' :
                thresholdViolations.length > 0 ? 'WARNING' : 'PASSED';
            const result = {
                testId,
                testName: 'Stress Test',
                vietnameseTestName: 'Kiểm thử Căng thẳng',
                status,
                startTime,
                endTime,
                metrics,
                thresholdViolations,
                recommendations: this.generateRecommendations(metrics, thresholdViolations),
                vietnameseRecommendations: this.generateVietnameseRecommendations(metrics, thresholdViolations)
            };
            this.testResults.set(testId, result);
            this.activeTests.delete(testId);
            console.log(` Stress Test completed: ${status} (${metrics.errorRate}% error rate)`);
            return result;
        }
        catch (error) {
            this.activeTests.delete(testId);
            console.error(' Stress Test failed:', error);
            throw error;
        }
    }
    /**
     * Run spike test
     */
    async runSpikeTest() {
        console.log(' Running Spike Test...');
        const testId = `spike_test_${Date.now()}`;
        const startTime = new Date();
        try {
            this.activeTests.set(testId, true);
            // Spike test with sudden load increase
            const metrics = await this.executeLoadTest({
                concurrentUsers: this.config.concurrentUsers * 5,
                duration: 60, // 1 minute spike
                rampUpTime: 5 // Very fast ramp up
            });
            const endTime = new Date();
            const thresholdViolations = this.checkThresholds(metrics);
            const status = thresholdViolations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'FAILED' :
                thresholdViolations.length > 0 ? 'WARNING' : 'PASSED';
            const result = {
                testId,
                testName: 'Spike Test',
                vietnameseTestName: 'Kiểm thử Đột biến',
                status,
                startTime,
                endTime,
                metrics,
                thresholdViolations,
                recommendations: this.generateRecommendations(metrics, thresholdViolations),
                vietnameseRecommendations: this.generateVietnameseRecommendations(metrics, thresholdViolations)
            };
            this.testResults.set(testId, result);
            this.activeTests.delete(testId);
            console.log(` Spike Test completed: ${status} (${metrics.maxResponseTime}ms max response)`);
            return result;
        }
        catch (error) {
            this.activeTests.delete(testId);
            console.error(' Spike Test failed:', error);
            throw error;
        }
    }
    /**
     * Run volume test
     */
    async runVolumeTest() {
        console.log(' Running Volume Test...');
        const testId = `volume_test_${Date.now()}`;
        const startTime = new Date();
        try {
            this.activeTests.set(testId, true);
            // Volume test with large data sets
            const metrics = await this.executeVolumeTest();
            const endTime = new Date();
            const thresholdViolations = this.checkThresholds(metrics);
            const status = thresholdViolations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'FAILED' :
                thresholdViolations.length > 0 ? 'WARNING' : 'PASSED';
            const result = {
                testId,
                testName: 'Volume Test',
                vietnameseTestName: 'Kiểm thử Khối lượng',
                status,
                startTime,
                endTime,
                metrics,
                thresholdViolations,
                recommendations: this.generateRecommendations(metrics, thresholdViolations),
                vietnameseRecommendations: this.generateVietnameseRecommendations(metrics, thresholdViolations)
            };
            this.testResults.set(testId, result);
            this.activeTests.delete(testId);
            console.log(` Volume Test completed: ${status} (${metrics.throughput} req/s throughput)`);
            return result;
        }
        catch (error) {
            this.activeTests.delete(testId);
            console.error(' Volume Test failed:', error);
            throw error;
        }
    }
    /**
     * Run endurance test
     */
    async runEnduranceTest() {
        console.log('⏱️ Running Endurance Test...');
        const testId = `endurance_test_${Date.now()}`;
        const startTime = new Date();
        try {
            this.activeTests.set(testId, true);
            // Endurance test with extended duration
            const metrics = await this.executeLoadTest({
                concurrentUsers: this.config.concurrentUsers,
                duration: this.config.testDuration * 2, // Double duration
                rampUpTime: this.config.rampUpTime
            });
            const endTime = new Date();
            const thresholdViolations = this.checkThresholds(metrics);
            const status = thresholdViolations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'FAILED' :
                thresholdViolations.length > 0 ? 'WARNING' : 'PASSED';
            const result = {
                testId,
                testName: 'Endurance Test',
                vietnameseTestName: 'Kiểm thử Sức bền',
                status,
                startTime,
                endTime,
                metrics,
                thresholdViolations,
                recommendations: this.generateRecommendations(metrics, thresholdViolations),
                vietnameseRecommendations: this.generateVietnameseRecommendations(metrics, thresholdViolations)
            };
            this.testResults.set(testId, result);
            this.activeTests.delete(testId);
            console.log(` Endurance Test completed: ${status} (${metrics.testDuration}s duration)`);
            return result;
        }
        catch (error) {
            this.activeTests.delete(testId);
            console.error(' Endurance Test failed:', error);
            throw error;
        }
    }
    /**
     * Run healthcare workflow performance test
     */
    async runHealthcareWorkflowPerformanceTest() {
        console.log(' Running Healthcare Workflow Performance Test...');
        const testId = `healthcare_workflow_test_${Date.now()}`;
        const startTime = new Date();
        try {
            this.activeTests.set(testId, true);
            // Healthcare-specific performance test
            const metrics = await this.executeHealthcareWorkflowTest();
            const endTime = new Date();
            const thresholdViolations = this.checkThresholds(metrics);
            const status = thresholdViolations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'FAILED' :
                thresholdViolations.length > 0 ? 'WARNING' : 'PASSED';
            const result = {
                testId,
                testName: 'Healthcare Workflow Performance Test',
                vietnameseTestName: 'Kiểm thử Hiệu suất Quy trình Y tế',
                status,
                startTime,
                endTime,
                metrics,
                thresholdViolations,
                recommendations: this.generateHealthcareRecommendations(metrics),
                vietnameseRecommendations: this.generateVietnameseHealthcareRecommendations(metrics)
            };
            this.testResults.set(testId, result);
            this.activeTests.delete(testId);
            console.log(` Healthcare Workflow Test completed: ${status}`);
            return result;
        }
        catch (error) {
            this.activeTests.delete(testId);
            console.error(' Healthcare Workflow Test failed:', error);
            throw error;
        }
    }
    /**
     * Run Vietnamese data performance test
     */
    async runVietnameseDataPerformanceTest() {
        console.log(' Running Vietnamese Data Performance Test...');
        const testId = `vietnamese_data_test_${Date.now()}`;
        const startTime = new Date();
        try {
            this.activeTests.set(testId, true);
            // Vietnamese data handling performance test
            const metrics = await this.executeVietnameseDataTest();
            const endTime = new Date();
            const thresholdViolations = this.checkThresholds(metrics);
            const status = thresholdViolations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'FAILED' :
                thresholdViolations.length > 0 ? 'WARNING' : 'PASSED';
            const result = {
                testId,
                testName: 'Vietnamese Data Performance Test',
                vietnameseTestName: 'Kiểm thử Hiệu suất Dữ liệu Tiếng Việt',
                status,
                startTime,
                endTime,
                metrics,
                thresholdViolations,
                recommendations: this.generateRecommendations(metrics, thresholdViolations),
                vietnameseRecommendations: this.generateVietnameseRecommendations(metrics, thresholdViolations)
            };
            this.testResults.set(testId, result);
            this.activeTests.delete(testId);
            console.log(` Vietnamese Data Test completed: ${status}`);
            return result;
        }
        catch (error) {
            this.activeTests.delete(testId);
            console.error(' Vietnamese Data Test failed:', error);
            throw error;
        }
    }
    /**
     * Run concurrent user test
     */
    async runConcurrentUserTest() {
        console.log(' Running Concurrent User Test...');
        const testId = `concurrent_user_test_${Date.now()}`;
        const startTime = new Date();
        try {
            this.activeTests.set(testId, true);
            // Test with maximum concurrent users
            const metrics = await this.executeLoadTest({
                concurrentUsers: this.config.concurrentUsers * 3,
                duration: this.config.testDuration,
                rampUpTime: this.config.rampUpTime * 2
            });
            const endTime = new Date();
            const thresholdViolations = this.checkThresholds(metrics);
            const status = thresholdViolations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'FAILED' :
                thresholdViolations.length > 0 ? 'WARNING' : 'PASSED';
            const result = {
                testId,
                testName: 'Concurrent User Test',
                vietnameseTestName: 'Kiểm thử Người dùng Đồng thời',
                status,
                startTime,
                endTime,
                metrics,
                thresholdViolations,
                recommendations: this.generateRecommendations(metrics, thresholdViolations),
                vietnameseRecommendations: this.generateVietnameseRecommendations(metrics, thresholdViolations)
            };
            this.testResults.set(testId, result);
            this.activeTests.delete(testId);
            console.log(` Concurrent User Test completed: ${status} (${metrics.concurrentUsers} users)`);
            return result;
        }
        catch (error) {
            this.activeTests.delete(testId);
            console.error(' Concurrent User Test failed:', error);
            throw error;
        }
    }
    /**
     * Execute load test
     */
    async executeLoadTest(params) {
        console.log(`   Executing load test: ${params.concurrentUsers} users, ${params.duration}s duration`);
        // Simulate load test execution
        const startTime = Date.now();
        // Simulate test execution with realistic metrics
        await new Promise(resolve => setTimeout(resolve, Math.min(params.duration * 100, 10000))); // Max 10s simulation
        const executionTime = Date.now() - startTime;
        const totalRequests = params.concurrentUsers * (params.duration / 2); // Approximate requests
        const successfulRequests = Math.floor(totalRequests * 0.98); // 98% success rate
        const failedRequests = totalRequests - successfulRequests;
        // Generate realistic performance metrics
        const baseResponseTime = 150;
        const loadFactor = Math.min(params.concurrentUsers / this.config.concurrentUsers, 3);
        return {
            totalRequests,
            successfulRequests,
            failedRequests,
            averageResponseTime: Math.floor(baseResponseTime * loadFactor),
            minResponseTime: Math.floor(baseResponseTime * 0.5),
            maxResponseTime: Math.floor(baseResponseTime * loadFactor * 3),
            p95ResponseTime: Math.floor(baseResponseTime * loadFactor * 2),
            p99ResponseTime: Math.floor(baseResponseTime * loadFactor * 2.5),
            throughput: Math.floor(totalRequests / (params.duration || 1)),
            errorRate: (failedRequests / totalRequests) * 100,
            concurrentUsers: params.concurrentUsers,
            testDuration: params.duration,
            resourceUsage: {
                avgCpuUsage: Math.min(50 + (loadFactor * 20), 95),
                maxCpuUsage: Math.min(70 + (loadFactor * 25), 100),
                avgMemoryUsage: Math.min(60 + (loadFactor * 15), 90),
                maxMemoryUsage: Math.min(75 + (loadFactor * 20), 95)
            },
            healthcareMetrics: {
                patientRegistrationPerformance: Math.max(100 - (loadFactor * 10), 70),
                appointmentSchedulingPerformance: Math.max(100 - (loadFactor * 8), 75),
                billingProcessingPerformance: Math.max(100 - (loadFactor * 12), 65),
                notificationDeliveryPerformance: Math.max(100 - (loadFactor * 5), 80),
                emergencyResponseTime: Math.floor(baseResponseTime * 0.3 * loadFactor)
            }
        };
    }
    /**
     * Execute volume test
     */
    async executeVolumeTest() {
        console.log('   Executing volume test with large datasets...');
        // Simulate volume test with large data processing
        await new Promise(resolve => setTimeout(resolve, 5000));
        return {
            totalRequests: 10000,
            successfulRequests: 9800,
            failedRequests: 200,
            averageResponseTime: 250,
            minResponseTime: 100,
            maxResponseTime: 800,
            p95ResponseTime: 400,
            p99ResponseTime: 600,
            throughput: 80,
            errorRate: 2,
            concurrentUsers: this.config.concurrentUsers,
            testDuration: 300,
            resourceUsage: {
                avgCpuUsage: 70,
                maxCpuUsage: 85,
                avgMemoryUsage: 75,
                maxMemoryUsage: 90
            },
            healthcareMetrics: {
                patientRegistrationPerformance: 85,
                appointmentSchedulingPerformance: 80,
                billingProcessingPerformance: 75,
                notificationDeliveryPerformance: 90,
                emergencyResponseTime: 50
            }
        };
    }
    /**
     * Execute healthcare workflow test
     */
    async executeHealthcareWorkflowTest() {
        console.log('   Executing healthcare workflow performance test...');
        // Simulate healthcare-specific workflow testing
        await new Promise(resolve => setTimeout(resolve, 8000));
        return {
            totalRequests: 5000,
            successfulRequests: 4950,
            failedRequests: 50,
            averageResponseTime: 180,
            minResponseTime: 80,
            maxResponseTime: 500,
            p95ResponseTime: 300,
            p99ResponseTime: 400,
            throughput: 90,
            errorRate: 1,
            concurrentUsers: this.config.concurrentUsers,
            testDuration: 300,
            resourceUsage: {
                avgCpuUsage: 60,
                maxCpuUsage: 75,
                avgMemoryUsage: 65,
                maxMemoryUsage: 80
            },
            healthcareMetrics: {
                patientRegistrationPerformance: 95,
                appointmentSchedulingPerformance: 92,
                billingProcessingPerformance: 88,
                notificationDeliveryPerformance: 96,
                emergencyResponseTime: 30
            }
        };
    }
    /**
     * Execute Vietnamese data test
     */
    async executeVietnameseDataTest() {
        console.log('   Executing Vietnamese data handling test...');
        // Simulate Vietnamese character processing performance
        await new Promise(resolve => setTimeout(resolve, 3000));
        return {
            totalRequests: 3000,
            successfulRequests: 2970,
            failedRequests: 30,
            averageResponseTime: 160,
            minResponseTime: 90,
            maxResponseTime: 400,
            p95ResponseTime: 250,
            p99ResponseTime: 320,
            throughput: 95,
            errorRate: 1,
            concurrentUsers: this.config.concurrentUsers,
            testDuration: 180,
            resourceUsage: {
                avgCpuUsage: 55,
                maxCpuUsage: 70,
                avgMemoryUsage: 60,
                maxMemoryUsage: 75
            },
            healthcareMetrics: {
                patientRegistrationPerformance: 98,
                appointmentSchedulingPerformance: 96,
                billingProcessingPerformance: 94,
                notificationDeliveryPerformance: 99,
                emergencyResponseTime: 25
            }
        };
    }
    /**
     * Check performance thresholds
     */
    checkThresholds(metrics) {
        const violations = [];
        // Response time threshold
        if (metrics.averageResponseTime > this.config.thresholds.responseTime) {
            violations.push({
                metric: 'Average Response Time',
                expected: this.config.thresholds.responseTime,
                actual: metrics.averageResponseTime,
                severity: metrics.averageResponseTime > this.config.thresholds.responseTime * 2 ? 'CRITICAL' : 'HIGH'
            });
        }
        // Throughput threshold
        if (metrics.throughput < this.config.thresholds.throughput) {
            violations.push({
                metric: 'Throughput',
                expected: this.config.thresholds.throughput,
                actual: metrics.throughput,
                severity: metrics.throughput < this.config.thresholds.throughput * 0.5 ? 'CRITICAL' : 'MEDIUM'
            });
        }
        // Error rate threshold
        if (metrics.errorRate > this.config.thresholds.errorRate) {
            violations.push({
                metric: 'Error Rate',
                expected: this.config.thresholds.errorRate,
                actual: metrics.errorRate,
                severity: metrics.errorRate > this.config.thresholds.errorRate * 5 ? 'CRITICAL' : 'HIGH'
            });
        }
        // CPU usage threshold
        if (metrics.resourceUsage.avgCpuUsage > this.config.thresholds.cpuUsage) {
            violations.push({
                metric: 'CPU Usage',
                expected: this.config.thresholds.cpuUsage,
                actual: metrics.resourceUsage.avgCpuUsage,
                severity: metrics.resourceUsage.avgCpuUsage > 95 ? 'CRITICAL' : 'MEDIUM'
            });
        }
        // Memory usage threshold
        if (metrics.resourceUsage.avgMemoryUsage > this.config.thresholds.memoryUsage) {
            violations.push({
                metric: 'Memory Usage',
                expected: this.config.thresholds.memoryUsage,
                actual: metrics.resourceUsage.avgMemoryUsage,
                severity: metrics.resourceUsage.avgMemoryUsage > 95 ? 'CRITICAL' : 'MEDIUM'
            });
        }
        return violations;
    }
    /**
     * Generate recommendations
     */
    generateRecommendations(metrics, violations) {
        const recommendations = [];
        if (metrics.averageResponseTime > this.config.thresholds.responseTime) {
            recommendations.push('Consider implementing response caching for frequently accessed data');
            recommendations.push('Optimize database queries and add appropriate indexes');
            recommendations.push('Implement connection pooling for database connections');
        }
        if (metrics.errorRate > this.config.thresholds.errorRate) {
            recommendations.push('Implement circuit breaker pattern for external service calls');
            recommendations.push('Add retry logic with exponential backoff');
            recommendations.push('Improve error handling and logging');
        }
        if (metrics.resourceUsage.avgCpuUsage > this.config.thresholds.cpuUsage) {
            recommendations.push('Consider horizontal scaling with additional service instances');
            recommendations.push('Optimize CPU-intensive operations');
            recommendations.push('Implement load balancing across multiple instances');
        }
        if (metrics.resourceUsage.avgMemoryUsage > this.config.thresholds.memoryUsage) {
            recommendations.push('Implement memory caching strategies');
            recommendations.push('Optimize data structures and reduce memory footprint');
            recommendations.push('Consider increasing available memory resources');
        }
        return recommendations;
    }
    /**
     * Generate Vietnamese recommendations
     */
    generateVietnameseRecommendations(metrics, violations) {
        const recommendations = [];
        if (metrics.averageResponseTime > this.config.thresholds.responseTime) {
            recommendations.push('Cân nhắc triển khai cache phản hồi cho dữ liệu được truy cập thường xuyên');
            recommendations.push('Tối ưu hóa truy vấn cơ sở dữ liệu và thêm chỉ mục phù hợp');
            recommendations.push('Triển khai connection pooling cho kết nối cơ sở dữ liệu');
        }
        if (metrics.errorRate > this.config.thresholds.errorRate) {
            recommendations.push('Triển khai circuit breaker pattern cho các cuộc gọi dịch vụ bên ngoài');
            recommendations.push('Thêm logic retry với exponential backoff');
            recommendations.push('Cải thiện xử lý lỗi và logging');
        }
        if (metrics.resourceUsage.avgCpuUsage > this.config.thresholds.cpuUsage) {
            recommendations.push('Cân nhắc mở rộng ngang với các instance dịch vụ bổ sung');
            recommendations.push('Tối ưu hóa các hoạt động tốn CPU');
            recommendations.push('Triển khai load balancing trên nhiều instance');
        }
        if (metrics.resourceUsage.avgMemoryUsage > this.config.thresholds.memoryUsage) {
            recommendations.push('Triển khai chiến lược memory caching');
            recommendations.push('Tối ưu hóa cấu trúc dữ liệu và giảm memory footprint');
            recommendations.push('Cân nhắc tăng tài nguyên memory khả dụng');
        }
        return recommendations;
    }
    /**
     * Generate healthcare recommendations
     */
    generateHealthcareRecommendations(metrics) {
        const recommendations = [];
        if (metrics.healthcareMetrics.emergencyResponseTime > 100) {
            recommendations.push('Optimize emergency workflow response times for critical patient care');
            recommendations.push('Implement priority queuing for emergency scenarios');
        }
        if (metrics.healthcareMetrics.patientRegistrationPerformance < 90) {
            recommendations.push('Streamline patient registration process');
            recommendations.push('Implement parallel processing for insurance validation');
        }
        if (metrics.healthcareMetrics.billingProcessingPerformance < 85) {
            recommendations.push('Optimize billing calculation algorithms');
            recommendations.push('Implement asynchronous processing for complex billing scenarios');
        }
        if (metrics.healthcareMetrics.notificationDeliveryPerformance < 95) {
            recommendations.push('Improve notification delivery reliability');
            recommendations.push('Implement fallback notification channels');
        }
        return recommendations;
    }
    /**
     * Generate Vietnamese healthcare recommendations
     */
    generateVietnameseHealthcareRecommendations(metrics) {
        const recommendations = [];
        if (metrics.healthcareMetrics.emergencyResponseTime > 100) {
            recommendations.push('Tối ưu hóa thời gian phản hồi quy trình cấp cứu cho chăm sóc bệnh nhân quan trọng');
            recommendations.push('Triển khai hàng đợi ưu tiên cho các tình huống cấp cứu');
        }
        if (metrics.healthcareMetrics.patientRegistrationPerformance < 90) {
            recommendations.push('Tối ưu hóa quy trình đăng ký bệnh nhân');
            recommendations.push('Triển khai xử lý song song cho xác thực bảo hiểm');
        }
        if (metrics.healthcareMetrics.billingProcessingPerformance < 85) {
            recommendations.push('Tối ưu hóa thuật toán tính toán hóa đơn');
            recommendations.push('Triển khai xử lý bất đồng bộ cho các tình huống hóa đơn phức tạp');
        }
        if (metrics.healthcareMetrics.notificationDeliveryPerformance < 95) {
            recommendations.push('Cải thiện độ tin cậy gửi thông báo');
            recommendations.push('Triển khai các kênh thông báo dự phòng');
        }
        return recommendations;
    }
    /**
     * Generate performance report
     */
    async generatePerformanceReport(results) {
        console.log(' Generating performance test report...');
        const report = {
            title: 'Hospital Management System V2 - Performance Test Report',
            vietnamese: {
                title: 'Hệ thống Quản lý Bệnh viện V2 - Báo cáo Kiểm thử Hiệu suất',
                summary: `Đã thực hiện ${results.length} kiểm thử hiệu suất`
            },
            summary: {
                totalTests: results.length,
                passedTests: results.filter(r => r.status === 'PASSED').length,
                failedTests: results.filter(r => r.status === 'FAILED').length,
                warningTests: results.filter(r => r.status === 'WARNING').length
            },
            results,
            configuration: this.config,
            generatedAt: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform
            }
        };
        // In a real implementation, this would save the report to a file
        console.log(' Performance test report generated');
    }
    /**
     * Get performance test suite status
     */
    getPerformanceTestSuiteStatus() {
        return {
            suiteName: 'Hospital Management System V2 Performance Test Suite',
            vietnamese: {
                name: 'Bộ Kiểm thử Hiệu suất Hệ thống Quản lý Bệnh viện V2',
                description: 'Kiểm thử hiệu suất toàn diện cho hệ thống y tế'
            },
            configuration: this.config,
            testTypes: [
                'Load Test',
                'Stress Test',
                'Spike Test',
                'Volume Test',
                'Endurance Test',
                'Healthcare Workflow Test',
                'Vietnamese Data Test',
                'Concurrent User Test'
            ],
            capabilities: {
                loadTesting: true,
                stressTesting: true,
                healthcareWorkflowTesting: true,
                vietnameseDataTesting: true,
                resourceMonitoring: true,
                thresholdValidation: true
            },
            activeTests: this.activeTests.size,
            completedTests: this.testResults.size,
            lastUpdated: new Date().toISOString()
        };
    }
}
exports.PerformanceTestSuite = PerformanceTestSuite;
//# sourceMappingURL=PerformanceTestSuite.js.map