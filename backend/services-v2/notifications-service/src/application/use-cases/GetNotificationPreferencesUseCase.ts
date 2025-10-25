/**
 * GetNotificationPreferencesUseCase - Query Use Case
 * Get user notification preferences
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */

import { SupabasePreferencesRepository, NotificationPreferences } from '../../infrastructure/persistence/SupabasePreferencesRepository';

export interface GetPreferencesQuery {
  userId: string;
}

export interface GetPreferencesResult {
  preferences: NotificationPreferences;
}

export class GetNotificationPreferencesUseCase {
  constructor(private readonly preferencesRepository: SupabasePreferencesRepository) {}

  async execute(query: GetPreferencesQuery): Promise<GetPreferencesResult> {
    try {
      const preferences = await this.preferencesRepository.getOrCreate(
        query.userId,
        'PATIENT'
      );

      return { preferences };
    } catch (error) {
      throw new Error(`Failed to get preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

