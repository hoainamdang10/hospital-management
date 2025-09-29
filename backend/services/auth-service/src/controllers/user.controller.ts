import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserService } from '../services/user.service';
import logger from '@hospital/shared/dist/utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get current user profile
   */
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const result = await this.userService.getUserProfile(userId);

      if (result.error) {
        res.status(404).json({
          success: false,
          error: result.error,
          message: 'Profile not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        user: result.user
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve profile'
      });
    }
  };

  /**
   * Update current user profile
   */
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const result = await this.userService.updateUserProfile(userId, updateData);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to update profile'
        });
        return;
      }

      logger.info('Profile updated successfully', {
        userId,
        updatedFields: Object.keys(updateData)
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: result.user
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update profile'
      });
    }
  };

  /**
   * Get all users (Admin only)
   */
  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.query.role as string;
      const search = req.query.search as string;

      const result = await this.userService.getAllUsers({
        page,
        limit,
        role,
        search
      });

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to retrieve users'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        users: result.users,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve users'
      });
    }
  };

  /**
   * Get user by ID (Admin only)
   */
  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const result = await this.userService.getUserProfile(userId);

      if (result.error) {
        res.status(404).json({
          success: false,
          error: result.error,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        user: result.user
      });

    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve user'
      });
    }
  };

  /**
   * Activate user account (Admin only)
   */
  public activateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      const result = await this.userService.updateUserStatus(userId, true);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to activate user'
        });
        return;
      }

      logger.info('User activated', {
        userId,
        activatedBy: adminId
      });

      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        user: result.user
      });

    } catch (error) {
      logger.error('Activate user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to activate user'
      });
    }
  };

  /**
   * Deactivate user account (Admin only)
   */
  public deactivateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      // Prevent admin from deactivating themselves
      if (userId === adminId) {
        res.status(400).json({
          success: false,
          error: 'Cannot deactivate your own account'
        });
        return;
      }

      const result = await this.userService.updateUserStatus(userId, false);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to deactivate user'
        });
        return;
      }

      logger.info('User deactivated', {
        userId,
        deactivatedBy: adminId
      });

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        user: result.user
      });

    } catch (error) {
      logger.error('Deactivate user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to deactivate user'
      });
    }
  };

  /**
   * Update user role (Admin only)
   */
  public updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { userId } = req.params;
      const { role } = req.body;
      const adminId = req.user?.id;

      // Prevent admin from changing their own role
      if (userId === adminId) {
        res.status(400).json({
          success: false,
          error: 'Cannot change your own role'
        });
        return;
      }

      const result = await this.userService.updateUserRole(userId, role);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to update user role'
        });
        return;
      }

      logger.info('User role updated', {
        userId,
        newRole: role,
        updatedBy: adminId
      });

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        user: result.user
      });

    } catch (error) {
      logger.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update user role'
      });
    }
  };

  /**
   * Delete user account (Admin only)
   */
  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      // Prevent admin from deleting themselves
      if (userId === adminId) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete your own account'
        });
        return;
      }

      const result = await this.userService.deleteUser(userId);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to delete user'
        });
        return;
      }

      logger.info('User deleted', {
        userId,
        deletedBy: adminId
      });

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete user'
      });
    }
  };
}
