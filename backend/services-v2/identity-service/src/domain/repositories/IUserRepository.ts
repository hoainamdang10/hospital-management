/**
 * User Repository Interface
 * Clean Architecture - Repository Pattern
 * Schema: auth_schema
 */

import { User } from '../aggregates/User';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { HealthcareRole } from '../entities/HealthcareRole';

export interface IUserRepository {
  // Basic CRUD operations
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  delete(id: UserId): Promise<void>;
  exists(id: UserId): Promise<boolean>;

  // Query operations
  findByRole(role: HealthcareRole): Promise<User[]>;
  findActiveUsers(): Promise<User[]>;
  findInactiveUsers(): Promise<User[]>;
  findUnverifiedUsers(): Promise<User[]>;
  
  // Search operations
  searchByName(name: string): Promise<User[]>;
  searchByPhoneNumber(phoneNumber: string): Promise<User[]>;
  findByNationalId(nationalId: string): Promise<User | null>;

  // Pagination
  findAll(page: number, limit: number): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  // Healthcare-specific queries
  findDoctors(): Promise<User[]>;
  findNurses(): Promise<User[]>;
  findPatients(): Promise<User[]>;
  findAdministrators(): Promise<User[]>;
  findReceptionists(): Promise<User[]>;

  // Statistics
  countByRole(role: HealthcareRole): Promise<number>;
  countActiveUsers(): Promise<number>;
  countInactiveUsers(): Promise<number>;
  getRegistrationStats(startDate: Date, endDate: Date): Promise<{
    total: number;
    byRole: Record<string, number>;
    byDay: Record<string, number>;
  }>;

  // Audit and compliance
  findUsersWithLastLogin(days: number): Promise<User[]>;
  findUsersWithoutLogin(days: number): Promise<User[]>;
  findExpiredAccounts(): Promise<User[]>;

  // Bulk operations
  saveMany(users: User[]): Promise<void>;
  updateMany(userIds: UserId[], updates: Partial<User>): Promise<void>;
  deactivateMany(userIds: UserId[]): Promise<void>;
  activateMany(userIds: UserId[]): Promise<void>;
}
