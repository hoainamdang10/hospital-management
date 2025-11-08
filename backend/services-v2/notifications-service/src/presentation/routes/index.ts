/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express } from 'express';
import { DIContainer } from '@shared/infrastructure/di/container';
import { createTemplateRoutes } from './templateRoutes';
import { TemplateController } from '../controllers/TemplateController';
import { GetTemplatesUseCase } from '../../application/use-cases/GetTemplatesUseCase';
import { CreateTemplateUseCase } from '../../application/use-cases/CreateTemplateUseCase';
import { UpdateTemplateUseCase } from '../../application/use-cases/UpdateTemplateUseCase';
import { DeleteTemplateUseCase } from '../../application/use-cases/DeleteTemplateUseCase';

export function setupRoutes(app: Express, container: DIContainer): void {
  // Resolve use cases from DI container
  const getTemplatesUseCase = container.resolve('GetTemplatesUseCase') as GetTemplatesUseCase;
  const createTemplateUseCase = container.resolve('CreateTemplateUseCase') as CreateTemplateUseCase;
  const updateTemplateUseCase = container.resolve('UpdateTemplateUseCase') as UpdateTemplateUseCase;
  const deleteTemplateUseCase = container.resolve('DeleteTemplateUseCase') as DeleteTemplateUseCase;

  // Create template controller
  const templateController = new TemplateController(
    getTemplatesUseCase,
    createTemplateUseCase,
    updateTemplateUseCase,
    deleteTemplateUseCase
  );

  // Mount template routes
  app.use('/api/v1/notifications/templates', createTemplateRoutes(templateController));

  // Setup API routes
  app.get('/api/sample', (_req, res) => {
    res.json({
      message: 'Notifications Service API',
      features: ["Email","SMS","Push Notifications","Templates"],
      patterns: ["Observer","Template Method","Circuit Breaker"]
    });
  });
}
