import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import logger from '@hospital/shared/dist/utils/logger';

export class SessionController {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  /**
   * Get current session info
   */
  public getCurrentSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!userId || !token) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const result = await this.sessionService.getCurrentSession(userId, token);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to get session info'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Session info retrieved successfully',
        session: result.session
      });

    } catch (error) {
      logger.error('Get current session error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get session info'
      });
    }
  };

  /**
   * Get all active sessions for current user
   */
  public getUserSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const result = await this.sessionService.getUserSessions(userId);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to get user sessions'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User sessions retrieved successfully',
        sessions: result.sessions
      });

    } catch (error) {
      logger.error('Get user sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get user sessions'
      });
    }
  };

  /**
   * Revoke all sessions for current user
   */
  public revokeAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const result = await this.sessionService.revokeAllUserSessions(userId);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to revoke sessions'
        });
        return;
      }

      logger.info('All sessions revoked for user', { userId });

      res.status(200).json({
        success: true,
        message: 'All sessions revoked successfully'
      });

    } catch (error) {
      logger.error('Revoke all sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to revoke sessions'
      });
    }
  };

  /**
   * Get all active sessions (Admin only)
   */
  public getAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.query.user_id as string;

      const result = await this.sessionService.getAllSessions({
        page,
        limit,
        userId
      });

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to get all sessions'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'All sessions retrieved successfully',
        sessions: result.sessions,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Get all sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get all sessions'
      });
    }
  };

  /**
   * Revoke all sessions for a specific user (Admin only)
   */
  public revokeUserSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      const result = await this.sessionService.revokeAllUserSessions(userId);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to revoke user sessions'
        });
        return;
      }

      logger.info('User sessions revoked by admin', {
        userId,
        revokedBy: adminId
      });

      res.status(200).json({
        success: true,
        message: 'User sessions revoked successfully'
      });

    } catch (error) {
      logger.error('Revoke user sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to revoke user sessions'
      });
    }
  };
}
