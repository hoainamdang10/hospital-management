"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRepository = void 0;
class DoctorRepository {
    async findById(doctor_id) {
        return null;
    }
    async findByProfileId(profileId) {
        return null;
    }
    async findByEmail(email) {
        return null;
    }
    async findAll(limit = 50, offset = 0) {
        return [];
    }
    async findByDepartment(departmentId, limit = 50, offset = 0) {
        return [];
    }
    async findByDepartmentWithCount(departmentId, limit = 20, offset = 0) {
        return { doctors: [], total: 0 };
    }
    async findBySpecialty(specialty, limit = 50, offset = 0) {
        return [];
    }
    async search(query, limit = 50, offset = 0) {
        return [];
    }
    async getSearchCount(query) {
        return 0;
    }
    async create(doctorData) {
        throw new Error('Not implemented');
    }
    async update(doctor_id, doctorData) {
        return null;
    }
    async delete(doctor_id) {
        return false;
    }
    async count() {
        return 0;
    }
    async getDashboardStats(doctor_id) {
        return {};
    }
    async getRecentAppointments(doctor_id, limit = 5) {
        return [];
    }
    async getWeeklyStats(doctor_id) {
        return {};
    }
    async getMonthlyStats(doctor_id) {
        return {};
    }
    async countByDepartment(departmentId) {
        return 0;
    }
    mapSupabaseDoctorToDoctor(supabaseDoctor) {
        return {};
    }
}
exports.DoctorRepository = DoctorRepository;
//# sourceMappingURL=doctor.repository.js.map