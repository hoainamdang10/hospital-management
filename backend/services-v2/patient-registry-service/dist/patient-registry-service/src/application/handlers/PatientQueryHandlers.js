"use strict";
/**
 * PatientQueryHandlers - Application Query Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS Query handlers for patient registry read operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientQueryHandlers = void 0;
const STAT_FETCH_BATCH_SIZE = 500;
/**
 * Patient Query Handlers
 * Handles all patient-related queries with proper authorization and data masking
 */
class PatientQueryHandlers {
    constructor(getPatientProfileUseCase, searchPatientsUseCase, patientRepository, logger) {
        this.getPatientProfileUseCase = getPatientProfileUseCase;
        this.searchPatientsUseCase = searchPatientsUseCase;
        this.patientRepository = patientRepository;
        this.logger = logger;
    }
    /**
     * Handle GetPatientProfile query
     */
    async handleGetPatientProfile(query) {
        try {
            this.logger.info('Processing GetPatientProfile query', {
                queryId: query.queryId,
                requestedBy: query.requestedBy,
                patientId: query.data.patientId,
                userId: query.data.userId,
                nationalId: query.data.nationalId,
                bhytNumber: query.data.bhytNumber
            });
            if (!this.isValidGetPatientProfileQuery(query)) {
                return {
                    success: false,
                    message: 'Cấu trúc truy vấn thông tin bệnh nhân không hợp lệ'
                };
            }
            const result = await this.getPatientProfileUseCase.execute(query.data);
            this.logger.info('GetPatientProfile query processed', {
                queryId: query.queryId,
                success: result.success,
                patientId: query.data.patientId,
                userId: query.data.userId
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing GetPatientProfile query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi truy vấn thông tin bệnh nhân'
            };
        }
    }
    /**
     * Handle GetPatientList query
     */
    async handleGetPatientList(query) {
        try {
            this.logger.info('Processing GetPatientList query', {
                queryId: query.queryId,
                requestedBy: query.requestedBy,
                requestedByRole: query.data.requestedByRole
            });
            if (!this.isValidGetPatientListQuery(query)) {
                return {
                    success: false,
                    message: 'Cấu trúc truy vấn danh sách bệnh nhân không hợp lệ'
                };
            }
            if (!this.isAuthorizedForPatientList(query.data.requestedByRole)) {
                return {
                    success: false,
                    message: 'Không có quyền truy cập danh sách bệnh nhân'
                };
            }
            const page = query.data.pagination?.page ?? 1;
            const limit = query.data.pagination?.limit ?? 20;
            const filters = query.data.filters ?? {};
            const repositoryResult = await this.patientRepository.findWithFilters({
                isActive: filters.isActive,
                registrationDateFrom: filters.registrationDateFrom,
                registrationDateTo: filters.registrationDateTo,
                city: filters.city,
                province: filters.province,
                hasInsurance: filters.hasInsurance
            }, {
                page,
                limit,
                sorting: query.data.sorting
            });
            const patientSummaries = repositoryResult.patients.map(patient => this.mapToSummary(patient));
            const totalPages = this.calculateTotalPages(repositoryResult.total, limit);
            const result = {
                success: true,
                message: 'Lấy danh sách bệnh nhân thành công',
                data: {
                    patients: patientSummaries,
                    pagination: {
                        page,
                        limit,
                        total: repositoryResult.total,
                        totalPages
                    }
                }
            };
            this.logger.info('GetPatientList query processed', {
                queryId: query.queryId,
                success: true,
                totalPatients: repositoryResult.total
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing GetPatientList query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi truy vấn danh sách bệnh nhân'
            };
        }
    }
    /**
     * Handle SearchPatients query
     */
    async handleSearchPatients(query) {
        try {
            this.logger.info('Processing SearchPatients query', {
                queryId: query.queryId,
                requestedBy: query.requestedBy,
                searchTerm: query.data.searchTerm
            });
            if (!this.isValidSearchPatientsQuery(query)) {
                return {
                    success: false,
                    message: 'Cấu trúc tìm kiếm bệnh nhân không hợp lệ'
                };
            }
            if (!this.isAuthorizedForPatientSearch(query.data.requestedByRole)) {
                return {
                    success: false,
                    message: 'Không có quyền tìm kiếm bệnh nhân'
                };
            }
            const page = query.data.pagination?.page ?? 1;
            const limit = query.data.pagination?.limit ?? 20;
            const request = {
                searchTerm: query.data.searchTerm,
                filters: {
                    isActive: query.data.filters?.isActive,
                    hasInsurance: query.data.filters?.hasInsurance
                },
                pagination: {
                    page,
                    limit
                },
                requestedBy: query.data.requestedBy
            };
            const useCaseResult = await this.searchPatientsUseCase.execute(request);
            if (!useCaseResult.success || !useCaseResult.data) {
                return {
                    success: false,
                    message: useCaseResult.message || 'Không thể tìm kiếm bệnh nhân'
                };
            }
            const patients = useCaseResult.data.patients.map(patient => ({
                patientId: patient.patientId,
                userId: patient.userId,
                fullName: patient.fullName,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                nationalId: patient.nationalId,
                primaryPhone: patient.primaryPhone,
                email: patient.email,
                city: patient.city,
                province: patient.province,
                status: patient.status,
                hasInsurance: patient.hasInsurance,
                createdAt: patient.createdAt,
                updatedAt: patient.updatedAt
            }));
            const result = {
                success: true,
                message: useCaseResult.message,
                data: {
                    patients,
                    searchTerm: query.data.searchTerm,
                    totalResults: useCaseResult.data.pagination.total,
                    pagination: {
                        page: useCaseResult.data.pagination.page,
                        limit: useCaseResult.data.pagination.limit,
                        total: useCaseResult.data.pagination.total,
                        totalPages: useCaseResult.data.pagination.totalPages
                    }
                }
            };
            this.logger.info('SearchPatients query processed', {
                queryId: query.queryId,
                success: true,
                totalResults: result.data.totalResults
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing SearchPatients query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi tìm kiếm bệnh nhân'
            };
        }
    }
    /**
     * Handle GetPatientStatistics query
     */
    async handleGetPatientStatistics(query) {
        try {
            this.logger.info('Processing GetPatientStatistics query', {
                queryId: query.queryId,
                requestedBy: query.requestedBy,
                requestedByRole: query.data.requestedByRole
            });
            if (!this.isValidGetPatientStatisticsQuery(query)) {
                return {
                    success: false,
                    message: 'Cấu trúc truy vấn thống kê bệnh nhân không hợp lệ'
                };
            }
            if (!this.isAuthorizedForPatientStatistics(query.data.requestedByRole)) {
                return {
                    success: false,
                    message: 'Không có quyền truy cập thống kê bệnh nhân'
                };
            }
            const baseFilters = {
                registrationDateFrom: query.data.dateRange?.from,
                registrationDateTo: query.data.dateRange?.to
            };
            const { patients: allPatients, total: totalPatients } = await this.collectAllPatients(baseFilters);
            const activePatients = allPatients.filter(patient => patient.isActive()).length;
            const patientsWithInsurance = allPatients.filter(patient => patient.hasValidInsurance()).length;
            const newRegistrations = this.calculateNewRegistrations(allPatients, query.data.dateRange);
            const groupBy = query.data.groupBy ?? 'month';
            const registrationTrend = this.buildRegistrationTrend(allPatients, groupBy);
            const demographicBreakdown = this.buildDemographicBreakdown(allPatients);
            const result = {
                success: true,
                message: 'Lấy thống kê bệnh nhân thành công',
                data: {
                    totalPatients,
                    activePatients,
                    newRegistrations,
                    patientsWithInsurance,
                    registrationTrend,
                    demographicBreakdown
                }
            };
            this.logger.info('GetPatientStatistics query processed', {
                queryId: query.queryId,
                success: true,
                totalPatients
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing GetPatientStatistics query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi truy vấn thống kê bệnh nhân'
            };
        }
    }
    /**
     * Generic query handler dispatcher
     */
    async handleQuery(query) {
        switch (query.queryType) {
            case 'GetPatientProfile':
                return this.handleGetPatientProfile(query);
            case 'GetPatientList':
                return this.handleGetPatientList(query);
            case 'SearchPatients':
                return this.handleSearchPatients(query);
            case 'GetPatientStatistics':
                return this.handleGetPatientStatistics(query);
            default:
                this.logger.warn('Unknown query type');
                return {
                    success: false,
                    message: 'Loại truy vấn không được hỗ trợ'
                };
        }
    }
    // Query validation methods
    isValidGetPatientProfileQuery(query) {
        return !!(query.queryId &&
            query.queryType === 'GetPatientProfile' &&
            query.data &&
            (query.data.patientId || query.data.userId || query.data.nationalId || query.data.bhytNumber) &&
            query.data.requestedBy);
    }
    isValidGetPatientListQuery(query) {
        return !!(query.queryId &&
            query.queryType === 'GetPatientList' &&
            query.data &&
            query.data.requestedBy &&
            query.data.requestedByRole);
    }
    isValidSearchPatientsQuery(query) {
        return !!(query.queryId &&
            query.queryType === 'SearchPatients' &&
            query.data &&
            query.data.searchTerm &&
            query.data.requestedBy &&
            query.data.requestedByRole);
    }
    isValidGetPatientStatisticsQuery(query) {
        return !!(query.queryId &&
            query.queryType === 'GetPatientStatistics' &&
            query.data &&
            query.data.requestedBy &&
            query.data.requestedByRole);
    }
    // Authorization methods
    isAuthorizedForPatientList(role) {
        return ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);
    }
    isAuthorizedForPatientSearch(role) {
        return ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);
    }
    isAuthorizedForPatientStatistics(role) {
        return ['admin', 'doctor'].includes(role);
    }
    /**
     * Get handler status for health checks
     */
    getStatus() {
        return {
            handlerName: 'PatientQueryHandlers',
            supportedQueries: [
                'GetPatientProfile',
                'GetPatientList',
                'SearchPatients',
                'GetPatientStatistics'
            ],
            isHealthy: true,
            lastProcessedAt: new Date().toISOString()
        };
    }
    async collectAllPatients(filters) {
        const batchSize = STAT_FETCH_BATCH_SIZE;
        if (batchSize <= 0) {
            return { patients: [], total: 0 };
        }
        const collected = [];
        let total = 0;
        let page = 1;
        let hasMorePatients = true;
        while (hasMorePatients) {
            const { patients, total: batchTotal } = await this.patientRepository.findWithFilters(filters, {
                page,
                limit: batchSize,
                sorting: { field: 'created_at', direction: 'asc' }
            });
            if (page === 1) {
                total = batchTotal;
            }
            if (patients.length === 0) {
                hasMorePatients = false;
                break;
            }
            collected.push(...patients);
            page += 1;
        }
        return { patients: collected, total };
    }
    calculateNewRegistrations(patients, dateRange) {
        if (patients.length === 0) {
            return 0;
        }
        if ((dateRange?.from) || (dateRange?.to)) {
            const fromDate = dateRange?.from ? new Date(dateRange.from) : undefined;
            const toDate = dateRange?.to ? new Date(dateRange.to) : undefined;
            return patients.filter(patient => {
                const createdAt = patient.getProps().createdAt;
                if (fromDate && createdAt < fromDate) {
                    return false;
                }
                if (toDate && createdAt > toDate) {
                    return false;
                }
                return true;
            }).length;
        }
        const rollingWindowStart = new Date();
        rollingWindowStart.setDate(rollingWindowStart.getDate() - 30);
        return patients.filter(patient => patient.getProps().createdAt >= rollingWindowStart).length;
    }
    mapToSummary(patient) {
        const personalInfo = patient.getPersonalInfo();
        const contactInfo = patient.getContactInfo();
        return {
            patientId: patient.getPatientId() || '',
            userId: patient.getUserId(),
            fullName: personalInfo.fullName,
            dateOfBirth: personalInfo.dateOfBirth.toISOString(),
            gender: personalInfo.gender,
            nationalId: personalInfo.nationalId,
            primaryPhone: contactInfo.primaryPhone,
            email: contactInfo.email,
            city: contactInfo.address.city,
            province: contactInfo.address.province,
            status: patient.getStatus(),
            hasInsurance: patient.hasValidInsurance(),
            createdAt: patient.getProps().createdAt.toISOString(),
            updatedAt: patient.getProps().updatedAt.toISOString()
        };
    }
    calculateTotalPages(total, limit) {
        if (limit <= 0) {
            return 0;
        }
        if (total === 0) {
            return 0;
        }
        return Math.ceil(total / limit);
    }
    buildRegistrationTrend(patients, groupBy) {
        const buckets = new Map();
        for (const patient of patients) {
            const createdAt = patient.getProps().createdAt;
            const key = this.buildTrendKey(createdAt, groupBy);
            buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }
        return Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, count]) => ({ period, count }));
    }
    buildTrendKey(date, groupBy) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        switch (groupBy) {
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week': {
                const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
                const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
                const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getUTCDay() + 1) / 7);
                return `${year}-W${String(weekNumber).padStart(2, '0')}`;
            }
            case 'year':
                return `${year}`;
            case 'month':
            default:
                return `${year}-${month}`;
        }
    }
    buildDemographicBreakdown(patients) {
        const byGender = { male: 0, female: 0, other: 0 };
        const ageGroupCounts = {
            '0-18': 0,
            '19-35': 0,
            '36-60': 0,
            '60+': 0
        };
        const byProvince = {};
        for (const patient of patients) {
            const personalInfo = patient.getPersonalInfo();
            const contactInfo = patient.getContactInfo();
            switch (personalInfo.gender) {
                case 'male':
                    byGender.male++;
                    break;
                case 'female':
                    byGender.female++;
                    break;
                default:
                    byGender.other++;
            }
            const ageGroup = this.resolveAgeGroup(personalInfo.dateOfBirth);
            ageGroupCounts[ageGroup]++;
            const province = contactInfo.address.province || 'Không xác định';
            byProvince[province] = (byProvince[province] ?? 0) + 1;
        }
        return {
            byGender,
            byAgeGroup: ageGroupCounts,
            byProvince
        };
    }
    resolveAgeGroup(dateOfBirth) {
        const age = this.calculateAge(dateOfBirth);
        if (age <= 18) {
            return '0-18';
        }
        if (age <= 35) {
            return '19-35';
        }
        if (age <= 60) {
            return '36-60';
        }
        return '60+';
    }
    calculateAge(dateOfBirth) {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }
        return age;
    }
}
exports.PatientQueryHandlers = PatientQueryHandlers;
//# sourceMappingURL=PatientQueryHandlers.js.map