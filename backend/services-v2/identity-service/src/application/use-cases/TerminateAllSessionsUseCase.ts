/**
 * TerminateAllSessionsUseCase
 * Use case for terminating all sessions except the current one
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { ILogger } from '../services/ILogger';

export interface TerminateAllSessionsRequest {
  userId: string;
  currentSessionId?: string; // If provided, this session will not be terminated
}

export interface TerminateAllSessionsResponse {
  success: boolean;
  message: string;
  terminatedCount: number;
}

export class TerminateAllSessionsUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly logger: ILogger
  ) {}

  async execute(request: TerminateAllSessionsRequest): Promise<TerminateAllSessionsResponse> {
    try {
      // Validate input
      if (!request.userId) {
        throw new Error('User ID is required');
      }

      let terminatedCount: number;

      if (request.currentSessionId) {
        // Terminate all sessions except the current one
        this.logger.info('Terminating all sessions except current', {
          userId: request.userId,
          currentSessionId: request.currentSessionId
        });
        
        terminatedCount = await this.sessionRepository.deactivateAllExcept(
          request.userId,
          request.currentSessionId
        );
      } else {
        // CRITICAL: If no currentSessionId, we should NOT delete all sessions
        // This is a safety measure to prevent accidental deletion of all sessions
        // Instead, we log a warning and return an error
        this.logger.warn('Attempted to terminate all sessions without currentSessionId', {
          userId: request.userId
        });
        
        throw new Error(
          'Cannot terminate all sessions: current session ID not found. ' +
          'This is a safety measure to prevent accidental deletion of all sessions.'
        );
      }

      this.logger.info('Sessions terminated successfully', {
        userId: request.userId,
        terminatedCount
      });

      return {
        success: true,
        message: `Successfully terminated ${terminatedCount} session(s)`,
        terminatedCount
      };

    } catch (error: any) {
      this.logger.error('Error terminating all sessions', {
        userId: request.userId,
        currentSessionId: request.currentSessionId,
        error: error.message
      });
      throw new Error(`Failed to terminate all sessions: ${error.message}`);
    }
  }
}

