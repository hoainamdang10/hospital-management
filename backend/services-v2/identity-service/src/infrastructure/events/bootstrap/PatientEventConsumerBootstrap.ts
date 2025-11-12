/**
 * Patient Event Consumer Bootstrap
 * Initializes and starts the patient event consumer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { PatientEventConsumer } from '../PatientEventConsumer';
import { PatientUpdatedEventHandler } from '../handlers/PatientUpdatedEventHandler';
import { PATIENT_EVENT_CONFIG } from '../config/PatientEventConfig';
import { ILogger } from '@shared/application/services/logger.interface';
import { IUserRepository } from '../../../application/repositories/IUserRepository';
import { AuditService } from '../../audit/AuditService';

/**
 * Bootstrap patient event consumer
 */
export async function bootstrapPatientEventConsumer(
  logger: ILogger,
  userRepository: IUserRepository,
  auditService: AuditService
): Promise<PatientEventConsumer> {
  try {
    logger.info('Bootstrapping Patient Event Consumer');

    // Create event handler
    const patientUpdatedEventHandler = new PatientUpdatedEventHandler(
      logger,
      userRepository
    );

    // Create consumer
    const consumer = new PatientEventConsumer(
      {
        rabbitmqUrl: PATIENT_EVENT_CONFIG.rabbitmq.url,
        queueName: PATIENT_EVENT_CONFIG.queue.name,
        exchangeName: PATIENT_EVENT_CONFIG.rabbitmq.exchange,
        routingKeys: PATIENT_EVENT_CONFIG.queue.routingKeys,
        deadLetterExchange: PATIENT_EVENT_CONFIG.queue.deadLetterExchange,
        deadLetterQueue: PATIENT_EVENT_CONFIG.queue.deadLetterQueue,
        maxRetries: PATIENT_EVENT_CONFIG.queue.maxRetries,
        connectionRetries: PATIENT_EVENT_CONFIG.consumer.connectionRetries,
        connectionRetryDelayMs: PATIENT_EVENT_CONFIG.consumer.connectionRetryDelayMs,
      },
      logger,
      patientUpdatedEventHandler,
      auditService
    );

    // Start consuming events
    await consumer.start();

    logger.info('Patient Event Consumer bootstrapped successfully');

    return consumer;

  } catch (error) {
    logger.error('Failed to bootstrap Patient Event Consumer', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
