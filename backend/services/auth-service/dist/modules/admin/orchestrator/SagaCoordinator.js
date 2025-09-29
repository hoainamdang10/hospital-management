"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaCoordinator = void 0;
class SagaCoordinator {
    constructor(logger, redis, serviceAdapters) {
        this.logger = logger;
        this.redis = redis;
        this.serviceAdapters = serviceAdapters;
        this.sagaDefinitions = new Map();
        this.initializeSagaDefinitions();
    }
    initializeSagaDefinitions() {
        this.sagaDefinitions.set('create_doctor', [
            {
                id: 'validate_department',
                name: 'Validate Department Capacity',
                service: 'auth-service',
                action: 'checkDepartmentCapacity',
                payload: {},
                status: 'pending'
            },
            {
                id: 'create_user_profile',
                name: 'Create User Profile',
                service: 'auth-service',
                action: 'createUser',
                compensationAction: 'deleteUser',
                payload: {},
                status: 'pending'
            },
            {
                id: 'create_doctor_profile',
                name: 'Create Doctor Profile',
                service: 'doctor-service',
                action: 'createDoctor',
                compensationAction: 'deleteDoctor',
                payload: {},
                status: 'pending'
            },
            {
                id: 'update_department_capacity',
                name: 'Update Department Capacity',
                service: 'auth-service',
                action: 'updateDepartmentCapacity',
                compensationAction: 'revertDepartmentCapacity',
                payload: {},
                status: 'pending'
            },
            {
                id: 'send_welcome_notification',
                name: 'Send Welcome Notification',
                service: 'auth-service',
                action: 'sendWelcomeNotification',
                payload: {},
                status: 'pending'
            }
        ]);
        this.sagaDefinitions.set('bulk_user_import', [
            {
                id: 'validate_import_data',
                name: 'Validate Import Data',
                service: 'auth-service',
                action: 'validateBulkData',
                payload: {},
                status: 'pending'
            },
            {
                id: 'create_users_batch',
                name: 'Create Users in Batch',
                service: 'auth-service',
                action: 'createUsersBatch',
                compensationAction: 'deleteUsersBatch',
                payload: {},
                status: 'pending'
            },
            {
                id: 'create_profiles_batch',
                name: 'Create Role Profiles in Batch',
                service: 'multiple',
                action: 'createProfilesBatch',
                compensationAction: 'deleteProfilesBatch',
                payload: {},
                status: 'pending'
            },
            {
                id: 'send_import_report',
                name: 'Send Import Completion Report',
                service: 'auth-service',
                action: 'sendImportReport',
                payload: {},
                status: 'pending'
            }
        ]);
        this.sagaDefinitions.set('system_maintenance', [
            {
                id: 'notify_maintenance_start',
                name: 'Notify Maintenance Start',
                service: 'auth-service',
                action: 'sendMaintenanceNotification',
                payload: {},
                status: 'pending'
            },
            {
                id: 'backup_critical_data',
                name: 'Backup Critical Data',
                service: 'file-service',
                action: 'createSystemBackup',
                payload: {},
                status: 'pending'
            },
            {
                id: 'perform_maintenance_tasks',
                name: 'Perform Maintenance Tasks',
                service: 'auth-service',
                action: 'performMaintenanceTasks',
                compensationAction: 'rollbackMaintenanceTasks',
                payload: {},
                status: 'pending'
            },
            {
                id: 'verify_system_health',
                name: 'Verify System Health',
                service: 'multiple',
                action: 'verifySystemHealth',
                payload: {},
                status: 'pending'
            },
            {
                id: 'notify_maintenance_complete',
                name: 'Notify Maintenance Complete',
                service: 'auth-service',
                action: 'sendMaintenanceCompleteNotification',
                payload: {},
                status: 'pending'
            }
        ]);
        this.sagaDefinitions.set('cross_service_sync', [
            {
                id: 'sync_user_profiles',
                name: 'Sync User Profiles',
                service: 'auth-service',
                action: 'syncUserProfiles',
                payload: {},
                status: 'pending'
            },
            {
                id: 'sync_doctor_data',
                name: 'Sync Doctor Data',
                service: 'doctor-service',
                action: 'syncDoctorData',
                payload: {},
                status: 'pending'
            },
            {
                id: 'sync_patient_data',
                name: 'Sync Patient Data',
                service: 'patient-service',
                action: 'syncPatientData',
                payload: {},
                status: 'pending'
            },
            {
                id: 'sync_appointment_data',
                name: 'Sync Appointment Data',
                service: 'appointment-service',
                action: 'syncAppointmentData',
                payload: {},
                status: 'pending'
            },
            {
                id: 'verify_data_consistency',
                name: 'Verify Data Consistency',
                service: 'multiple',
                action: 'verifyDataConsistency',
                payload: {},
                status: 'pending'
            }
        ]);
        this.logger.info('Saga definitions initialized', {
            sagaTypes: Array.from(this.sagaDefinitions.keys()),
            totalDefinitions: this.sagaDefinitions.size
        });
    }
    async createSaga(type, metadata) {
        const sagaId = `saga_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const stepTemplate = this.sagaDefinitions.get(type);
        if (!stepTemplate) {
            throw new Error(`Unknown saga type: ${type}`);
        }
        const steps = stepTemplate.map(step => ({
            ...step,
            id: `${sagaId}_${step.id}`,
            payload: this.populateStepPayload(step, metadata)
        }));
        const saga = {
            id: sagaId,
            type,
            status: 'running',
            steps,
            createdAt: new Date(),
            metadata
        };
        await this.storeSaga(saga);
        this.logger.info('Saga created', { sagaId, type, stepsCount: steps.length });
        return saga;
    }
    async executeSaga(sagaId) {
        const saga = await this.getSaga(sagaId);
        if (!saga) {
            throw new Error(`Saga not found: ${sagaId}`);
        }
        this.logger.info('Executing saga', { sagaId, type: saga.type });
        try {
            for (const step of saga.steps) {
                if (step.status === 'completed') {
                    continue;
                }
                await this.executeStep(saga, step);
                await this.storeSaga(saga);
            }
            saga.status = 'completed';
            saga.completedAt = new Date();
            await this.storeSaga(saga);
            this.logger.info('Saga completed successfully', { sagaId });
        }
        catch (error) {
            this.logger.error('Saga execution failed', { sagaId, error: error.message });
            await this.compensateSaga(sagaId, error.message);
            throw error;
        }
    }
    async executeStep(saga, step) {
        this.logger.debug('Executing saga step', { sagaId: saga.id, stepId: step.id, stepName: step.name });
        step.status = 'pending';
        step.executedAt = new Date();
        try {
            if (step.service === 'multiple') {
                await this.executeMultiServiceStep(saga, step);
            }
            else {
                await this.executeSingleServiceStep(saga, step);
            }
            step.status = 'completed';
            this.logger.debug('Saga step completed', { sagaId: saga.id, stepId: step.id });
        }
        catch (error) {
            step.status = 'failed';
            step.error = error.message;
            this.logger.error('Saga step failed', { sagaId: saga.id, stepId: step.id, error: error.message });
            throw error;
        }
    }
    async executeSingleServiceStep(saga, step) {
        const adapter = this.serviceAdapters.getAdapter(step.service);
        if (!adapter) {
            throw new Error(`Service adapter not found: ${step.service}`);
        }
        await adapter.executeAction(step.action, step.payload, {
            timeout: 30000,
            retries: 2
        });
    }
    async executeMultiServiceStep(saga, step) {
        const adapters = this.serviceAdapters.getAllAdapters();
        switch (step.action) {
            case 'createProfilesBatch':
                await this.executeCreateProfilesBatch(saga, step, adapters);
                break;
            case 'verifySystemHealth':
                await this.executeSystemHealthCheck(saga, step, adapters);
                break;
            case 'verifyDataConsistency':
                await this.executeDataConsistencyCheck(saga, step, adapters);
                break;
            default:
                throw new Error(`Unknown multi-service action: ${step.action}`);
        }
    }
    async executeCreateProfilesBatch(saga, step, adapters) {
        const { users, roles } = step.payload;
        const results = [];
        for (const user of users) {
            const role = user.role;
            let adapter;
            switch (role) {
                case 'doctor':
                    adapter = this.serviceAdapters.getAdapter('doctor-service');
                    break;
                case 'patient':
                    adapter = this.serviceAdapters.getAdapter('patient-service');
                    break;
                default:
                    continue;
            }
            if (adapter) {
                try {
                    const result = await adapter.executeAction('createProfile', user);
                    results.push({ userId: user.id, role, success: true, result });
                }
                catch (error) {
                    results.push({ userId: user.id, role, success: false, error: error.message });
                }
            }
        }
        step.payload.results = results;
    }
    async executeSystemHealthCheck(saga, step, adapters) {
        const healthResults = await this.serviceAdapters.healthCheckAll();
        const unhealthyServices = Object.entries(healthResults)
            .filter(([_, isHealthy]) => !isHealthy)
            .map(([serviceName]) => serviceName);
        if (unhealthyServices.length > 0) {
            throw new Error(`Unhealthy services detected: ${unhealthyServices.join(', ')}`);
        }
        step.payload.healthResults = healthResults;
    }
    async executeDataConsistencyCheck(saga, step, adapters) {
        step.payload.consistencyResults = {
            checked: true,
            timestamp: new Date(),
            issues: []
        };
    }
    async compensateSaga(sagaId, reason) {
        const saga = await this.getSaga(sagaId);
        if (!saga) {
            throw new Error(`Saga not found: ${sagaId}`);
        }
        this.logger.info('Starting saga compensation', { sagaId, reason });
        saga.status = 'compensating';
        await this.storeSaga(saga);
        const completedSteps = saga.steps
            .filter(step => step.status === 'completed')
            .reverse();
        for (const step of completedSteps) {
            if (step.compensationAction) {
                try {
                    await this.executeCompensation(saga, step);
                    step.status = 'compensated';
                }
                catch (error) {
                    this.logger.error('Compensation failed', {
                        sagaId,
                        stepId: step.id,
                        error: error.message
                    });
                }
            }
        }
        saga.status = 'failed';
        saga.completedAt = new Date();
        await this.storeSaga(saga);
        this.logger.info('Saga compensation completed', { sagaId });
    }
    async executeCompensation(saga, step) {
        this.logger.debug('Executing compensation', { sagaId: saga.id, stepId: step.id });
        if (step.service === 'multiple') {
            await this.executeMultiServiceCompensation(saga, step);
        }
        else {
            const adapter = this.serviceAdapters.getAdapter(step.service);
            if (adapter && step.compensationAction) {
                await adapter.executeCompensation(step.compensationAction, step.compensationPayload || step.payload);
            }
        }
    }
    async executeMultiServiceCompensation(saga, step) {
        this.logger.debug('Executing multi-service compensation', { sagaId: saga.id, stepId: step.id });
    }
    populateStepPayload(step, metadata) {
        return {
            ...step.payload,
            ...metadata,
            stepId: step.id,
            timestamp: new Date().toISOString()
        };
    }
    async storeSaga(saga) {
        const key = `saga:${saga.id}`;
        await this.redis.set(key, JSON.stringify(saga), 86400);
    }
    async getSaga(sagaId) {
        const sagaData = await this.redis.get(`saga:${sagaId}`);
        if (!sagaData) {
            return null;
        }
        return JSON.parse(sagaData);
    }
    async getAllSagas() {
        const keys = await this.redis.keys('saga:*');
        const sagas = [];
        for (const key of keys) {
            const sagaData = await this.redis.get(key);
            if (sagaData) {
                sagas.push(JSON.parse(sagaData));
            }
        }
        return sagas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async getSagaStatistics() {
        const keys = await this.redis.keys('saga:*');
        const stats = {
            total: 0,
            running: 0,
            completed: 0,
            failed: 0,
            compensating: 0
        };
        for (const key of keys) {
            const sagaData = await this.redis.get(key);
            if (sagaData) {
                const saga = JSON.parse(sagaData);
                stats.total++;
                stats[saga.status]++;
            }
        }
        return stats;
    }
    async cleanupOldSagas(olderThanDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const keys = await this.redis.keys('saga:*');
        let deletedCount = 0;
        for (const key of keys) {
            const sagaData = await this.redis.get(key);
            if (sagaData) {
                const saga = JSON.parse(sagaData);
                const sagaDate = new Date(saga.completedAt || saga.createdAt);
                if (sagaDate < cutoffDate && saga.status !== 'running') {
                    await this.redis.del(key);
                    deletedCount++;
                }
            }
        }
        this.logger.info('Old sagas cleaned up', { deletedCount, olderThanDays });
        return deletedCount;
    }
}
exports.SagaCoordinator = SagaCoordinator;
//# sourceMappingURL=SagaCoordinator.js.map