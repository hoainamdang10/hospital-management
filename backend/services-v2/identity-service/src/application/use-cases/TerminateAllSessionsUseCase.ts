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
        terminatedCount = await this.sessionRepository.deactivateAllExcept(
          request.userId,
          request.currentSessionId
        );
      } else {
        // Terminate all sessions
        terminatedCount = await this.sessionRepository.deleteAllByUserId(request.userId);
      }

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

