export interface UserResponse {
    user?: any;
    users?: any[];
    pagination?: any;
    error?: string;
}
export interface GetUsersOptions {
    page: number;
    limit: number;
    role?: string;
    search?: string;
}
export declare class UserService {
    getUserProfile(userId: string): Promise<UserResponse>;
    updateUserProfile(userId: string, updateData: any): Promise<UserResponse>;
    getAllUsers(options: GetUsersOptions): Promise<UserResponse>;
    updateUserStatus(userId: string, isActive: boolean): Promise<UserResponse>;
    updateUserRole(userId: string, newRole: string): Promise<UserResponse>;
    deleteUser(userId: string): Promise<UserResponse>;
    private getRoleSpecificData;
    private handleRoleChange;
    private cleanupRoleSpecificRecords;
    private createDoctorRecord;
    private createPatientRecord;
    private createAdminRecord;
}
//# sourceMappingURL=user.service.d.ts.map