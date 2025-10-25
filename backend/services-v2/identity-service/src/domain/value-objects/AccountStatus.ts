/**
 * AccountStatus Value Object
 * Represents the status of a user account
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

export enum AccountStatus {
  ACTIVE = 'active',           // Tài khoản hoạt động bình thường
  LOCKED = 'locked',           // Khóa tạm thời (có thể unlock bởi admin)
  DEACTIVATED = 'deactivated', // Vô hiệu hóa vĩnh viễn (không thể revert)
  SUSPENDED = 'suspended'      // Tạm ngưng (chờ admin review)
}

export class AccountStatusHelper {
  /**
   * Check if status allows activation
   */
  static canActivate(status: AccountStatus): boolean {
    return status === AccountStatus.LOCKED || status === AccountStatus.SUSPENDED;
  }

  /**
   * Check if status is permanent (cannot be changed)
   */
  static isPermanent(status: AccountStatus): boolean {
    return status === AccountStatus.DEACTIVATED;
  }

  /**
   * Get Vietnamese description
   */
  static getDescription(status: AccountStatus): string {
    switch (status) {
      case AccountStatus.ACTIVE:
        return 'Đang hoạt động';
      case AccountStatus.LOCKED:
        return 'Đã khóa tạm thời';
      case AccountStatus.DEACTIVATED:
        return 'Đã vô hiệu hóa vĩnh viễn';
      case AccountStatus.SUSPENDED:
        return 'Tạm ngưng';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Validate status transition
   */
  static canTransition(from: AccountStatus, to: AccountStatus): boolean {
    // Cannot change from DEACTIVATED
    if (from === AccountStatus.DEACTIVATED) {
      return false;
    }

    // Can always deactivate
    if (to === AccountStatus.DEACTIVATED) {
      return true;
    }

    // Can activate from LOCKED or SUSPENDED
    if (to === AccountStatus.ACTIVE) {
      return from === AccountStatus.LOCKED || from === AccountStatus.SUSPENDED;
    }

    // Can lock or suspend from ACTIVE
    if (to === AccountStatus.LOCKED || to === AccountStatus.SUSPENDED) {
      return from === AccountStatus.ACTIVE;
    }

    return false;
  }
}
